type ListConfig = {
  name: string;
  slug: string;
  description: string;
  intro: string;
  color: string;
  tmdbParams: Record<string, string>;
};

export const BEST_SERIES_PLATFORMS: Record<string, ListConfig> = {
  "apple-tv-plus": {
    name: "Apple TV+",
    slug: "apple-tv-plus",
    color: "#a3a3a3",
    description:
      "As 10 melhores séries do Apple TV+ avaliadas pelo público, do drama premiado ao sci-fi aclamado pela crítica.",
    intro: `O <strong>Apple TV+</strong> entrou no mercado de streaming em 2019 apostando em qualidade em vez de quantidade — e a estratégia funcionou. Com produções originais que acumulam Emmys e Globos de Ouro, o serviço da Apple se consolidou como um dos mais premiados da indústria.

Se você ainda não sabe por onde começar, ou quer descobrir o que o catálogo tem de melhor, esta lista reúne as <strong>10 melhores séries do Apple TV+</strong> com base nas avaliações do público no TMDB — sem spoilers e com contexto suficiente para você decidir qual assistir primeiro.`,
    tmdbParams: { with_networks: "2552" },
  },
  netflix: {
    name: "Netflix",
    slug: "netflix",
    color: "#e50914",
    description:
      "As 10 melhores séries da Netflix avaliadas pelo público, dos dramas emocionantes às produções de ficção científica.",
    intro: `A <strong>Netflix</strong> foi pioneira no streaming moderno e ainda hoje é referência quando o assunto é séries originais. Com um catálogo enorme e produções em todos os gêneros, saber o que assistir pode ser difícil.

Esta lista reúne as <strong>10 melhores séries da Netflix</strong> com base nas avaliações do público no TMDB — um ponto de partida confiável para quem quer maratonar algo de qualidade.`,
    tmdbParams: { with_networks: "213" },
  },
  hbo: {
    name: "HBO",
    slug: "hbo",
    color: "#6c2bd9",
    description:
      "As 10 melhores séries da HBO de todos os tempos, do drama policial ao fantasy épico.",
    intro: `A <strong>HBO</strong> é sinônimo de televisão de qualidade. De The Sopranos a Game of Thrones, a emissora americana definiu o que significa uma série de prestígio — e continua produzindo conteúdo aclamado até hoje.

Esta lista reúne as <strong>10 melhores séries da HBO</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_networks: "49" },
  },
  "prime-video": {
    name: "Amazon Prime Video",
    slug: "prime-video",
    color: "#00a8e1",
    description: "As 10 melhores séries do Amazon Prime Video avaliadas pelo público.",
    intro: `O <strong>Amazon Prime Video</strong> investiu pesado em produções originais e hoje conta com algumas das séries mais comentadas dos últimos anos — de thrillers políticos a fantasias de alto orçamento.

Esta lista reúne as <strong>10 melhores séries do Amazon Prime Video</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_networks: "1024" },
  },
  doramas: {
    name: "Doramas",
    slug: "doramas",
    color: "#f472b6",
    description:
      "Os 10 melhores doramas coreanos avaliados pelo público, do romance ao thriller psicológico.",
    intro: `Os <strong>doramas coreanos</strong> conquistaram o mundo inteiro — e o Brasil não ficou de fora. Com roteiros intensos, produções impecáveis e personagens inesquecíveis, os K-dramas se tornaram um dos gêneros mais assistidos nos streamings.

Esta lista reúne os <strong>10 melhores doramas</strong> com base nas avaliações do público no TMDB — do romance clássico ao thriller que você não vai conseguir parar de assistir.`,
    tmdbParams: { with_original_language: "ko", with_genres: "18", "vote_count.gte": "500" },
  },
  drama: {
    name: "Drama",
    slug: "drama",
    color: "#f59e0b",
    description: "As 10 melhores séries de drama avaliadas pelo público no mundo todo.",
    intro: `O gênero <strong>drama</strong> produz as séries mais premiadas e debatidas da televisão. São histórias que ficam na cabeça — personagens complexos, dilemas morais e roteiros que não têm medo de ir fundo.

Esta lista reúne as <strong>10 melhores séries de drama</strong> com base nas avaliações do público no TMDB, de diferentes países e plataformas.`,
    tmdbParams: { with_genres: "18", "vote_count.gte": "1000" },
  },
  comedia: {
    name: "Comédia",
    slug: "comedia",
    color: "#34d399",
    description:
      "As 10 melhores séries de comédia avaliadas pelo público, das sitcoms clássicas às comédias modernas.",
    intro: `Uma boa <strong>série de comédia</strong> é difícil de fazer — e fácil de amar. Das sitcoms que definiram gerações às comédias contemporâneas que misturam humor e drama, este gênero tem algumas das séries mais assistidas da história.

Esta lista reúne as <strong>10 melhores séries de comédia</strong> com base nas avaliações do público no TMDB.`,
    tmdbParams: { with_genres: "35", "vote_count.gte": "500" },
  },
  anime: {
    name: "Anime",
    slug: "anime",
    color: "#fb923c",
    description:
      "Os 10 melhores animes avaliados pelo público, da ação épica ao drama psicológico.",
    intro: `Os <strong>animes</strong> deixaram de ser nicho há muito tempo. Com narrativas complexas, animações impressionantes e fãs apaixonados no mundo inteiro, as séries japonesas estão entre as produções mais bem avaliadas de todos os tempos.

Esta lista reúne os <strong>10 melhores animes</strong> com base nas avaliações do público no TMDB — para quem quer começar ou descobrir o que está perdendo.`,
    tmdbParams: { with_original_language: "ja", with_genres: "16", "vote_count.gte": "500" },
  },
};
