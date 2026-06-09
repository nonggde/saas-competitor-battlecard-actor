# SaaS Competitor Battlecard Generator

Built by `city in the sky`.

This Apify Actor turns public SaaS websites into sales-ready competitor battlecards. It compares your public website against competitor pages and generates positioning notes, pricing signals, differentiation angles, objection handlers, talk tracks, and recommended next actions.

It is designed for founders, product marketers, sales teams, agencies, and consultants who need fast competitive intelligence without logging into private systems or scraping personal data.

For best results, use competitor product pages, pricing pages, feature pages, or comparison pages instead of only a generic homepage.

## Source-Available, Not Free Resale

This repository is public for evaluation, platform review, and portfolio proof. It is not free open-source software and it does not grant a commercial reuse license.

See [`LICENSE.md`](LICENSE.md). You may view the code and samples to evaluate the workflow, but you may not copy, host, resell, monetize, or use it commercially without written permission.

The paid product is the managed result:

- capped public website extraction;
- model-backed competitor battlecards;
- pricing and packaging observations when public;
- Markdown and JSON delivery;
- safe public-page boundaries;
- optional private deployment or commercial license.

## What It Generates

- Competitor positioning summary
- Pricing and packaging signals
- Likely competitor strengths
- Likely competitor weaknesses
- Differentiation angles
- Sales objection handlers
- Buyer-facing talk tracks
- Landing page takeaways
- Recommended next actions
- Source page metadata

## Input

```json
{
  "yourCompanyUrl": "https://example.com",
  "competitorUrls": [{ "url": "https://example.org" }],
  "buyerPersona": "founder, sales leader, or product marketer",
  "marketContext": "B2B SaaS",
  "reportGoal": "Create a sales-ready competitor battlecard from public website evidence.",
  "language": "English",
  "maxPagesPerCompany": 3,
  "maxCharsPerCompany": 14000,
  "includePricingSignals": true
}
```

## Output

Each successfully processed competitor creates one dataset item with:

- `competitorName`
- `competitorPositioning`
- `pricingSignals`
- `likelyStrengths`
- `likelyWeaknesses`
- `differentiationAngles`
- `objectionHandlers`
- `salesTalkTracks`
- `landingPageTakeaways`
- `recommendedNextActions`
- `confidence`
- `sourcePages`

The Actor also writes `RUN.json` and `BATTLECARDS.md` to the key-value store.

## Local Demo

```powershell
npm install
npm run local-demo
```

Dry-run mode is enabled by default. It fetches public pages and shows the output shape without calling a model.

See [`examples/model-backed-sample.md`](examples/model-backed-sample.md) for a shortened model-backed sample.

## Model-Backed Run

Set these as Apify secrets or local environment variables. Do not commit them.

```text
DRY_RUN=false
LLM_BASE_URL=https://your-openai-compatible-provider/v1
LLM_API_KEY=your-secret-key
LLM_MODEL=your-model-name
MAX_OUTPUT_TOKENS=1600
```

Compatibility aliases are also supported: `UPSTREAM_BASE_URL`, `UPSTREAM_API_KEY`, and `DEFAULT_MODEL`.

If a provider gives only the root domain, such as `https://xcode.best`, the Actor normalizes it to the standard `/v1` API path.

## Monetization Fit

This Actor is a practical pay-per-result tool:

- one dataset item per successfully generated competitor battlecard;
- simple pay-per-event setup with `competitor-battlecard-generated`;
- capped public text extraction;
- no account login;
- no private pages;
- no personal contact scraping;
- structured output that can feed sales enablement, product marketing, CRM notes, or agency reports.

Suggested starter pricing:

- Apify Store pay-per-event: USD 0.19-0.49 per generated competitor battlecard after testing cost and quality.
- Manual service: USD 19-49 for 5 competitor battlecards, delivered as Markdown/CSV.
- Upsell: USD 99-249 for a full competitor pack with rewritten sales copy and landing page recommendations.

See [`APIFY-STORE-LISTING.md`](APIFY-STORE-LISTING.md) for the Store listing package, event pricing notes, private test plan, and approval gates.

## Safety Boundaries

- Public websites only.
- No logins, private pages, credentials, customer data, regulated data, or wallet/payment actions.
- Emails and phone-like contact details are redacted from extracted text.
- The model is instructed not to output scraped contact details or invented claims.
- This is not legal, financial, medical, compliance, or security advice.
