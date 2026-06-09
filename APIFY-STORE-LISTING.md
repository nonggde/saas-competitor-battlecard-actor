# Apify Store Listing Package

Product: `SaaS Competitor Battlecard Generator`

Owner brand: `city in the sky`

## Store Title

```text
SaaS Competitor Battlecard Generator
```

## Short Description

```text
Generate sales-ready competitor battlecards, pricing signals, differentiation angles, and objection handlers from public SaaS websites.
```

## Buyer

- SaaS founders
- product marketers
- sales teams
- agencies selling positioning, CRO, SEO, or outbound services
- consultants doing quick competitive research

## What It Does

The Actor compares one public company URL against one or more public competitor URLs and produces one dataset item per competitor.

Each output can include:

- competitor positioning summary
- public pricing or packaging signals
- likely strengths
- likely weaknesses
- differentiation angles
- objection handlers
- sales talk tracks
- landing page takeaways
- recommended next actions
- source page metadata

## Best Input Guidance

For best results, buyers should provide:

- their homepage or product page as `yourCompanyUrl`;
- competitor product pages, pricing pages, feature pages, or comparison pages as `competitorUrls`;
- buyer persona and market context;
- only public URLs and public context.

Avoid generic homepages when a pricing, product, feature, or comparison page is available.

## Safety Boundary

Accept:

- public websites;
- public pricing pages;
- public product pages;
- public feature pages;
- public comparison pages;
- public market context.

Reject:

- private dashboards;
- logins;
- account pages;
- customer data;
- personal contact scraping;
- API keys;
- cookies;
- payment data;
- wallet secrets;
- KYC, captcha, verification, rebate, or funds movement tasks.

## Suggested Pricing

Start:

```text
USD 0.19-0.29 per successful competitor battlecard
```

Raise after quality and demand are proven:

```text
USD 0.49 per successful competitor battlecard
```

Manual service upsell:

```text
USD 19 for 5 competitor battlecards
USD 49 for 15 competitor battlecards
USD 99-249 for a full competitor pack plus rewritten positioning and sales copy
```

## Pay-Per-Event Setup

Runtime event name:

```text
competitor-battlecard-generated
```

Enable:

```text
ENABLE_PPE_CHARGE=true
```

Only enable the environment flag after the event is configured in Apify pricing. Do not also charge the synthetic default dataset event, or buyers may be charged twice.

Recommended event title:

```text
Competitor battlecard generated
```

Recommended event description:

```text
Charged once per successfully generated competitor battlecard written to the dataset.
```

## Max Charge Guidance

If Apify requires a maximum total charge, use the maximum competitor count multiplied by the event price.

Examples:

- 5 competitors at USD 0.29: max charge USD 1.45
- 10 competitors at USD 0.29: max charge USD 2.90
- 10 competitors at USD 0.49: max charge USD 4.90

## Private Test Plan

1. Push Actor privately to Apify.
2. Keep `DRY_RUN=true`.
3. Run `examples/sample-input.json`.
4. Confirm one dataset item per competitor.
5. Add model secrets only in Apify environment:

```text
DRY_RUN=false
LLM_BASE_URL=https://your-openai-compatible-provider/v1
LLM_API_KEY=secret
LLM_MODEL=gpt-5.4-mini
MAX_OUTPUT_TOKENS=1600
```

6. Run `examples/model-test-input.json`.
7. Review output quality, hallucination risk, and usage cost.
8. Configure `competitor-battlecard-generated`.
9. Set `ENABLE_PPE_CHARGE=true`.
10. Publish on Store after final user confirmation.

## GitHub / Source Strategy

Current recommendation:

- Keep the repo local or private until Apify listing is ready.
- If public proof is needed, publish with the existing source-available license.
- Do not publish API keys, `.env`, Apify tokens, cookies, raw secrets, wallet addresses, or payment credentials.

## Public Launch Post

```text
I built a small Apify Actor for SaaS competitor battlecards.

Input: your public SaaS page plus competitor pages.

Output:
- positioning summary
- public pricing/package signals
- likely strengths and weak spots
- differentiation angles
- objection handlers
- sales talk tracks

Public websites only. No logins, accounts, or private data.
```

## Human Approval Required

Do not perform these steps without explicit user approval:

- public Apify publication;
- public GitHub repo creation;
- paid event enablement;
- adding a real PayPal payment link to a public page;
- posting launch content on X or forums.
