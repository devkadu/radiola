import { expect,it } from "vitest";
import { calculateProfileBadges } from "./calculate-profile-badges";

it("awards only the highest badge in each category", () => {
  expect(calculateProfileBadges(100, 20, 15)).toEqual(["MARATONISTA", "DEBATEDOR", "CRÍTICO"]);
  expect(calculateProfileBadges(20, 5, 0)).toEqual(["ASSÍDUO", "PARTICIPATIVO"]);
  expect(calculateProfileBadges(0, 0, 0)).toEqual([]);
});
