# ENSIDEX Invoice Agent

Chat-to-cash for freelancers: type **"Bill Ahmed $300 for logo design due Friday"** (or in Arabic,
**"سو فاتورة لسارة 500 ريال عن تصميم موقع تستحق الخميس"**) and an AI agent creates and sends a real
**PayPal invoice**, generates **PayPal payment links**, sends **reminders**, and **summarizes unpaid invoices**.

Built by **ENSIDEX Team** for the PayPal AI Hackathon.

## Features
- WhatsApp-style web chat, bilingual (Arabic / English, RTL-aware)
- LLM tool calling via OpenRouter → PayPal **Invoicing API v2** (create, send, remind, status, list)
- PayPal **Orders API v2** one-off payment links
- AI summary of outstanding / overdue invoices with suggested reminders
- Works with zero credentials: deterministic offline parser + in-memory mock PayPal for demos and CI

## Quick start
```bash
npm install
cp .env.example .env        # optionally fill OPENROUTER_API_KEY and PAYPAL_CLIENT_ID/SECRET
npm run build
set -a; . ./.env; set +a
npm start                   # http://localhost:8787
```
Dev mode: `npm run dev:server` and `npm run dev:web` (Vite on :5173 proxies `/api`).

### Docker
```bash
docker build -t ensidex-invoice-agent .
docker run -p 8787:8787 --env-file .env ensidex-invoice-agent
```

## PayPal sandbox setup
1. Log in to https://developer.paypal.com → Apps & Credentials → **Sandbox** → Create App.
2. Copy Client ID / Secret into `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET`.
3. Optional: set `PAYPAL_INVOICER_EMAIL` to the sandbox business account email.
4. Use a sandbox *personal* account email as the client's email to see the invoice arrive.

`GET /api/health` shows `paypal: sandbox|mock` and `ai: openrouter|offline`.

### Verified against the real PayPal sandbox
Tested end to end against `api-m.sandbox.paypal.com` (Invoicing v2 + Orders v2) with an OpenRouter model:

| Prompt | Tools called | Result |
|---|---|---|
| "Create an invoice for John Smith … 250 USD for logo design, due 2026-11-30, and send it" | `create_invoice` → `send_invoice` | Invoice in status `SENT` with a payer link |
| "سو فاتورة لأحمد علي … بمبلغ 500 دولار مقابل استشارة تقنية وأرسلها" | `create_invoice` → `send_invoice` | Arabic reply, invoice `SENT` |
| "اعرض لي كل الفواتير" | `list_invoices` | Arabic summary of every invoice |
| "Create a payment link for 40 USD" | `create_payment_link` | Sandbox checkout approval URL |

Run it in sandbox mode:
```bash
cp .env.example .env   # fill PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, OPENROUTER_API_KEY (never commit .env)
npm install && npm run build && npm start   # http://localhost:8787
```

## Demo
- Video: [`docs/demo/demo.mp4`](docs/demo/demo.mp4) (headless browser recording against the real sandbox)
- Screenshots: [`docs/demo/`](docs/demo/) – home, English invoice, Arabic invoice, Arabic invoice list

## API
| Method | Path | Body |
|---|---|---|
| GET | `/api/health` | – |
| GET | `/api/invoices` | – |
| POST | `/api/chat` | `{ "messages": [{ "role": "user", "content": "..." }] }` → `{ reply, actions[], engine }` |

## Tests
`npm test` covers date resolution (EN/AR), parsing, the offline agent end-to-end on the mock,
the OpenRouter tool-calling loop (mocked fetch) and the HTTP API.

## Architecture
See [docs/architecture.md](docs/architecture.md).

## License
MIT © ENSIDEX Team
