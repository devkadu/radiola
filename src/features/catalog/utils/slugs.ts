const slugify = (text: string) =>
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

export const seasonSlug = (seasonNumber: number) => `temporada-${seasonNumber}`;

export const episodeSlug = (episodeNumber: number, name: string) => {
  const slug = slugify(name ?? "");
  return `episodio-${episodeNumber}${slug ? `-${slug}` : ""}`;
};
