class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const fetchJson = async <T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body: unknown = isJson && response.status !== 204 ? await response.json() : undefined;
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : response.status === 401
          ? "Entre na sua conta para continuar."
          : response.status === 403
            ? "Acesso negado. Recarregue a página e tente novamente."
            : "Serviço temporariamente indisponível. Tente novamente.";
    const details = body && typeof body === "object" ? body : {};
    throw new HttpError(
      response.status,
      message,
      "code" in details && typeof details.code === "string" ? details.code : undefined,
      "requestId" in details && typeof details.requestId === "string"
        ? details.requestId
        : undefined,
    );
  }
  if (!isJson && response.status !== 204) throw new HttpError(502, "Resposta inválida do serviço.");
  return body as T;
};
