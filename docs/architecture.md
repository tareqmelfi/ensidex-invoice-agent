# Architecture

```mermaid
flowchart LR
  U[User<br/>WhatsApp-style chat<br/>Arabic / English] -->|POST /api/chat| H[Hono API<br/>Node 22]
  subgraph Server
    H --> A[Agent loop<br/>tool calling]
    A -->|no key| O[Offline parser<br/>dates, amounts, AR/EN]
    A --> T[Tool router]
    O --> T
    T --> P{PayPal client}
  end
  A <-->|chat/completions + tools| R[(OpenRouter LLM)]
  P -->|creds set| S[(PayPal Sandbox<br/>Invoicing v2 · Orders v2)]
  P -->|no creds| M[(In-memory mock)]
  S --> E[Client receives<br/>PayPal invoice email / pay link]
```

Tools exposed to the model: `create_invoice` (create + send), `send_invoice`, `remind_invoice`,
`get_invoice_status`, `list_invoices` (used for AI unpaid-invoice summaries), `create_payment_link` (Orders v2 approve URL).
