import { supabase, isCloudEnabled } from "./supabase";
import type { SaveData } from "../types/game.types";

const TOKEN_KEY = "spellbound_token";
const PROFILE_KEY = "spellbound_profile";

export interface CloudProfile {
  token: string;
  playerId: string;
  username: string;
}

export function readStoredToken(): CloudProfile | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CloudProfile;
  } catch {
    return null;
  }
}

export function storeToken(profile: CloudProfile) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(profile));
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ username: profile.username }));
  } catch {
    /* ignore */
  }
}

export function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function readStoredUsername(): string | null {
  try {
    return localStorage.getItem(PROFILE_KEY)
      ? (JSON.parse(localStorage.getItem(PROFILE_KEY)!) as { username: string }).username
      : null;
  } catch {
    return null;
  }
}

// ---- RPC wrappers -----------------------------------------------------------

async function rpc<T>(
  fn: (sb: NonNullable<typeof supabase>) => PromiseLike<{ data: T | null; error: unknown }>
): Promise<T> {
  if (!isCloudEnabled() || !supabase) {
    throw new Error("cloud_disabled");
  }
  const { data, error } = await fn(supabase);
  if (error) {
    const msg = (error as { message?: string }).message ?? "unknown_error";
    throw new Error(msg.toLowerCase().replace(/^rpc exception: /, ""));
  }
  return data as T;
}

export interface RegisterResult {
  player_id: string;
  username: string;
}

export function registerCloud(username: string, pin: string): Promise<RegisterResult> {
  return rpc((sb) => sb.rpc("register_player", { p_username: username, p_pin: pin }));
}

export interface LoginResult {
  token: string;
  player_id: string;
  username: string;
}

export function loginCloud(username: string, pin: string): Promise<LoginResult> {
  return rpc((sb) => sb.rpc("login_player", { p_username: username, p_pin: pin }));
}

export function saveProgressCloud(token: string, data: SaveData): Promise<boolean> {
  return rpc((sb) => sb.rpc("save_progress", { p_token: token, p_data: data }));
}

export function loadProgressCloud(token: string): Promise<SaveData | null> {
  return rpc(async (sb) => {
    const { data, error } = await sb.rpc("load_progress", { p_token: token });
    if (error) return { data: null, error };
    const obj = (data ?? {}) as SaveData;
    return { data: Object.keys(obj).length ? obj : null, error: null };
  });
}

export interface ScoreResult {
  is_new: boolean;
  best_score: number;
}

export function submitScoreCloud(
  token: string,
  score: number,
  difficulty: string,
  enemiesDefeated: number
): Promise<ScoreResult> {
  return rpc((sb) =>
    sb.rpc("submit_score", {
      p_token: token,
      p_score: score,
      p_difficulty: difficulty,
      p_enemies_defeated: enemiesDefeated,
    })
  );
}

export interface LeaderboardRow {
  rank: number;
  username: string;
  score: number;
  difficulty: string;
  enemies_defeated: number;
  date: string;
}

export function getLeaderboardCloud(limit = 50): Promise<LeaderboardRow[]> {
  return rpc((sb) => sb.rpc("get_leaderboard", { p_limit: limit }));
}