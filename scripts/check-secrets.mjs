import { readFileSync, existsSync, statSync } from "node:fs";

const files = readFileSync(0, "utf8").split("\0").filter(Boolean);
if (!files.length) throw new Error("No file inventory received; secret check cannot proceed.");
let failures = 0;
for (const file of new Set(files)) {
  if (!file || !existsSync(file) || !statSync(file).isFile() || statSync(file).size > 2_000_000) continue;
  const content = readFileSync(file, "utf8");
  if (content.includes("\0")) continue;
  const patterns = [
    /sb_secret_[a-zA-Z0-9_-]{20,}/g,
    /sk-ant-[a-zA-Z0-9_-]{30,}/g,
    /\bre_[a-zA-Z0-9]{25,}\b/g,
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      console.error(`${file}:${content.slice(0, match.index).split("\n").length}: possible secret (value omitted)`);
      failures++;
    }
  }
  for (const match of content.matchAll(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g)) {
    try {
      const payload = JSON.parse(Buffer.from(match[0].split(".")[1], "base64url").toString());
      if (payload.role !== "service_role") continue;
      console.error(`${file}:${content.slice(0, match.index).split("\n").length}: privileged JWT (value omitted)`);
      failures++;
    } catch { /* Not a JWT payload. */ }
  }
}
if (failures) process.exitCode = 1;
else console.log("No privileged credentials detected in current source files.");
