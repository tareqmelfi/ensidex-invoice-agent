import type { PayPalApi } from "./paypal.js";

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

export async function runTool(pp: PayPalApi, name: string, a: any): Promise<unknown> {
  switch (name) {
    case "create_invoice": {
      const inv = await pp.createInvoice({ recipientName: a.recipientName, recipientEmail: a.recipientEmail, amount: Number(a.amount), currency: a.currency ?? "USD", description: a.description, dueDate: a.dueDate });
      return a.send === false ? inv : pp.sendInvoice(inv.id);
    }
    case "send_invoice": return pp.sendInvoice(a.id);
    case "remind_invoice": return pp.remindInvoice(a.id);
    case "get_invoice_status": return pp.getInvoice(a.id);
    case "list_invoices": return pp.listInvoices();
    case "create_payment_link": return pp.createPaymentLink(Number(a.amount), a.currency ?? "USD", a.description);
    default: throw new Error(`Unknown tool ${name}`);
  }
}
