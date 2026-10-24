import "server-only";

interface PageResult<T> { data: T[] | null; error: unknown }

export async function readAll<T>(
  page: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const result = await page(offset, offset + pageSize - 1);
    if (result.error) throw result.error;
    rows.push(...result.data ?? []);
    if (!result.data || result.data.length < pageSize) return rows;
  }
}
