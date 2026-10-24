import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import robots from "@/app/robots";
import { proxy } from "@/proxy";
import { blockedBotAgents } from "@/server/security/bot-policy";
import config from "../../vercel.json";

const rule = config.routes[0];
const matcher = new RegExp(`^(?:${rule.has[0].value})$`);
const paths = new RegExp(`^(?:${rule.src})$`);

describe("declared bot protection", () => {
  it.each(blockedBotAgents)("blocks %s regardless of case at the deployment edge", (agent) => {
    expect(rule.mitigate.action).toBe("deny");
    expect(matcher.test(`Mozilla/5.0 ${agent.toUpperCase()}/1.0`)).toBe(true);
    expect(matcher.test(`Mozilla/5.0 ${agent.toLowerCase()}/1.0`)).toBe(true);
  });

  it.each(["/", "/pessoa/1", "/series/serie-1", "/_next/image", "/_next/static/chunk.js"])(
    "covers %s before page or image execution",
    (path) => expect(paths.test(path)).toBe(true),
  );

  it("lets crawlers read the robots policy and keeps the same blocked list there", () => {
    expect(paths.test("/robots.txt")).toBe(false);
    const rules = robots().rules;
    expect(
      Array.isArray(rules) &&
        rules.some(
          (entry) =>
            Array.isArray(entry.userAgent) &&
            entry.userAgent.includes("ClaudeBot") &&
            entry.disallow === "/",
        ),
    ).toBe(true);
  });

  it.each([
    "Mozilla/5.0 Chrome/150.0",
    "Googlebot/2.1",
    "bingbot/2.0",
    "facebookexternalhit/1.1",
    "WhatsApp/2.0",
  ])("does not match the wanted client %s", (agent) => expect(matcher.test(agent)).toBe(false));

  it("rejects a blocked crawler even if it also claims to be Googlebot", async () => {
    const response = await proxy(
      new NextRequest("https://example.test/pessoa/1", {
        headers: { "User-Agent": "Googlebot ClaudeBot/1.0" },
      }),
    );
    expect(response.status).toBe(403);
  });

  it("allows ClaudeBot to retrieve robots.txt through the local proxy", async () => {
    const response = await proxy(
      new NextRequest("https://example.test/robots.txt", {
        headers: { "User-Agent": "ClaudeBot/1.0" },
      }),
    );
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
