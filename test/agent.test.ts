import { describe, it, expect } from "vitest";
import { MockPayPal } from "../server/paypal";
import { runAgent, parseInvoiceRequest, resolveDue } from "../server/agent";
import { createApp } from "../server/app";

const today = "2026-11-01"; // Sunday
describe("date resolution", () => {
  it("resolves Friday / الخميس / tomorrow", () => {
    expect(resolveDue("due Friday", today)).toBe("2026-11-06");
    expect(resolveDue("تستحق الخميس", today)).toBe("2026-11-05");
    expect(resolveDue("tomorrow", today)).toBe("2026-11-02");
  });
});
describe("parser", () => {
  it("parses English", () => {
    expect(parseInvoiceRequest("Bill Ahmed Ali $300 for logo design due Friday", today)).toMatchObject({ recipientName: "Ahmed Ali", amount: 300, currency: "USD", description: "logo design", dueDate: "2026-11-06" });
  });
  it("parses Arabic", () => {
    expect(parseInvoiceRequest("سو فاتورة لسارة ٥٠٠ ريال عن تصميم موقع تستحق الخميس", today)).toMatchObject({ amount: 500, currency: "SAR", description: "تصميم موقع", dueDate: "2026-11-05" });
  });
});
describe("offline agent + mock PayPal", () => {
  it("creates, reminds, summarizes, links", async () => {
    const pp = new MockPayPal();
    const r1 = await runAgent(pp, [{ role: "user", content: "Bill Ahmed Ali $300 for logo design due Friday" }], { today });
    expect(r1.actions[0].result).toMatchObject({ status: "SENT", amount: 300 });
    const id = (r1.actions[0].result as any).id;
    const r2 = await runAgent(pp, [{ role: "user", content: `remind ${id}` }], { today });
    expect(r2.reply).toContain("Reminder");
    const r3 = await runAgent(pp, [{ role: "user", content: "Summarize my unpaid invoices" }], { today });
    expect(r3.reply).toContain("1 unpaid");
    const r4 = await runAgent(pp, [{ role: "user", content: "Payment link $49 for consultation" }], { today });
    expect(r4.reply).toContain("checkoutnow");
  });
});
describe("OpenRouter tool-calling loop", () => {
  it("executes tool calls then returns final text", async () => {
    const pp = new MockPayPal();
    let n = 0;
    const fetchImpl = (async () => ({ ok: true, json: async () => n++ === 0
      ? { choices: [{ message: { content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "create_invoice", arguments: JSON.stringify({ recipientName: "Ahmed", amount: 300, description: "logo" }) } }] } }] }
      : { choices: [{ message: { content: "Done: invoice sent." } }] } })) as any;
    const r = await runAgent(pp, [{ role: "user", content: "bill Ahmed 300 for logo" }], { apiKey: "test", fetchImpl, today });
    expect(r.engine).toBe("openrouter");
    expect(r.reply).toBe("Done: invoice sent.");
    expect((await pp.listInvoices())[0].status).toBe("SENT");
  });
});
describe("HTTP API", () => {
  it("health + chat", async () => {
    const app = createApp(new MockPayPal(), {});
    expect(await (await app.request("/api/health")).json()).toMatchObject({ paypal: "mock", ai: "offline" });
    const res = await app.request("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Bill Ahmed $300 for logo design" }] }) });
    expect(res.status).toBe(200);
    expect((await res.json()).actions.length).toBe(1);
  });
});

import { summarizeInvoices } from "../server/tools";
describe("unpaid summary", () => {
  it("totals per currency and flags overdue", () => {
    const s = summarizeInvoices([
      { id: "A", status: "SENT", recipientName: "a", amount: 300, currency: "USD", description: "x", dueDate: "2026-10-15" },
      { id: "B", status: "UNPAID", recipientName: "b", amount: 500, currency: "SAR", description: "y", dueDate: "2026-11-30" },
      { id: "C", status: "PAID", recipientName: "c", amount: 99, currency: "USD", description: "z" },
    ], "2026-11-01");
    expect(s.unpaidTotalsByCurrency).toEqual({ USD: 300, SAR: 500 });
    expect(s.overdueIds).toEqual(["A"]);
  });
});
