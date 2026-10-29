export const isSafeSlug = (value: unknown): value is string =>
  typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);

export const isSeriesSlugForId = (value: unknown, id: number): value is string =>
  Number.isSafeInteger(id) && id > 0 && isSafeSlug(value) && value.endsWith(`-${id}`);

export const isEpisodeSlugForNumber = (value: unknown, number: number): value is string =>
  Number.isSafeInteger(number) &&
  number > 0 &&
  isSafeSlug(value) &&
  (value === `episodio-${number}` || value.startsWith(`episodio-${number}-`));
