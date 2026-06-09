# Publishing Checklist

## Local Readiness

- Run `npm install`.
- Run `npm run check`.
- Run `npm run local-demo`.
- Review `dist/local-demo/BATTLECARDS.md`.
- Confirm no `.env`, API key, token, cookie, wallet secret, or raw private data exists in files.

## Apify Private Test

1. Push the Actor from this directory.
2. Keep `DRY_RUN=true`.
3. Run one test with `https://example.com` as your company and `https://example.org` as competitor.
4. Run one test with harmless public SaaS pages.
5. Confirm one dataset item is created per competitor URL.

## Model Test

1. Add model settings as Apify secrets only:

```text
DRY_RUN=false
LLM_BASE_URL=https://your-openai-compatible-provider/v1
LLM_API_KEY=secret
LLM_MODEL=chosen-model
MAX_OUTPUT_TOKENS=1600
```

2. Process 1-3 public competitor URLs.
3. Check quality, hallucination risk, and token cost.
4. Keep `maxPagesPerCompany` and `maxCharsPerCompany` capped.

## Monetization Setup

- Preferred first setup: one explicit pay-per-event event for each successful competitor battlecard:

```text
competitor-battlecard-generated
```

- Enable `ENABLE_PPE_CHARGE=true` only after the event is configured in Apify pricing.
- Do not also charge the synthetic default dataset item event, or buyers may be charged twice.
- Start at USD 0.19-0.29 per successful battlecard.
- Raise toward USD 0.49 only after model-backed outputs are strong.
- Set a max charge cap based on max competitors.

## Store Listing Copy

Title:

```text
SaaS Competitor Battlecard Generator
```

Subtitle:

```text
Generate sales-ready competitor battlecards, pricing signals, differentiation angles, and objection handlers from public SaaS websites.
```

Use cases:

- competitor research;
- sales enablement;
- product marketing;
- pricing and packaging review;
- agency strategy reports;
- founder-led sales prep.

Boundaries:

- no private pages;
- no contact scraping;
- no account login;
- no guaranteed sales claims;
- no legal, financial, medical, or compliance advice.

## Public Launch Assets

- GitHub repository with English README.
- One dry-run screenshot.
- One model-backed sample with harmless public SaaS pages.
- X post with a short demo screenshot.
- Crypto-first manual order note for direct buyers.
