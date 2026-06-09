import {
  assertPublicUrl,
  compactWhitespace,
  containsSensitive,
  crawlPublicSite,
  env,
  isDryRun,
  normalizeApiBaseUrl,
  scrubContactDetails,
  sourcePagesForOutput,
  truncate
} from "./site-engine.mjs";

const DEFAULT_MODEL = "gpt-5.4-mini";

export function defaultInput() {
  return {
    yourCompanyUrl: "https://example.com",
    competitorUrls: [{ url: "https://example.org" }],
    buyerPersona: "founder, sales leader, or product marketer",
    marketContext: "B2B SaaS",
    reportGoal: "Create a sales-ready competitor battlecard from public website evidence.",
    language: "English",
    maxPagesPerCompany: 3,
    maxCharsPerCompany: 14000,
    includePricingSignals: true
  };
}

function normalizeUrlList(value, label, maxItems) {
  const raw = Array.isArray(value) ? value : [];
  const urls = raw
    .map((item) => typeof item === "string" ? item : item?.url)
    .filter(Boolean)
    .map((url, index) => assertPublicUrl(url, `${label}[${index}]`).href);
  return [...new Set(urls)].slice(0, maxItems);
}

function normalizeInput(input = {}) {
  const defaults = defaultInput();
  const yourCompanyUrl = assertPublicUrl(input.yourCompanyUrl || defaults.yourCompanyUrl, "yourCompanyUrl").href;
  const competitorUrls = normalizeUrlList(input.competitorUrls || defaults.competitorUrls, "competitorUrls", 10);
  if (!competitorUrls.length) {
    throw new Error("competitorUrls must include at least one public competitor URL.");
  }

  return {
    ...defaults,
    ...input,
    yourCompanyUrl,
    competitorUrls,
    buyerPersona: truncate(input.buyerPersona || defaults.buyerPersona, 250),
    marketContext: truncate(input.marketContext || defaults.marketContext, 800),
    reportGoal: truncate(input.reportGoal || defaults.reportGoal, 1000),
    language: ["English", "Spanish", "French", "German"].includes(input.language) ? input.language : "English",
    maxPagesPerCompany: Math.min(Math.max(Number(input.maxPagesPerCompany || 3), 1), 5),
    maxCharsPerCompany: Math.min(Math.max(Number(input.maxCharsPerCompany || 14000), 4000), 24000),
    includePricingSignals: input.includePricingSignals !== false
  };
}

function crawlerInput(input) {
  return {
    maxPagesPerSite: input.maxPagesPerCompany,
    maxCharsPerSite: input.maxCharsPerCompany
  };
}

async function crawlCompany(url, input, hooks = {}, role = "company") {
  hooks.onFetch?.({ role, url, pageIndex: 0 });
  return crawlPublicSite(url, crawlerInput(input), {
    onFetch: (details) => hooks.onFetch?.({ role, ...details })
  });
}

function buildPrompt({ input, ownSite, competitorSite }) {
  return [
    "Create a sales-ready SaaS competitor battlecard from public website text.",
    "",
    "Rules:",
    "- Use only the supplied public website text. Clearly mark uncertainty.",
    "- Do not output scraped email addresses, phone numbers, private data, or personal contact details.",
    "- Do not invent customers, revenue, funding, compliance status, integrations, pricing, or technical claims.",
    "- Prefer practical, buyer-facing insights over generic advice.",
    "- If pricing is not visible, say so and infer only packaging signals from public copy.",
    `- Write in ${input.language}.`,
    "",
    `Buyer persona: ${input.buyerPersona}`,
    `Market context: ${input.marketContext}`,
    `Report goal: ${input.reportGoal}`,
    `Include pricing signals: ${input.includePricingSignals ? "yes" : "no"}`,
    "",
    "Our public website text:",
    ownSite.sourceText,
    "",
    "Competitor public website text:",
    competitorSite.sourceText,
    "",
    "Return strict JSON only, with this shape:",
    JSON.stringify({
      competitorName: "string",
      competitorPositioning: "string",
      pricingSignals: ["string"],
      likelyStrengths: ["string"],
      likelyWeaknesses: ["string"],
      differentiationAngles: ["string"],
      objectionHandlers: [
        {
          objection: "string",
          response: "string"
        }
      ],
      salesTalkTracks: ["string"],
      landingPageTakeaways: ["string"],
      recommendedNextActions: ["string"],
      confidence: "low|medium|high",
      caveats: ["string"]
    }, null, 2)
  ].join("\n");
}

