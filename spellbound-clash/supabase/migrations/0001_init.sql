-- =============================================================================
-- Spellbound Clash — initial schema (custom username+PIN login, global leaderboard)
-- Run via `supabase db push` or the Supabase SQL editor.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---- players ---------------------------------------------------------------
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  username    text not null unique,
  pin_hash    text not null,
  created_at  timestamptz not null default now()
);

-- ---- sessions (custom login tokens, no Supabase Auth) ----------------------
create table if not exists public.sessions (
  token       uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.players(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---- saves (per-player cloud progress) -------------------------------------
create table if not exists public.saves (
  player_id   uuid primary key references public.players(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- ---- leaderboard (global, one best row per player+difficulty) --------------
create table if not exists public.leaderboard (
  id                bigint generated always as identity primary key,
  player_id         uuid not null references public.players(id) on delete cascade,
  username          text not null,
  score             integer not null default 0,
  difficulty        text not null,
  enemies_defeated  integer not null default 0,
  date              date not null default current_date,
  created_at        timestamptz not null default now(),
  unique (player_id, difficulty)
);

create index if not exists leaderboard_score_idx
  on public.leaderboard (score desc, date desc);

-- ---- row-level security: deny direct table access; use RPCs only -----------
alter table public.players    enable row level security;
alter table public.sessions   enable row level security;
alter table public.saves      enable row level security;
alter table public.leaderboard enable row level security;

-- =============================================================================
-- RPC functions (SECURITY DEFINER so anon can use them without table grants)
-- =============================================================================

-- ---- register: create account with bcrypt-hashed PIN -----------------------
create or replace function public.register_player(
  p_username text,
  p_pin text
) returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  p_username := lower(btrim(p_username));
  if length(p_username) < 1 or length(p_username) > 20 then
    raise exception 'invalid_username';
  end if;
  if length(p_pin) < 4 or length(p_pin) > 8 then
    raise exception 'invalid_pin';
  end if;
  if exists (select 1 from public.players where username = p_username) then
    raise exception 'username_taken';
  end if;

  insert into public.players (username, pin_hash)
  values (p_username, crypt(p_pin, gen_salt('bf', 10)))
  returning id into v_id;

  return json_build_object('player_id', v_id, 'username', p_username);
end;
$$;

-- ---- login: verify PIN, create a session token -----------------------------
create or replace function public.login_player(
  p_username text,
  p_pin text
) returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_player public.players%rowtype;
  v_token uuid;
begin
  p_username := lower(btrim(p_username));
  select * into v_player from public.players where username = p_username;
  if not found then
    raise exception 'invalid_credentials';
  end if;
  if v_player.pin_hash <> crypt(p_pin, v_player.pin_hash) then
    raise exception 'invalid_credentials';
  end if;

  insert into public.sessions (player_id) values (v_player.id) returning token into v_token;

  return json_build_object('token', v_token, 'player_id', v_player.id, 'username', v_player.username);
end;
$$;

-- ---- save progress (upsert) ------------------------------------------------
create or replace function public.save_progress(
  p_token uuid,
  p_data jsonb
) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_player_id uuid;
begin
  select player_id into v_player_id from public.sessions where token = p_token;
  if not found then
    raise exception 'invalid_token';
  end if;

  insert into public.saves (player_id, data, updated_at)
  values (v_player_id, p_data, now())
  on conflict (player_id)
  do update set data = excluded.data, updated_at = now();

  return true;
end;
$$;

-- ---- load progress -----------------------------------------------------------
create or replace function public.load_progress(
  p_token uuid
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_player_id uuid;
  v_data jsonb;
begin
  select player_id into v_player_id from public.sessions where token = p_token;
  if not found then
    raise exception 'invalid_token';
  end if;

  select data into v_data from public.saves where player_id = v_player_id;
  return coalesce(v_data, '{}'::jsonb);
end;
$$;

-- ---- submit score: keep the best row per (player, difficulty) ---------------
create or replace function public.submit_score(
  p_token uuid,
  p_score integer,
  p_difficulty text,
  p_enemies_defeated integer
) returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_player_id uuid;
  v_username text;
  v_prev integer;
  v_best integer;
  v_is_new boolean;
begin
  select s.player_id, p.username
    into v_player_id, v_username
    from public.sessions s
    join public.players p on p.id = s.player_id
   where s.token = p_token;
  if not found then
    raise exception 'invalid_token';
  end if;

  if p_score < 0 or p_score > 1000000 then
    raise exception 'invalid_score';
  end if;

  select score into v_prev
    from public.leaderboard
   where player_id = v_player_id and difficulty = p_difficulty;

  v_is_new := not found;
  v_best := greatest(coalesce(v_prev, 0), p_score);

  insert into public.leaderboard (player_id, username, score, difficulty, enemies_defeated)
  values (v_player_id, v_username, v_best, p_difficulty, p_enemies_defeated)
  on conflict (player_id, difficulty)
  do update set score = excluded.score,
                username = excluded.username,
                enemies_defeated = excluded.enemies_defeated,
                date = excluded.date;

  return json_build_object('is_new', v_is_new, 'best_score', v_best);
end;
$$;

-- ---- global leaderboard (public read, no token needed) ----------------------
create or replace function public.get_leaderboard(
  p_limit integer default 50
) returns table (
  rank         bigint,
  username     text,
  score        integer,
  difficulty   text,
  enemies_defeated integer,
  date         date
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
    select row_number() over (order by l.score desc, l.created_at asc)::bigint as rank,
           l.username,
           l.score,
           l.difficulty,
           l.enemies_defeated,
           l.date
      from public.leaderboard l
     order by l.score desc, l.created_at asc
     limit greatest(1, least(p_limit, 200));
end;
$$;

-- ---- grants: anon may only execute the RPCs ---------------------------------
revoke all on table public.players, public.sessions, public.saves, public.leaderboard from anon, authenticated;
grant execute on function public.register_player(text, text) to anon, authenticated;
grant execute on function public.login_player(text, text) to anon, authenticated;
grant execute on function public.save_progress(uuid, jsonb) to anon, authenticated;
grant execute on function public.load_progress(uuid) to anon, authenticated;
grant execute on function public.submit_score(uuid, integer, text, integer) to anon, authenticated;
grant execute on function public.get_leaderboard(integer) to anon, authenticated;