import type { InvoiceSummary, PayPalApi } from "./paypal.js";

export const toolSchemas = [
  { type: "function", function: { name: "create_invoice", description: "Create a PayPal invoice draft and (by default) send it.", parameters: { type: "object", required: ["recipientName", "amount", "description"], properties: {
    recipientName: { type: "string" }, recipientEmail: { type: "string" }, amount: { type: "number" }, currency: { type: "string", description: "ISO code, default USD" },
    description: { type: "string" }, dueDate: { type: "string", description: "YYYY-MM-DD" }, send: { type: "boolean", description: "send immediately, default true" } } } } },
  { type: "function", function: { name: "send_invoice", description: "Send a draft invoice", parameters: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } },
  { type: "function", function: { name: "remind_invoice", description: "Send a payment reminder for an invoice", parameters: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } },
  { type: "function", function: { name: "get_invoice_status", description: "Get one invoice's status", parameters: { type: "object", required: ["id"], properties: { id: { type: "string" } } } } },
  { type: "function", function: { name: "list_invoices", description: "List invoices (for summaries of unpaid invoices)", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "create_payment_link", description: "Create a one-off PayPal checkout payment link (Orders API)", parameters: { type: "object", required: ["amount", "description"], properties: { amount: { type: "number" }, currency: { type: "string" }, description: { type: "string" } } } } },
] as const;

const CLOSED = ["PAID", "CANCELLED", "MARKED_AS_PAID", "REFUNDED", "MARKED_AS_REFUNDED"];
/** Server-side summary so the model never has to add up amounts in different currencies. */
export function summarizeInvoices(list: InvoiceSummary[], today: string = new Date().toISOString().slice(0, 10)) {
  const unpaid = list.filter((i) => !CLOSED.includes(i.status) && i.status !== "DRAFT");
  const overdue = unpaid.filter((i) => i.dueDate && i.dueDate < today);
  const totals = (xs: InvoiceSummary[]) => xs.reduce<Record<string, number>>((t, i) => ((t[i.currency] = Math.round(((t[i.currency] ?? 0) + i.amount) * 100) / 100), t), {});
  return {
    today,
    invoices: list.map((i) => ({ ...i, overdue: !!(i.dueDate && i.dueDate < today && unpaid.includes(i)) })),
    unpaidCount: unpaid.length,
    unpaidTotalsByCurrency: totals(unpaid),
    overdueCount: overdue.length,
    overdueTotalsByCurrency: totals(overdue),
    overdueIds: overdue.map((i) => i.id),
    note: "Totals are per currency. Never add different currencies together.",
  };
}
export const formatTotals = (t: Record<string, number>) => Object.entries(t).map(([c, v]) => `${v.toFixed(2)} ${c}`).join(" + ") || "0";

/** Currencies PayPal does not accept, mapped to a fixed peg into USD (SAR is pegged at 3.75 per USD). */
export const PEGGED: Record<string, { to: string; rate: number }> = { SAR: { to: "USD", rate: 3.75 }, AED: { to: "USD", rate: 3.6725 } };
export function toPayPalCurrency(amount: number, currency = "USD") {
  const c = currency.toUpperCase(); const peg = PEGGED[c];
  if (!peg) return { amount, currency: c };
  return { amount: Math.round((amount / peg.rate) * 100) / 100, currency: peg.to, originalAmount: amount, originalCurrency: c, note: `PayPal does not support ${c}; converted at the fixed peg ${peg.rate} ${c}/USD.` };
}

export async function runTool(pp: PayPalApi, name: string, a: any, today?: string): Promise<unknown> {
  switch (name) {
    case "create_invoice": {
      const cv = toPayPalCurrency(Number(a.amount), a.currency ?? "USD");
      const description = cv.originalCurrency ? `${a.description} (${cv.originalAmount} ${cv.originalCurrency})` : a.description;
      const inv = await pp.createInvoice({ recipientName: a.recipientName, recipientEmail: a.recipientEmail, amount: cv.amount, currency: cv.currency, description, dueDate: a.dueDate });
      const out = a.send === false ? inv : await pp.sendInvoice(inv.id);
      return cv.originalCurrency ? { ...out, originalAmount: cv.originalAmount, originalCurrency: cv.originalCurrency, conversionNote: cv.note } : out;
    }
    case "send_invoice": return pp.sendInvoice(a.id);
    case "remind_invoice": return pp.remindInvoice(a.id);
    case "get_invoice_status": return pp.getInvoice(a.id);
    case "list_invoices": return summarizeInvoices(await pp.listInvoices(), today);
    case "create_payment_link": {
      const cv = toPayPalCurrency(Number(a.amount), a.currency ?? "USD");
      const r = await pp.createPaymentLink(cv.amount, cv.currency, a.description);
      return { ...r, amount: cv.amount, currency: cv.currency, ...(cv.originalCurrency ? { originalAmount: cv.originalAmount, originalCurrency: cv.originalCurrency, conversionNote: cv.note } : {}) };
    }
    default: throw new Error(`Unknown tool ${name}`);
  }
}
