create table if not exists series_context (
  series_id   integer primary key,
  series_name text    not null,
  -- onde a última temporada parou no material original
  material    jsonb,  -- { tipo: 'manga'|'book'|'none', onde_parou: '', onde_continuar: '', fonte: '' }
  -- status de produção da próxima temporada
  prod_status text,
  -- ids de séries similares (array de tmdb ids)
  similares   integer[],
  -- tags de humor/gênero para busca por contexto
  tags             text[],
  similares_nomes  text[],
  updated_at       timestamptz default now()
);

create index if not exists series_context_tags on series_context using gin(tags);