function fallbackCompanyName(site) {
  const first = site.pages[0];
  if (!first) return new URL(site.startUrl).hostname.replace(/^www\./, "");
  const title = first.title.split(/[|-]/)[0]?.trim();
  return title || new URL(site.startUrl).hostname.replace(/^www\./, "");
}

function dryRunBattlecard({ input, competitorSite }) {
  const competitorName = fallbackCompanyName(competitorSite);
  return {
    competitorName,
    competitorPositioning: "Dry-run mode fetched public pages but did not call a model for positioning analysis.",
    pricingSignals: input.includePricingSignals
      ? ["Pricing signals require a model-backed run unless they are obvious in the fetched page titles or descriptions."]
      : [],
    likelyStrengths: [
      "Public website was reachable.",
      `Fetched ${competitorSite.pages.length} public page(s).`
    ],
    likelyWeaknesses: [
      "Dry-run output is only a format preview.",
      "Run with DRY_RUN=false for evidence-based comparison."
    ],
    differentiationAngles: [
      "Position against public claims only after a model-backed comparison."
    ],
    objectionHandlers: [
      {
        objection: "Why choose us instead?",
        response: "Use a model-backed run to generate a specific answer from both websites."
      }
    ],
    salesTalkTracks: [
      `Use this dry-run preview to confirm ${competitorName} can be processed.`
    ],
    landingPageTakeaways: [
      "Public pages were fetchable and ready for analysis."
    ],
    recommendedNextActions: [
      "Set DRY_RUN=false with model credentials before using the output in sales material."
    ],
    confidence: "low",
    caveats: [
      "This is dry-run output and did not call a model.",
      "No private pages, accounts, contact details, or customer data were processed."
    ]
  };
}

