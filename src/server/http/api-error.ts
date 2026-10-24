import { AccessError } from "@/server/auth/auth";
import { TmdbError } from "@/server/integrations/tmdb/error";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { RequestBodyError } from "./read-json";

export function apiError(error: unknown, operation: string) {
  if (error instanceof TmdbError) {
    const requestId = crypto.randomUUID();
    console.error({
      operation,
      requestId,
      error: error.name,
      code: error.code,
      upstreamStatus: error.status,
    });
    const status =
      error.status === 404
        ? 404
        : error.status === 429
          ? 429
          : error.code === "TIMEOUT"
            ? 504
            : 502;
    const message =
      status === 404
        ? "Conteúdo não encontrado no catálogo"
        : status === 429
          ? "Catálogo ocupado. Tente novamente em instantes."
          : "Catálogo temporariamente indisponível. Tente novamente.";
    return NextResponse.json(
      { error: message, code: error.code, requestId },
      {
        status,
        headers: error.retryAfter ? { "Retry-After": error.retryAfter } : undefined,
      },
    );
  }
  if (error instanceof RequestBodyError)
    return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof AccessError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const requestId = crypto.randomUUID();
  console.error({
    operation,
    requestId,
    error: error instanceof Error ? error.name : "UpstreamError",
  });
  return NextResponse.json(
    { error: "Não foi possível concluir a operação", requestId },
    { status: 500 },
  );
}
