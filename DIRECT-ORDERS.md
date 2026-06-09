# Direct Order Workflow

This route exists so the service can earn revenue through crypto or PayPal while the Apify Store listing grows.

## Offer

SaaS Competitor Battlecards

- USD 19 for 5 competitor battlecards
- USD 49 for 15 competitor battlecards
- USD 99-249 for a full competitor pack plus rewritten positioning and sales copy
- Custom batches by quote

## Payment

- Crypto invoice preferred: USDT or USDC first, BTC or ETH if needed.
- PayPal can be used as a backup.
- Do not publish a wallet address until the exact order scope, asset, network, amount, and delivery format are confirmed.
- Do not accept payment-card data, private keys, seed phrases, exchange login details, or wallet recovery material.

## Intake

Ask the buyer for:

- package selected;
- their public company URL;
- public competitor URLs, one per line;
- market context;
- buyer persona;
- output language;
- preferred payment route.

Reject the order if it requires logins, private pages, personal contact scraping, KYC, payment movement, account work, spam sending, private customer data, regulated data, or unclear identity/finance activity.

## Fulfillment

1. Confirm that each URL is public and in scope.
2. Confirm the package and quote.
3. Send payment instructions after scope confirmation.
4. Run the Actor locally or in private Apify with capped pages and characters.
5. Review outputs for hallucinated claims, scraped personal data, and unsafe promises.
6. Deliver Markdown and CSV/table output when possible.
7. Offer one light revision if the buyer provided clear public context.

## Delivery Message

```text
Hi,

The competitor battlecard package is ready.

Included:
- Markdown battlecard file
- JSON/table version when requested
- Positioning, pricing signals, differentiation angles, objection handlers, talk tracks, and recommended next actions for each successful competitor URL

Notes:
- The battlecards are based only on public website content.
- No private pages, account data, personal contact scraping, or guaranteed sales claims are included.
- Please review factual claims before using the material in sales or marketing.

Thanks,
city in the sky
```
