import type { PayPalApi } from "./paypal.js";
import { runTool, toolSchemas } from "./tools.js";

export type Msg = { role: "system" | "user" | "assistant" | "tool"; content: string | null; tool_calls?: any[]; tool_call_id?: string };
export interface AgentReply { reply: string; actions: { tool: string; args: unknown; result: unknown; error?: string }[]; engine: "openrouter" | "offline" }

const calendar = (today: string) => Array.from({ length: 8 }, (_, i) => { const d = new Date(Date.parse(today + "T00:00:00Z") + i * 864e5); return `${DAYS[d.getUTCDay()]} ${d.toISOString().slice(0, 10)}`; }).join(", ");
const sys = (today: string) => `You are ENSIDEX Invoice Agent, a billing assistant for freelancers and small businesses. Today is ${today}. Next days: ${calendar(today)} (use this table for weekday names; "next/الجاي" = next occurrence).
ALWAYS reply in the same language as the user's latest message (English in -> English out; Arabic in -> Arabic out).
Turn requests (Arabic or English) into PayPal actions using the tools. Resolve relative dates ("Friday", "الخميس الجاي") to YYYY-MM-DD.
If an essential field (amount, client name, what it's for) is missing, ask one short question. Default currency USD; "ريال" means SAR. Email is optional — never ask for it. Do not ask for confirmation when amount, client and purpose are present: act.
After tools run, confirm briefly in the user's language, with invoice id, amount, status and link. For summaries of unpaid invoices, group by status, total the outstanding amount, flag overdue ones, and suggest reminders.`;

export async function runAgent(pp: PayPalApi, history: Msg[], opts: { apiKey?: string; model?: string; today?: string; fetchImpl?: typeof fetch } = {}): Promise<AgentReply> {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  if (!opts.apiKey) return offlineAgent(pp, history, today);
  const f = opts.fetchImpl ?? fetch;
  const msgs: Msg[] = [{ role: "system", content: sys(today) }, ...history];
  const actions: AgentReply["actions"] = [];
  for (let step = 0; step < 6; step++) {
    const r = await f("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${opts.apiKey}`, "Content-Type": "application/json", "X-Title": "ENSIDEX Invoice Agent" },
      body: JSON.stringify({ model: opts.model ?? "openai/gpt-4o-mini", messages: msgs, tools: toolSchemas, tool_choice: "auto" }),
    });
    if (!r.ok) throw new Error(`OpenRouter error ${r.status}`);
    const j: any = await r.json();
    const m = j.choices[0].message;
    msgs.push({ role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls });
    if (!m.tool_calls?.length) return { reply: m.content ?? "", actions, engine: "openrouter" };
    for (const tc of m.tool_calls) {
      let args: any = {};
      try { args = JSON.parse(tc.function.arguments || "{}"); } catch {}
      try {
        const result = await runTool(pp, tc.function.name, args);
        actions.push({ tool: tc.function.name, args, result });
        msgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(result) });
      } catch (e: any) {
        actions.push({ tool: tc.function.name, args, result: null, error: e.message });
        msgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify({ error: e.message }) });
      }
    }
    // Tool output is mostly English; re-anchor the reply language to the user's message.
    const lastUser = [...history].reverse().find((h) => h.role === "user")?.content ?? "";
    const ar = /[\u0600-\u06FF]/.test(lastUser);
    msgs.push({ role: "system", content: `Reply to the user in ${ar ? "Arabic" : "English"} only.` });
  }
  return { reply: "Stopped after too many steps.", actions, engine: "openrouter" };
}

// ---------- Offline fallback: deterministic parser so the demo works with no API key ----------
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const norm = (s: string) => s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[إأآ]/g, "ا");

export function resolveDue(text: string, today: string): string | undefined {
  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const base = new Date(today + "T00:00:00Z");
  const add = (n: number) => new Date(base.getTime() + n * 864e5).toISOString().slice(0, 10);
  const t = norm(text.toLowerCase());
  if (/tomorrow|بكره|بكرة|غدا/.test(t)) return add(1);
  const inDays = t.match(/in (\d+) days?|بعد (\d+) (?:ايام|يوم)/);
  if (inDays) return add(Number(inDays[1] ?? inDays[2]));
  for (let i = 0; i < 7; i++) {
    if (t.includes(DAYS[i]) || t.includes(norm(AR_DAYS[i]))) {
      let d = (i - base.getUTCDay() + 7) % 7; if (d === 0) d = 7;
      return add(d);
    }
  }
  return undefined;
}

