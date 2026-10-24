import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sugestões — Ajude a melhorar o Segunda Temporada",
  description:
    "Envie sua ideia ou sugestão para melhorar o Segunda Temporada. Toda contribuição chega diretamente para a equipe.",
};

export default function SugestoesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
