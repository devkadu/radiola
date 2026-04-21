alter table series_context add column if not exists streaming text[];
create index if not exists series_context_streaming on series_context using gin(streaming);
