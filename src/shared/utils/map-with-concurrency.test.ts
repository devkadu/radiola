import { mapWithConcurrency } from "@/shared/utils/map-with-concurrency";
import { expect,it } from "vitest";

it("bounds concurrent calls and preserves input order", async () => {
  let active = 0;
  let maximum = 0;
  const result = await mapWithConcurrency([4, 3, 2, 1], 2, async (item) => {
    maximum = Math.max(maximum, ++active);
    await new Promise((resolve) => setTimeout(resolve, item));
    active--;
    return item * 10;
  });
  expect(maximum).toBe(2);
  expect(result).toEqual([40, 30, 20, 10]);
});
it("propagates integration failures", async () => {
  await expect(mapWithConcurrency([1], 1, async () => { throw new Error("upstream unavailable"); }))
    .rejects.toThrow("upstream unavailable");
});