function extractJson(text) {
  const value = String(text || "").trim();
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : value;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return a JSON object.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function list(value, maxItems = 8) {
  return Array.isArray(value)
    ? value.map(compactWhitespace).filter(Boolean).slice(0, maxItems)
    : [];
}

function normalizeBattlecard(card, input) {
  return {
    competitorName: compactWhitespace(card.competitorName),
    competitorPositioning: compactWhitespace(card.competitorPositioning),
    pricingSignals: input.includePricingSignals ? list(card.pricingSignals, 8) : [],
    likelyStrengths: list(card.likelyStrengths, 8),
    likelyWeaknesses: list(card.likelyWeaknesses, 8),
    differentiationAngles: list(card.differentiationAngles, 8),
    objectionHandlers: Array.isArray(card.objectionHandlers)
      ? card.objectionHandlers.map((item) => ({
          objection: compactWhitespace(item?.objection),
          response: scrubContactDetails(item?.response || "")
        })).filter((item) => item.objection || item.response).slice(0, 6)
      : [],
    salesTalkTracks: list(card.salesTalkTracks, 8).map(scrubContactDetails),
    landingPageTakeaways: list(card.landingPageTakeaways, 8),
    recommendedNextActions: list(card.recommendedNextActions, 8),
    confidence: ["low", "medium", "high"].includes(card.confidence) ? card.confidence : "medium",
    caveats: list(card.caveats, 6)
  };
}

async function modelBattlecard({ input, ownSite, competitorSite }) {
  const baseUrl = normalizeApiBaseUrl(env("LLM_BASE_URL", env("UPSTREAM_BASE_URL", "https://xcode.best/v1")));
  const apiKey = env("LLM_API_KEY", env("UPSTREAM_API_KEY"));
  const model = env("LLM_MODEL", env("DEFAULT_MODEL", DEFAULT_MODEL));
  if (!apiKey) throw new Error("LLM_API_KEY is required when DRY_RUN=false.");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You create evidence-based SaaS competitor battlecards from public website text."
        },
        {
          role: "user",
          content: buildPrompt({ input, ownSite, competitorSite })
        }
      ],
      temperature: Number(env("LLM_TEMPERATURE", "0.2")),
      max_tokens: Number(env("MAX_OUTPUT_TOKENS", "1600"))
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Model request failed: HTTP ${response.status} ${data.error?.message || data.error || ""}`.trim());
  }

  const content = data.choices?.[0]?.message?.content || "";
  return {
    battlecard: normalizeBattlecard(extractJson(content), input),
    model,
    usage: data.usage || null
  };
}

async function processCompetitor(url, input, ownSite, hooks = {}) {
  const competitorSite = await crawlCompany(url, input, hooks, "competitor");
  const modelResult = isDryRun()
    ? { battlecard: dryRunBattlecard({ input, competitorSite }), model: "dry-run", usage: null }
    : await modelBattlecard({ input, ownSite, competitorSite });

  return {
    status: "succeeded",
    competitorUrl: url,
    normalizedCompetitorUrl: assertPublicUrl(url).href,
    yourCompanyUrl: input.yourCompanyUrl,
    dryRun: isDryRun(),
    model: modelResult.model,
    usage: modelResult.usage,
    ...modelResult.battlecard,
    sourcePages: {
      yourCompany: sourcePagesForOutput(ownSite.pages),
      competitor: sourcePagesForOutput(competitorSite.pages)
    },
    createdAt: new Date().toISOString()
  };
}

export async function createBattlecardRun(rawInput, hooks = {}) {
  const input = normalizeInput(rawInput);
  const sensitiveCheck = [
    input.buyerPersona,
    input.marketContext,
    input.reportGoal
  ].join("\n");
  if (containsSensitive(sensitiveCheck)) {
    throw new Error("Input appears to contain sensitive material. Remove secrets before running.");
  }

  const ownSite = await crawlCompany(input.yourCompanyUrl, input, hooks, "your-company");
  const records = [];
  for (const url of input.competitorUrls) {
    try {
      records.push(await processCompetitor(url, input, ownSite, hooks));
    } catch (error) {
      records.push({
        status: "failed",
        competitorUrl: url,
        yourCompanyUrl: input.yourCompanyUrl,
        error: error.message,
        dryRun: isDryRun(),
        createdAt: new Date().toISOString()
      });
    }
  }

  return {
    summary: {
      totalCompetitors: records.length,
      succeeded: records.filter((record) => record.status === "succeeded").length,
      failed: records.filter((record) => record.status === "failed").length,
      dryRun: isDryRun(),
      model: isDryRun() ? "dry-run" : env("LLM_MODEL", env("DEFAULT_MODEL", DEFAULT_MODEL))
    },
    input: {
      yourCompanyUrl: input.yourCompanyUrl,
      competitorUrls: input.competitorUrls,
      buyerPersona: input.buyerPersona,
      marketContext: input.marketContext,
      reportGoal: input.reportGoal,
      language: input.language,
      maxPagesPerCompany: input.maxPagesPerCompany,
      maxCharsPerCompany: input.maxCharsPerCompany,
      includePricingSignals: input.includePricingSignals
    },
    records,
    createdAt: new Date().toISOString()
  };
}

export function renderRunMarkdown(run) {
  const lines = [
    "# SaaS Competitor Battlecards",
    "",
    `Generated: ${run.createdAt}`,
    `Dry run: ${run.summary.dryRun}`,
    `Succeeded: ${run.summary.succeeded}/${run.summary.totalCompetitors}`,
    `Your company: ${run.input.yourCompanyUrl}`,
    ""
  ];

  for (const record of run.records) {
    lines.push(`## ${record.status === "succeeded" ? record.competitorName : record.competitorUrl}`, "");
    if (record.status !== "succeeded") {
      lines.push(`Failed: ${record.error}`, "");
      continue;
    }

    lines.push(`Competitor URL: ${record.normalizedCompetitorUrl}`);
    lines.push(`Confidence: ${record.confidence}`, "");
    lines.push("### Positioning", "", record.competitorPositioning || "Not enough public text.", "");

    if (record.pricingSignals?.length) {
      lines.push("### Pricing Signals", "");
      for (const item of record.pricingSignals) lines.push(`- ${item}`);
      lines.push("");
    }

    lines.push("### Likely Strengths", "");
    for (const item of record.likelyStrengths || []) lines.push(`- ${item}`);
    lines.push("", "### Likely Weaknesses", "");
    for (const item of record.likelyWeaknesses || []) lines.push(`- ${item}`);
    lines.push("", "### Differentiation Angles", "");
    for (const item of record.differentiationAngles || []) lines.push(`- ${item}`);

    if (record.objectionHandlers?.length) {
      lines.push("", "### Objection Handlers", "");
      for (const item of record.objectionHandlers) {
        lines.push(`- Objection: ${item.objection}`);
        lines.push(`  Response: ${item.response}`);
      }
    }

    lines.push("", "### Sales Talk Tracks", "");
    for (const item of record.salesTalkTracks || []) lines.push(`- ${item}`);
    lines.push("", "### Landing Page Takeaways", "");
    for (const item of record.landingPageTakeaways || []) lines.push(`- ${item}`);
    lines.push("", "### Recommended Next Actions", "");
    for (const item of record.recommendedNextActions || []) lines.push(`- ${item}`);
    lines.push("", "### Caveats", "");
    for (const item of record.caveats || []) lines.push(`- ${item}`);
    lines.push("");
  }

  return lines.join("\n");
}
