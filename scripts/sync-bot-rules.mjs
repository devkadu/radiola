import { readFileSync, writeFileSync } from "node:fs";

const policy = JSON.parse(readFileSync(new URL("../config/bots.json", import.meta.url), "utf8"));
const configPath = new URL("../vercel.json", import.meta.url);
const config = JSON.parse(readFileSync(configPath, "utf8"));
// Explicit character classes work in both PCRE and JavaScript without flags.
const caseInsensitive = (agent) =>
  Array.from(agent, (character) =>
    /[a-z]/i.test(character)
      ? `[${character.toLowerCase()}${character.toUpperCase()}]`
      : character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("");

const rule = {
  src: "/(?!robots\\.txt$).*",
  has: [
    {
      type: "header",
      key: "user-agent",
      value: `.*(?:${policy.blockedAgents.map(caseInsensitive).join("|")}).*`,
    },
  ],
  mitigate: { action: "deny" },
};
// This script owns the first route. Other Vercel configuration is preserved.
if (!Array.isArray(config.routes))
  throw new Error("vercel.json must reserve routes[0] for the generated bot rule.");
const matches = JSON.stringify(config.routes[0]) === JSON.stringify(rule);
if (process.argv.includes("--write")) {
  config.routes[0] = rule;
  writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log("Vercel bot rule synchronized from config/bots.json.");
} else if (!matches) {
  console.error("Bot rule is out of date. Run yarn bots:sync and review vercel.json.");
  process.exitCode = 1;
} else {
  console.log("Vercel bot rule matches the shared policy.");
}
