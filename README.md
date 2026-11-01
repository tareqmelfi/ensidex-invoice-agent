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
