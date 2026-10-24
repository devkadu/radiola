import { settings } from "@settings";
import "server-only";
import type { z } from "zod";
import { TmdbError } from "./error";

interface TmdbRequestOptions<Schema extends z.ZodType> {
  schema: Schema;
  query?: Record<string, string | number | null | undefined>;
  revalidate?: number;
  language?: string | false;
  signal?: AbortSignal;
}

function transportFailure(cause: unknown, timeout: AbortSignal, signal?: AbortSignal): never {
  if (signal?.aborted) throw cause;
  const timedOut = timeout.aborted || (cause instanceof Error && cause.name === "TimeoutError");
  throw new TmdbError(timedOut ? 504 : 502, timedOut ? "TIMEOUT" : "NETWORK_ERROR", { cause });
}

export async function tmdbRequest<Schema extends z.ZodType>(
  path: string,
  { schema, query = {}, revalidate = 3600, language = "pt-BR", signal }: TmdbRequestOptions<Schema>,
): Promise<z.output<Schema>> {
  const config = settings.TMDB;
  const url = new URL(`${config.BASE_URL.replace(/\/+$/, "")}${path}`);
  if (language) url.searchParams.set("language", language);
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) url.searchParams.set(key, String(value));
  }
  const timeout = AbortSignal.timeout(10_000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let response: Response;
  try {
    response = await fetch(url.href, {
      headers: { Authorization: `Bearer ${config.ACCESS_TOKEN}` },
      signal: requestSignal,
      next: { revalidate },
    });
  } catch (cause) {
    transportFailure(cause, timeout, signal);
  }
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    throw new TmdbError(
      response.status,
      "HTTP_ERROR",
      undefined,
      retryAfter && /^\d{1,6}$/.test(retryAfter) ? retryAfter : undefined,
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    if (cause instanceof SyntaxError) throw new TmdbError(502, "INVALID_RESPONSE", { cause });
    transportFailure(cause, timeout, signal);
  }
  const result = schema.safeParse(payload);
  if (!result.success) throw new TmdbError(502, "INVALID_RESPONSE");
  return result.data;
}
