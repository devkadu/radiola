import { apiError } from "./api-error";

export function withApiHandler<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>, operation: string) {
  return async (...args: Args): Promise<Response> => {
    try { return await handler(...args); }
    catch (error) { return apiError(error, operation); }
  };
}
