import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
let migratedComment: Record<string, unknown>;

const asUser = async (id = owner) => {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec("set role authenticated");
};
const asAdmin = async () => {
  await db.exec("reset role");
  await db.exec("select set_config('request.jwt.claim.sub','',false)");
};
const comment = async (text = "Comentário", episode = "700-s1-e1", parent: string | null = null) => {
  const result = await db.query<{ id: string }>(
    "insert into public.comments(user_id,episode_id,text,parent_id) values($1,$2,$3,$4) returning id",
    [owner, episode, text, parent],
  );
  return result.rows[0].id;
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL("../fixtures/privacy-database.sql", import.meta.url), "utf8"));
  await db.query("insert into auth.users(id,email) values($1,'private.name@example.test')", [owner]);
  await db.query("insert into public.profile_directory(user_id,username,created_at) values($1,'private.name','2025-01-01')", [owner]);
  await db.query("insert into public.comments(user_id,episode_id,text,username,likes,created_at) values($1,'700-s1-e1','Histórico preservado','private.name',7,'2025-01-01')", [owner]);
  await db.query("insert into public.episode_reactions(user_id,episode_id,reaction_key) values($1,'700-s1-e1','emocionante')", [owner]);
  await db.exec(await readFile(new URL("../../supabase/migrations/20261030023039_privacy_security_baseline.sql", import.meta.url), "utf8"));
  migratedComment = (await db.query<Record<string, unknown>>("select username,text,likes,extract(year from created_at)::int as year from public.comments")).rows[0];
  await db.exec(`create trigger radiola_sync_profile_directory after insert or update of raw_user_meta_data on auth.users
    for each row execute function radiola_private.sync_profile_directory()`);
}, 90000);

beforeEach(async () => {
  await asAdmin();
  await db.exec("truncate public.moderation_queue, public.comments, public.trailer_comments, public.episode_reactions, public.episode_likes, public.follows, public.watched_episodes, public.user_series, public.user_lists, public.user_list_series, public.profile_directory, storage.objects, auth.users cascade");
  await db.query("insert into auth.users(id,email,raw_user_meta_data) values($1,'secret@example.test',$3),($2,'other@example.test','{}')", [owner, other, { username: "fixture" }]);
});

afterAll(async () => { await db?.close(); });

