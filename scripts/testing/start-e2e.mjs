import { spawn } from "node:child_process";
import { startFixtureServer } from "./fixture-server.mjs";
import { verificationEnvironment } from "./environment.mjs";

const { server } = await startFixtureServer();
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3030"], { env: verificationEnvironment(), stdio: "inherit" });
const stop = () => child.kill("SIGTERM");
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
try {
  process.exitCode = await new Promise((resolve, reject) => { child.once("error", reject); child.once("exit", code => resolve(code ?? 1)); });
} finally { server.closeAllConnections(); server.close(); }
