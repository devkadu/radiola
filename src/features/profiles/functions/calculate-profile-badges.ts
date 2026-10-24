export function calculateProfileBadges(watched: number, comments: number, ratings: number): string[] {
  const badges: string[] = [];
  if (watched >= 100) badges.push("MARATONISTA");
  else if (watched >= 20) badges.push("ASSÍDUO");
  if (comments >= 20) badges.push("DEBATEDOR");
  else if (comments >= 5) badges.push("PARTICIPATIVO");
  if (ratings >= 15) badges.push("CRÍTICO");
  return badges;
}
