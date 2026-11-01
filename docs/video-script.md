# 3-minute demo video: script and shot list (target 2:45)

| # | Time | Shot | Voice-over (EN) |
|---|---|---|---|
| 1 | 0:00–0:15 | Title card "ENSIDEX Invoice Agent". Then a phone with a chat full of "did you send the invoice?" | "Freelancers live in chat, but invoicing still means dashboards and forms. What if billing were just a message?" |
| 2 | 0:15–0:30 | Browser at localhost:8787. Header shows "PayPal: sandbox · AI: openrouter" | "ENSIDEX Invoice Agent is an AI chat agent built on the PayPal developer platform." |
| 3 | 0:30–1:00 | Type "Bill Ahmed Ali $300 for logo design due Friday". Reply plus action card. Cut to the PayPal sandbox dashboard showing the invoice as SENT, then the sandbox client's email | "One sentence. The agent picks the client, amount and purpose, turns 'Friday' into a date, and creates and sends a real PayPal invoice through the Invoicing API." |
| 4 | 1:00–1:25 | Type the Arabic request for Sara (500 SAR, Thursday). RTL reply | "It works in Arabic too: riyals, Thursday, and the reply comes back in Arabic." |
| 5 | 1:25–1:45 | "Payment link $49 for consultation call". Click the link and the PayPal sandbox checkout opens | "Need a one-off payment? The Orders API gives an instant checkout link." |
| 6 | 1:45–2:10 | "Summarize my unpaid invoices". Grouped summary with totals and overdue flags. Then "remind INV2-…" | "The AI reads your PayPal invoices, totals what's outstanding, flags what's overdue, and sends reminders on request." |
| 7 | 2:10–2:30 | VS Code: tools.ts, then the mermaid diagram, then `npm test` passing | "Under the hood: Hono on Node 22, React 19, OpenRouter tool calling, PayPal Invoicing v2 and Orders v2. It also has an offline fallback, so anyone can run it." |
| 8 | 2:30–2:45 | GitHub repo and the docker run command. End card "ENSIDEX Team" | "Open source, MIT, one Docker command. ENSIDEX Invoice Agent: say who owes you, and get paid." |

Recording notes: 1080p, browser zoom at 125%, sandbox credentials loaded. Pre-create one overdue invoice (due yesterday) so the summary shows an overdue flag. Keep the sandbox client inbox open in a second tab.
