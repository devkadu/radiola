import { expect,it,vi } from "vitest";
import { readAll } from "./read-all";

it("reads beyond the API row limit instead of silently truncating totals", async () => {
  const rows = [1, 2, 3, 4, 5];
  const page = vi.fn(async (from: number, to: number) => ({ data: rows.slice(from, to + 1), error: null }));
  expect(await readAll(page, 2)).toEqual(rows);
  expect(page).toHaveBeenCalledTimes(3);
});
it("fails on an unreadable page instead of returning a partial total", async () => {
  await expect(readAll(async () => ({ data: null, error: new Error("denied") }))).rejects.toThrow("denied");
});
