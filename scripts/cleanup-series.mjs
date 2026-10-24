/** Legacy entrypoint. The shared cleanup defaults to a read-only dry run. */
import { runCleanup } from "./cleanup-db.mjs";

runCleanup().catch((error) => {
  console.error("Falha na limpeza:", error.message);
  process.exitCode = 1;
});
