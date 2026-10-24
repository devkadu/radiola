import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each(["development", "production", "test"] as const)(
  "allows embedded fonts and restricts eval to development (%s)",
  async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    vi.resetModules();
    const { default: config } = await import("../../next.config");
    const routes = await config.headers!();
    const policy = routes[0].headers.find(
      (header) => header.key === "Content-Security-Policy",
    )!.value;
    const directives = new Map(
      policy.split(";").map((directive) => {
        const [name, ...sources] = directive.trim().split(/\s+/);
        return [name, sources];
      }),
    );

    expect(directives.get("font-src")).toEqual(["'self'", "data:"]);
    expect(directives.get("script-src")?.includes("'unsafe-eval'")).toBe(
      environment === "development",
    );
    expect(directives.get("script-src")).not.toContain("data:");
    expect(directives.get("object-src")).toEqual(["'none'"]);
    expect(directives.get("frame-ancestors")).toEqual(["'none'"]);
  },
);
