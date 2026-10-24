import { TmdbError } from "@/server/integrations/tmdb/error";
import { notFound } from "next/navigation";
import "server-only";

export async function withCatalogNotFound<T>(query: Promise<T>): Promise<T> {
  try { return await query; }
  catch (error) { if (error instanceof TmdbError && error.status === 404) notFound(); throw error; }
}
