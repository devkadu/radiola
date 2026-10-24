import { ESLint } from "eslint";

const eslint = new ESLint();
const results = await eslint.lintFiles([
  "src/**/*.{ts,tsx}", "scripts/**/*.mjs", "scripts/**/*.ts",
  "tests/**/*.{ts,tsx,mjs}", "*.{js,mjs,mts,ts}",
]);
const formatIndex = process.argv.indexOf("--format");
const formatter = await eslint.loadFormatter(formatIndex >= 0 ? process.argv[formatIndex + 1] : "stylish");
const output = await formatter.format(results);
await new Promise((resolve) => process.stdout.write(output, resolve));
// Resolver workers can remain alive after linting; end only after all results are flushed.
process.exit(results.some((result) => result.errorCount || result.warningCount) ? 1 : 0);
