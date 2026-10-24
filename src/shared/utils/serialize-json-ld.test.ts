import { expect,it } from "vitest";
import { serializeJsonLd } from "./serialize-json-ld";
it("keeps script-closing HTML inert while preserving its JSON value", () => {
  const value = { name: '</script><script>alert("x")</script>' };
  const result = serializeJsonLd(value);
  expect(result).not.toContain("<");
  expect(JSON.parse(result)).toEqual(value);
});
