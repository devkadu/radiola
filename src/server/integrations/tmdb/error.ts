export type TmdbErrorCode = "HTTP_ERROR" | "NETWORK_ERROR" | "TIMEOUT" | "INVALID_RESPONSE";

export class TmdbError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: TmdbErrorCode = "HTTP_ERROR",
    options?: ErrorOptions,
    public readonly retryAfter?: string,
  ) {
    super("Falha na consulta ao catálogo", options);
    this.name = "TmdbError";
  }
}