describe("database privacy and integrity in isolated Postgres", () => {
  it("upgrades legacy identities without deleting history or changing existing counts and dates", () => {
    expect(migratedComment).toEqual({ username: "usuario-111111111111", text: "Histórico preservado", likes: 7, year: 2025 });
  });
  it("derives the author and ignores fabricated likes and dates on direct API inserts", async () => {
    await asUser();
    const { rows } = await db.query<{ username: string; avatar_url: string | null; likes: number; recent: boolean }>(
      "insert into public.comments(user_id,episode_id,text,username,avatar_url,likes,created_at) values($1,'700-s1-e1','  Olá  ','admin','https://tracker.test/x',999,'2040-01-01') returning username,avatar_url,likes,created_at < now() + interval '1 minute' as recent", [owner]);
    expect(rows[0]).toEqual({ username: "fixture", avatar_url: null, likes: 0, recent: true });
  });

  it("rejects another author's UUID and anonymous writes", async () => {
    await asUser(other);
    await expect(comment()).rejects.toThrow(/author mismatch/i);
    await asAdmin();
    await db.exec("set role anon");
    await expect(comment()).rejects.toThrow(/Authentication required/);
  });

  it("rejects blank and oversized content", async () => {
    await asUser();
    await expect(comment("   ")).rejects.toThrow(/comments_content_bounds/);
    await expect(comment("x".repeat(2001))).rejects.toThrow(/comments_content_bounds/);
  });

  it("rejects replies pointing at another discussion", async () => {
    await asUser();
    const parent = await comment();
    await expect(comment("Resposta", "700-s1-e2", parent)).rejects.toThrow(/same discussion/);
  });

  it("does not let another account remove a comment", async () => {
    await asUser();
    const id = await comment();
    await asUser(other);
    await db.query("delete from public.comments where id=$1", [id]);
    expect((await db.query("select id from public.comments where id=$1", [id])).rows).toHaveLength(1);
  });

  it("preserves named legacy reactions and rejects unsupported ratings", async () => {
    await asUser();
    await db.query("insert into public.episode_reactions(user_id,episode_id,reaction_key) values($1,'700-s1-e1','emocionante')", [owner]);
    await expect(db.query("insert into public.episode_reactions(user_id,episode_id,reaction_key) values($1,'700-s1-e2','999')", [owner])).rejects.toThrow(/episode_reactions_value_bounds/);
  });

  it("protects trailer comments as well as episode comments", async () => {
    await asUser();
    const result = await db.query<{ username: string; likes: number }>("insert into public.trailer_comments(user_id,series_id,youtube_key,timestamp_sec,text,username,likes) values($1,'700','video',0,'Olá','admin',100) returning username,likes", [owner]);
    expect(result.rows[0]).toEqual({ username: "fixture", likes: 0 });
  });

  it("moderates atomically while preserving reports and other users' replies", async () => {
    const parent = await comment();
    const reply = await db.query<{ id: string }>("insert into public.comments(user_id,episode_id,text,parent_id) values($1,'700-s1-e1','Outra pessoa',$2) returning id", [other, parent]);
    const report = await db.query<{ id: string }>("insert into public.moderation_queue(comment_id,reported_by) values($1,$2) returning id", [parent, other]);
    await db.exec("set role service_role");
    await db.query("select public.moderate_comment($1,$2,'delete')", [report.rows[0].id, parent]);
    expect((await db.query("select status,comment_id from public.moderation_queue")).rows).toEqual([{ status: "actioned", comment_id: null }]);
    expect((await db.query("select parent_id from public.comments where id=$1", [reply.rows[0].id])).rows).toEqual([{ parent_id: null }]);
  });

  it("rolls back an unmatched moderation request and denies client RPC execution", async () => {
    const first = await comment();
    const second = await comment("Outro");
    const report = await db.query<{ id: string }>("insert into public.moderation_queue(comment_id) values($1) returning id", [first]);
    await expect(db.query("select public.moderate_comment($1,$2,'delete')", [report.rows[0].id, second])).rejects.toThrow(/does not match/);
    expect((await db.query("select id from public.comments")).rows).toHaveLength(2);
    await asUser();
    await expect(db.query("select public.moderate_comment($1,$2,'delete')", [report.rows[0].id, first])).rejects.toThrow(/permission denied/);
    await expect(db.query("select public.hot_episodes()")).rejects.toThrow(/permission denied/);
  });

  it("replaces email fallbacks and syncs renamed identities on existing publications", async () => {
    const id = await comment();
    await db.query("update auth.users set raw_user_meta_data='{}' where id=$1", [owner]);
    const expected = `usuario-${owner.replaceAll("-", "").slice(0,12)}`;
    expect((await db.query("select username from public.comments where id=$1", [id])).rows).toEqual([{ username: expected }]);
    expect((await db.query("select username from public.profile_directory where user_id=$1", [owner])).rows).toEqual([{ username: expected }]);
  });

  it("prevents a different account from assuming an existing public name, including case variants", async () => {
    await expect(db.query("update auth.users set raw_user_meta_data=$1 where id=$2", [{ username: "Fixture" }, other]))
      .rejects.toThrow(/profile_directory_username_unique_idx/);
    expect((await db.query("select username from public.profile_directory where user_id=$1", [owner])).rows).toEqual([{ username: "fixture" }]);
  });

  it("blocks existing JWTs during erasure, including new avatar uploads", async () => {
    await db.query("update auth.users set raw_app_meta_data='{" + '"privacy_erasure_pending":true' + "}' where id=$1", [owner]);
    await asUser();
    await expect(db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)", [`${owner}/avatar.webp`])).rejects.toThrow(/row-level security/);
    await expect(db.query("insert into public.user_series(user_id,series_id) values($1,700)", [owner])).rejects.toThrow(/row-level security/);
    await expect(comment()).rejects.toThrow(/Author unavailable/);
  });

  it("allows account erasure without deleting other users' replies or orphaning report identities", async () => {
    const parent = await comment();
    await db.query("insert into public.comments(user_id,episode_id,text,parent_id) values($1,'700-s1-e1','Outra pessoa',$2)", [other,parent]);
    await db.query("insert into public.moderation_queue(comment_id,reported_by) values($1,$2)", [parent,owner]);
    await db.query("delete from auth.users where id=$1", [owner]);
    expect((await db.query("select user_id,parent_id from public.comments")).rows).toEqual([{ user_id: other, parent_id: null }]);
    expect((await db.query("select comment_id,reported_by from public.moderation_queue")).rows).toEqual([{ comment_id: null, reported_by: null }]);
    await asUser();
    await expect(db.query("insert into storage.objects(bucket_id,name) values('avatars',$1)", [`${owner}/avatar.webp`])).rejects.toThrow(/row-level security/);
  });

  it("executes hardened ranking functions with an empty search path", async () => {
    await comment();
    await db.exec("set role service_role; set search_path=''");
    expect((await db.query("select * from public.hot_episodes()")).rows).toHaveLength(1);
    expect((await db.query("select * from public.get_top_commenters_7days()")).rows).toHaveLength(1);
    expect((await db.query("select * from public.get_trending_seasons()")).rows).toHaveLength(1);
    expect((await db.query("select * from public.hot_episodes_by_series(array[700])")).rows).toHaveLength(1);
    expect((await db.query("select * from public.popular_series()")).rows).toHaveLength(0);
    expect((await db.query("select public.privacy_tools_version() as version")).rows).toEqual([{ version: 1 }]);
    await db.exec("set search_path=public");
  });

  it("does not let an oversized numeric episode identifier crash rankings", async () => {
    await comment("ID não reconhecido", "999999999999999999999999-s999999999999999-e1");
    await db.exec("set role service_role");
    expect((await db.query("select * from public.hot_episodes_by_series(array[700])")).rows).toEqual([]);
    expect((await db.query("select * from public.get_trending_seasons()")).rows).toEqual([]);
  });
});
