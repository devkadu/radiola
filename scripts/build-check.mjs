import { spawn } from "node:child_process";
import { startFixtureServer } from "./testing/fixture-server.mjs";
import { verificationEnvironment } from "./testing/environment.mjs";

const { server, requests } = await startFixtureServer();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], {
  env: verificationEnvironment(), stdio: "inherit",
});
const stop = () => child.kill("SIGTERM");
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
try {
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => resolve(code ?? 1)); });
  const readRpcs = new Set(["hot_episodes", "hot_episodes_by_series", "get_top_commenters_7days", "popular_series", "get_trending_seasons"]);
  const writes = requests.filter(request => request.method !== "GET" && request.method !== "HEAD" &&
    !(request.method === "POST" && request.pathname.startsWith("/rest/v1/rpc/") && readRpcs.has(request.pathname.split("/").pop())));
  if (writes.length) { console.error("Build attempted an unexpected integration write."); process.exitCode = 1; }
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
