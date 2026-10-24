export function episodeId(seriesId: string, season: number, episode: number) {
  return `${seriesId}-s${season}-e${episode}`;
}
