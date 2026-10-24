

import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} · Segunda Temporada`,
    description: `Veja o perfil de ${username} no Segunda Temporada — séries assistidas, avaliações e comentários.`,
  };
}
