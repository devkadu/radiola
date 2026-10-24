export class RequestBodyError extends Error {
  constructor(public readonly status: 400 | 413, message: string) { super(message); }
}

export async function readJson(request: Request, maxBytes = 100 * 1024): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes) throw new RequestBodyError(413, "Conteúdo muito grande");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestBodyError(400, "Corpo JSON obrigatório");
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, "Conteúdo muito grande");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}
