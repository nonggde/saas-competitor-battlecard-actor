import * as cheerio from "cheerio";

const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bsk-[a-z0-9_\-]{20,}\b/i,
  /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*["']?[a-z0-9_.\-]{16,}/i,
  /\beyJ[a-z0-9_\-]{20,}\.[a-z0-9_\-]{20,}\.[a-z0-9_\-]{10,}\b/i
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;

export function env(name, fallback = "") {
  return process.env[name] || fallback;
}

export function normalizeApiBaseUrl(value) {
  const stripped = String(value || "")
    .trim()
    .replace(/\/$/, "")
    .replace(/\/chat\/completions$/, "");

  try {
    const parsed = new URL(stripped);
    if (parsed.pathname === "/" || parsed.pathname === "") {
      parsed.pathname = "/v1";
      return parsed.href.replace(/\/$/, "");
    }
  } catch {
    return stripped;
  }

  return stripped;
}

export function isDryRun() {
  return String(env("DRY_RUN", "true")).toLowerCase() !== "false";
}

export function compactWhitespace(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, maxChars) {
  const value = compactWhitespace(text);
  if (value.length <= maxChars) return value;
  return `${value.slice(0, maxChars)}\n\n[Truncated at ${maxChars} characters]`;
}

export function containsSensitive(text) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(text));
}

export function scrubContactDetails(text) {
  return compactWhitespace(text)
    .replace(EMAIL_PATTERN, "[email redacted]")
    .replace(PHONE_PATTERN, "[phone redacted]");
}

function hostLooksPrivate(host) {
  const value = host.toLowerCase();
  return value === "localhost"
    || value === "127.0.0.1"
    || value === "::1"
    || value.endsWith(".local")
    || value.startsWith("10.")
    || value.startsWith("192.168.")
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
    || /^169\.254\./.test(value);
}

export function assertPublicUrl(value, label = "url") {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${label} must use http or https.`);
  }
  if (parsed.username || parsed.password) {
    throw new Error(`${label} must not include usernames or passwords.`);
  }
  if (hostLooksPrivate(parsed.hostname)) {
    throw new Error(`${label} must be a public URL, not a local or private network address.`);
  }
  parsed.hash = "";
  return parsed;
}

function linkPriority(parsedUrl, anchorText = "") {
  const text = `${parsedUrl.pathname} ${anchorText}`.toLowerCase();
  const priorities = [
    [/\/($|\?)/, 0],
    [/(product|platform|solution|service|features)/, 1],
    [/(pricing|plans)/, 2],
    [/(customers|case-stud|reviews|testimonials)/, 3],
    [/(about|company|team)/, 4],
    [/(industries|use-cases|usecases)/, 5]
  ];
  const match = priorities.find(([pattern]) => pattern.test(text));
  return match ? match[1] : 20;
}

function shouldSkipUrl(parsedUrl) {
  const path = parsedUrl.pathname.toLowerCase();
  return /\.(pdf|zip|png|jpg|jpeg|webp|gif|svg|mp4|mov|mp3|css|js|xml)$/i.test(path)
    || path.includes("/login")
    || path.includes("/signin")
    || path.includes("/sign-in")
    || path.includes("/account")
    || path.includes("/admin")
    || path.includes("/cart")
    || path.includes("/checkout")
    || path.includes("/privacy")
    || path.includes("/terms");
}

function extractInternalLinks($, pageUrl) {
  const base = new URL(pageUrl);
  const links = [];
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href) return;
    let parsed;
    try {
      parsed = new URL(href, base);
    } catch {
      return;
    }
    if (parsed.origin !== base.origin) return;
    parsed.hash = "";
    if (shouldSkipUrl(parsed)) return;
    links.push({
      url: parsed.href,
      priority: linkPriority(parsed, $(element).text())
    });
  });

  return links
    .sort((a, b) => a.priority - b.priority || a.url.length - b.url.length)
    .map((item) => item.url);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPage(url, maxChars) {
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "saas-competitor-battlecard-actor/0.1 (+https://apify.com)"
    },
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text();
  if (containsSensitive(raw)) {
    throw new Error(`Fetched content from ${url} appears to contain sensitive material. Refusing to process.`);
  }

  if (contentType.includes("text/html") || raw.includes("<html")) {
    const $ = cheerio.load(raw);
    const title = compactWhitespace($("title").first().text());
    const description = compactWhitespace($('meta[name="description"]').attr("content") || "");
    $("script, style, noscript, svg, form, input, textarea, select").remove();
    const headings = $("h1,h2,h3")
      .map((_, element) => compactWhitespace($(element).text()))
      .get()
      .filter(Boolean)
      .slice(0, 40);
    const body = scrubContactDetails($("body").text());
    const text = truncate([
      title ? `Title: ${title}` : "",
      description ? `Meta description: ${description}` : "",
      headings.length ? `Headings: ${headings.join(" | ")}` : "",
      body
    ].filter(Boolean).join("\n"), maxChars);

    return {
      url,
      title,
      description,
      headings,
      text,
      chars: text.length,
      links: extractInternalLinks($, url)
    };
  }

  const text = truncate(scrubContactDetails(raw), maxChars);
  return {
    url,
    title: "",
    description: "",
    headings: [],
    text,
    chars: text.length,
    links: []
  };
}

export async function crawlPublicSite(startUrl, input, hooks = {}) {
  const queue = [assertPublicUrl(startUrl).href];
  const visited = new Set();
  const pages = [];
  const pageCharCap = Math.min(9000, input.maxCharsPerSite);

  while (queue.length && pages.length < input.maxPagesPerSite) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    hooks.onFetch?.({ url, pageIndex: pages.length + 1 });

    const page = await fetchPage(url, pageCharCap);
    pages.push(page);

    for (const link of page.links) {
      if (!visited.has(link) && !queue.includes(link) && queue.length < 25) {
        queue.push(link);
      }
    }
  }

  const sourceText = truncate(pages.map((page, index) => [
    `Source page ${index + 1}: ${page.url}`,
    page.text
  ].join("\n")).join("\n\n"), input.maxCharsPerSite);

  return {
    startUrl,
    pages,
    sourceText
  };
}

export function sourcePagesForOutput(pages) {
  return pages.map((page) => ({
    url: page.url,
    title: page.title,
    description: page.description,
    chars: page.chars
  }));
}
