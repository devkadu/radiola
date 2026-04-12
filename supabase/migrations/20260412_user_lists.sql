-- Listas personalizadas do usuário (máx. 3 por usuário)
create table if not exists user_lists (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  name       text        not null check (char_length(name) between 1 and 50),
  is_public  boolean     default false not null,
  created_at timestamptz default now() not null
);

-- Séries dentro de cada lista
create table if not exists user_list_series (
  id          uuid        default gen_random_uuid() primary key,
  list_id     uuid        references user_lists(id) on delete cascade not null,
  series_id   integer     not null,
  series_name text        not null,
  poster_path text,
  series_slug text        not null,
  added_at    timestamptz default now() not null,
  unique(list_id, series_id)
);

-- Row Level Security
alter table user_lists       enable row level security;
alter table user_list_series enable row level security;

-- Políticas user_lists
create policy "lists_select" on user_lists for select using (auth.uid() = user_id);
create policy "lists_insert" on user_lists for insert with check (auth.uid() = user_id);
create policy "lists_update" on user_lists for update using (auth.uid() = user_id);
create policy "lists_delete" on user_lists for delete using (auth.uid() = user_id);

-- Políticas user_list_series
create policy "list_series_select" on user_list_series
  for select using (list_id in (select id from user_lists where user_id = auth.uid()));

create policy "list_series_insert" on user_list_series
  for insert with check (list_id in (select id from user_lists where user_id = auth.uid()));

create policy "list_series_delete" on user_list_series
  for delete using (list_id in (select id from user_lists where user_id = auth.uid()));
