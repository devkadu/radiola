import { tmdbService } from "@/services/tmdb";
import { idFromSeriesSlug, numberFromSeasonSlug, numberFromEpisodeSlug } from "@/lib/slugs";
import { CommentBox } from "@/components/CommentBox";
import { CommentList } from "@/components/CommentList";
import Image from "next/image";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string; season: string; episode: string }>;
}

// Mock comments — substituir por dados reais quando houver backend
const MOCK_COMMENTS = [
  {
    id: 1,
    initials: "AL",
    color: "#4f46e5",
    username: "alice_bsg",
    time: "3h",
    text: "Cain é um espelho da Adama — só que ela foi consumida pelo pragmatismo. Esse episódio te faz questionar tudo.",
    likes: 42,
  },
  {
    id: 2,
    initials: "RM",
    color: "#16a34a",
    username: "rafamelo",
    time: "1h",
    text: "Duas frotas, dois mundos. A série levou isso num nível que nenhuma sci-fi fazia na época. Ainda impressiona.",
    likes: 28,
  },
];

export default async function EpisodePage({ params }: Props) {
  const { slug, season: seasonParam, episode: episodeParam } = await params;
  const seriesId = idFromSeriesSlug(slug);
  const seasonNumber = numberFromSeasonSlug(seasonParam);
  const episodeNumber = numberFromEpisodeSlug(episodeParam);

  const [series, ep] = await Promise.all([
    tmdbService.getSeriesDetails(seriesId).catch(() => null),
    tmdbService.getEpisodeDetails(seriesId, seasonNumber, episodeNumber).catch(() => null),
  ]);

  if (!series || !ep) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
        <p className="text-4xl">📺</p>
        <p className="text-lg font-semibold text-[var(--text-primary)]">Episódio não encontrado</p>
        <p className="text-sm">Verifique se o link está correto.</p>
        <Link href="/" className="mt-2 text-sm text-[var(--yellow)] hover:underline">← Voltar para o início</Link>
      </main>
    );
  }

  const meta = `T${String(seasonNumber).padStart(2, "0")} · E${String(episodeNumber).padStart(2, "0")}${ep.runtime ? ` · ${ep.runtime} min` : ""}`;

  return (
    <main className="min-h-screen bg-[var(--background)] text-white pb-32">
      <div className="px-4 pt-5 flex flex-col gap-4">

        {/* Card do episódio */}
        <div className="relative overflow-hidden min-h-[220px] -mx-4">
          {/* Imagem ocupa toda a altura à esquerda */}
          {ep.still_path && (
            <div className="absolute inset-y-0 left-0 w-1/2">
              <Image
                src={`https://image.tmdb.org/t/p/w500${ep.still_path}`}
                alt={ep.name}
                fill
                className="object-cover object-top"
                sizes="50vw"
                priority
              />
              {/* Degradê horizontal da imagem para o fundo do card */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#121212]" />
            </div>
          )}

          {/* Info à direita */}
          <div className="relative ml-[45%] p-4 flex flex-col items-end text-right">
            <Link
              href={`/series/${slug}`}
              className="text-sm font-medium text-[var(--brand-yellow)] hover:opacity-80 transition-opacity"
            >
              {series.name}
            </Link>
            <p className="text-base font-bold mt-0.5 leading-snug">
              &ldquo;{ep.name}&rdquo;
            </p>
            <p className="text-xs text-gray-500 mt-1">{meta}</p>

            {/* Badges */}
            <div className="flex gap-2 mt-3 flex-wrap justify-end">
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-[var(--border-muted)] text-gray-300">
                {MOCK_COMMENTS.length} comentários
              </span>
              {ep.vote_average > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#1f2d1a] border border-[#2d4a1e] text-green-400">
                  {ep.vote_average.toFixed(1)} TMDB
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#2a2516] border border-[#4a3e1a] text-[var(--brand-yellow)]">
                Spoiler-free
              </span>
            </div>
          </div>
        </div>

        {/* Sinopse */}
        {ep.overview && (
          <p className="text-sm text-gray-400 leading-relaxed">{ep.overview}</p>
        )}

        {/* Comentários */}
        <CommentList comments={MOCK_COMMENTS} />

        {/* Caixa de comentário */}
        <CommentBox
          placeholder={`Sem medo — aqui só quem chegou até o T${String(seasonNumber).padStart(2, "0")}·E${String(episodeNumber).padStart(2, "0")}...`}
        />

      </div>
    </main>
  );
}
