export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const seriesSlug = (name: string, id: number) => {
  const slug = slugify(name ?? "");
  return slug ? `${slug}-${id}` : `serie-${id}`;
};

export const seasonSlug = (seasonNumber: number) =>
  `temporada-${seasonNumber}`;

export const episodeSlug = (episodeNumber: number, name: string) =>
  `episodio-${episodeNumber}-${slugify(name)}`;

// Extractors
export const idFromSeriesSlug = (slug: string) => slug.split("-").pop()!;

export const numberFromSeasonSlug = (slug: string) =>
  Number(slug.replace("temporada-", ""));

export const numberFromEpisodeSlug = (slug: string) =>
  Number(slug.split("-")[1]);
