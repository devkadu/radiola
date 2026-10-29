import type { Metadata } from "next";
import { SITE_URL } from "@/shared/constants/site";
import { getPublicProfileUser } from "../queries/get-public-profile-user";

interface Props {
  params: Promise<{ username: string }>;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { username } = await params;
  const user = await getPublicProfileUser(username);
  const isPublic = user.user_metadata?.profile_public !== false;
  return {
    title: isPublic ? username : "Perfil privado",
    description: isPublic
      ? `Veja o perfil de ${username} no Segunda Temporada — séries assistidas, avaliações e comentários.`
      : "Este perfil é privado.",
    alternates: { canonical: `${SITE_URL}/u/${encodeURIComponent(username)}` },
    robots: { index: isPublic, follow: isPublic },
  };
};
