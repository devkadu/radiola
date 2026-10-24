export function formatEpisodeLabel(id: string, names: Record<number, string> = {}) {
  const match = id.match(/^(\d+)-s(\d+)-e(\d+)$/);
  if (!match) return id;
  return `${names[Number(match[1])] ?? `#${match[1]}`} · T${match[2].padStart(2, "0")} E${match[3].padStart(2, "0")}`;
}

export function relativeTime(date: string, now: number) {
  const seconds = Math.max(0, (now - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "agora";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