export function parseInvoiceRequest(text: string, today: string) {
  const t = norm(text);
  const amt = t.match(/(?:\$|usd\s*)?(\d+(?:[.,]\d+)?)\s*(\$|usd|dollars?|دولار|sar|ريال|eur|€)?/i);
  if (!amt) return null;
  const unit = (amt[2] ?? "").toLowerCase();
  const currency = /sar|ريال/.test(unit) ? "SAR" : /eur|€/.test(unit) ? "EUR" : "USD";
  const name = t.match(/(?:[Bb]ill|[Ii]nvoice|[Cc]harge)\s+([A-Z][\w'-]*(?:\s[A-Z][\w'-]*)?)/)?.[1]
    ?? t.match(/(?:فاتورة|فاتوره|فوتر|اطلب من)\s+(?:ل|الى\s+|على\s+)?([\u0600-\u06FF]+)/)?.[1];
  const desc = t.match(/\bfor\s+(.+?)(?:\s+due\b|\s+by\b|,|\.|$)/i)?.[1] ?? t.match(/(?:عن|مقابل)\s+(.+?)(?:\s+تستحق|\s+قبل|\s+يوم|،|$)/)?.[1];
  const email = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0];
  if (!name || !desc) return null;
  return { recipientName: name, recipientEmail: email, amount: Number(amt[1].replace(",", ".")), currency, description: desc.trim(), dueDate: resolveDue(t, today) };
}

async function offlineAgent(pp: PayPalApi, history: Msg[], today: string): Promise<AgentReply> {
  const text = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  const ar = /[\u0600-\u06FF]/.test(text);
  const actions: AgentReply["actions"] = [];
  const act = async (tool: string, args: any) => { const result: any = await runTool(pp, tool, args); actions.push({ tool, args, result }); return result; };
  const id = text.match(/INV2-[\w-]+/i)?.[0];
  try {
    if (/remind|ذكر|تذكير/i.test(text) && id) {
      const r = await act("remind_invoice", { id });
      return { reply: ar ? `أرسلت تذكير للفاتورة ${r.id}.` : `Reminder sent for ${r.id}.`, actions, engine: "offline" };
    }
    if (/status|حالة|وش صار/i.test(text) && id) {
      const r = await act("get_invoice_status", { id });
      return { reply: `${r.id}: ${r.status} — ${r.amount} ${r.currency}`, actions, engine: "offline" };
    }
    if (/unpaid|summary|outstanding|ملخص|غير مدفوع|ما انسدد|متأخر/i.test(text)) {
      const list: any[] = await act("list_invoices", {});
      const open = list.filter((i) => !["PAID", "CANCELLED", "MARKED_AS_PAID"].includes(i.status));
      const total = open.reduce((s, i) => s + i.amount, 0);
      const overdue = open.filter((i) => i.dueDate && i.dueDate < today);
      const lines = open.map((i) => `• ${i.id} — ${i.recipientName} — ${i.amount} ${i.currency} — ${i.status}${i.dueDate ? ` (due ${i.dueDate})` : ""}`).join("\n");
      return { reply: ar
        ? `عندك ${open.length} فاتورة غير مدفوعة بإجمالي ${total}. المتأخر: ${overdue.length}.\n${lines}`
        : `You have ${open.length} unpaid invoice(s) totalling ${total}. Overdue: ${overdue.length}.\n${lines}`, actions, engine: "offline" };
    }
    const wantsLink = /payment link|pay link|رابط دفع/i.test(text);
    if (wantsLink) {
      const amt = Number(norm(text).match(/(\d+(?:\.\d+)?)/)?.[1]);
      const description = norm(text).match(/\bfor\s+(.+?)(?:,|\.|$)/i)?.[1] ?? norm(text).match(/(?:عن|مقابل)\s+(.+?)(?:،|$)/)?.[1] ?? "Payment";
      if (!amt) return { reply: ar ? "كم المبلغ؟" : "What amount?", actions, engine: "offline" };
      const r = await act("create_payment_link", { amount: amt, currency: "USD", description });
      return { reply: ar ? `رابط الدفع جاهز: ${r.approveUrl}` : `Payment link ready: ${r.approveUrl}`, actions, engine: "offline" };
    }
    const p = parseInvoiceRequest(text, today);
    if (!p) return { reply: ar ? "مين العميل، وكم المبلغ، وعن وش الفاتورة؟" : "Who is the client, how much, and what is it for?", actions, engine: "offline" };
    const r = await act("create_invoice", { ...p, send: true });
    return { reply: ar
      ? `تم إنشاء الفاتورة ${r.id} لـ ${r.recipientName} بمبلغ ${r.amount} ${r.currency}${r.dueDate ? `، تستحق ${r.dueDate}` : ""}. الحالة: ${r.status}.`
      : `Invoice ${r.id} for ${r.recipientName}: ${r.amount} ${r.currency}${r.dueDate ? `, due ${r.dueDate}` : ""}. Status: ${r.status}.`, actions, engine: "offline" };
  } catch (e: any) {
    return { reply: `Error: ${e.message}`, actions, engine: "offline" };
  }
}
