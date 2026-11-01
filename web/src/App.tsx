import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string; actions?: any[] };
const samples = [
  "Bill Ahmed Ali $300 for logo design due Friday",
  "سوّ فاتورة لسارة 500 ريال عن تصميم موقع تستحق الخميس",
  "Payment link $49 for consultation call",
  "Summarize my unpaid invoices",
];

export function App() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: "Hi! Tell me who to bill, how much, and for what. / هلا! قل لي مين تفوتر وكم وعن وش." }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<{ paypal: string; ai: string }>();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { fetch("/api/health").then((r) => r.json()).then(setHealth).catch(() => {}); }, []);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next); setInput(""); setBusy(true);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }) });
      const j = await r.json();
      setMsgs([...next, { role: "assistant", content: j.reply ?? j.error, actions: j.actions }]);
    } catch (e: any) {
      setMsgs([...next, { role: "assistant", content: "Network error: " + e.message }]);
    } finally { setBusy(false); }
  }

  return (
    <div className="app">
      <header><div className="avatar">E</div><div><b>ENSIDEX Invoice Agent</b><small>{health ? `PayPal: ${health.paypal} · AI: ${health.ai}` : "connecting…"}</small></div></header>
      <main>
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`} dir="auto">
            <div className="text">{m.content}</div>
            {m.actions?.map((a, k) => (
              <div key={k} className="card">
                <code>{a.tool}</code>{a.error ? <span className="err"> {a.error}</span> : null}
                {a.result?.approveUrl && <a href={a.result.approveUrl} target="_blank" rel="noreferrer">Open payment link</a>}
                {a.result?.payerViewUrl && <a href={a.result.payerViewUrl} target="_blank" rel="noreferrer">View invoice</a>}
              </div>
            ))}
          </div>
        ))}
        {busy && <div className="bubble assistant typing">…</div>}
        <div ref={end} />
      </main>
      <div className="chips">{samples.map((s) => <button key={s} onClick={() => send(s)} dir="auto">{s}</button>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input dir="auto" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message / اكتب رسالة" />
        <button disabled={busy}>Send</button>
      </form>
    </div>
  );
}
