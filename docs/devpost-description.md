# ENSIDEX Invoice Agent — Devpost submission text

**Tagline:** Say who owes you and why. The agent sends the PayPal invoice.

## Inspiration
Freelancers and small shops in emerging markets run their business on chat, but billing still means
logging into dashboards and filling in forms. Invoices go out late, reminders never go out, and cash flow suffers. We wanted
billing to be as fast as sending a message, in Arabic or English.

## What it does
ENSIDEX Invoice Agent is a WhatsApp-style chat assistant on top of the PayPal developer platform:
- "Bill Ahmed Ali $300 for logo design due Friday" → creates **and sends** a PayPal invoice (Invoicing API v2), resolving "Friday" to a real due date.
- Arabic works the same way: "سو فاتورة لسارة 500 ريال عن تصميم موقع تستحق الخميس" → SAR invoice due Thursday.
- "Payment link $49 for a consultation call" → a PayPal checkout link (Orders API v2).
- "Remind INV2-…" → a PayPal reminder. "Status of …" → live status.
- "Summarize my unpaid invoices" → the AI groups outstanding invoices, totals them, flags overdue ones and suggests who to nudge.

## How we built it
- **Backend:** Hono on Node 22 (TypeScript). It runs an LLM tool-calling loop through OpenRouter, with six PayPal tools.
- **PayPal:** OAuth2 client credentials, Invoicing v2 (`generate-next-invoice-number`, create, send, remind, get, list) and Orders v2.
- **Frontend:** React 19 + Vite, an RTL-aware chat UI with action cards (invoice / payment links).
- **Resilience:** a deterministic bilingual parser and an in-memory PayPal mock, so the app runs and tests pass with no credentials.
- **Deployment:** a single Docker image, MIT-licensed.

## Challenges
- Turning relative dates in two languages ("Friday", "الخميس", "بكرة") into exact due dates. We give the model a 7-day calendar table and keep a rule-based fallback.
- Keeping the agent decisive: it acts when the client, amount and purpose are present, and asks only one short question when something essential is missing.

## Accomplishments
End-to-end bilingual flow from a sentence to a sent PayPal invoice, plus reminders, summaries and payment links, with a test suite that covers both the LLM path and the offline path.

## What we learned
Tool calling plus a narrow, well-typed API like PayPal Invoicing makes agents reliable. Most of the remaining difficulty is in language: dates, currencies and names.

## What's next
A real WhatsApp Business API channel, recurring invoices, webhook-driven "paid" notifications, and multi-currency tax lines.

## Built with
typescript, node.js, hono, react, vite, paypal-invoicing-api, paypal-orders-api, openrouter, docker
