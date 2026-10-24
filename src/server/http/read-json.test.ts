import { expect,it } from "vitest";
import { readJson } from "./read-json";
it("rejects streamed oversized bodies even without content-length", async () => {
  const request = new Request("https://example.test", { method: "POST", body: JSON.stringify({ text: "á".repeat(20) }) });
  await expect(readJson(request, 30)).rejects.toMatchObject({ status: 413 });
});
it("rejects invalid JSON and accepts a valid bounded object", async () => {
  await expect(readJson(new Request("https://example.test", { method: "POST", body: "{" }))).rejects.toBeInstanceOf(SyntaxError);
  expect(await readJson(new Request("https://example.test", { method: "POST", body: '{"name":"lista"}' }))).toEqual({ name: "lista" });
});
