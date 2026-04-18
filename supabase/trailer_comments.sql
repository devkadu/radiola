-- Tabela de comentários ancorados em timestamps de trailers
CREATE TABLE trailer_comments (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  series_id     text NOT NULL,
  youtube_key   text NOT NULL,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  username      text NOT NULL,
  avatar_url    text,
  timestamp_sec integer NOT NULL,
  text          text NOT NULL,
  likes         integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON trailer_comments (series_id, youtube_key);
CREATE INDEX ON trailer_comments (timestamp_sec);

ALTER TABLE trailer_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leitura pública"    ON trailer_comments FOR SELECT USING (true);
CREATE POLICY "inserir autenticado" ON trailer_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deletar próprio"    ON trailer_comments FOR DELETE USING (auth.uid() = user_id);
