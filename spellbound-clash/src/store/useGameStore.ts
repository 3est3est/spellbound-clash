import { create } from "zustand";
import {
  type GameState,
  type Difficulty,
  type VocabQuestion,
  type EnemyData,
  type BattleResult,
  type SaveData,
  type LeaderboardEntry,
  DIFFICULTY_CONFIGS,
} from "../types/game.types";
import vocabData from "../data/vocabQuestions.json";
import { ZONE_ENEMIES } from "../game/enemyPlacement";
import { ADMIN_CODE } from "../game/constants";
import {
  registerCloud,
  loginCloud,
  saveProgressCloud,
  loadProgressCloud,
  submitScoreCloud,
  getLeaderboardCloud,
  readStoredToken,
  storeToken,
  readStoredUsername,
} from "../lib/cloud";
import { isCloudEnabled } from "../lib/supabase";

const SAVE_KEY = "spellbound_save";
const LEADERBOARD_KEY = "spellbound_leaderboard";
const SETTINGS_KEY = "spellbound_settings";

let cloudSaveTimer: ReturnType<typeof setTimeout> | null = null;

interface AudioSettings {
  bgmVolume: number;
  isMuted: boolean;
}

const defaultSettings: AudioSettings = {
  bgmVolume: 0.5,
  isMuted: false,
};

function readSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return {
      bgmVolume: typeof parsed.bgmVolume === 'number' ? parsed.bgmVolume : 0.6,
      isMuted: typeof parsed.isMuted === 'boolean' ? parsed.isMuted : false,
    };
  } catch {
    return defaultSettings;
  }
}

function writeSettings(s: AudioSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// ราคาซื้อปลดล็อคประตูไปโซนถัดไป (key = โซนที่ต้องการปลด)
export const GATE_UNLOCK_PRICES: Record<number, number> = { 2: 10, 3: 30, 4: 60 };

// ===== Store Interface =====

interface GameStore {
  // Audio Settings
  bgmVolume: number;
  isMuted: boolean;

  // Core State
  gameState: GameState;
  difficulty: Difficulty;

  // Player
  playerHP: number;
  maxPlayerHP: number;
  coins: number;
  score: number;
  playerName: string;
  pin: string;
  playerPos: { tx: number; ty: number };

  // Zones
  unlockedZones: number[];
  zoneBanner: string | null;
  adminMode: boolean;

  // Enemy
  enemies: EnemyData[];
  currentEnemy: EnemyData | null;
  enemyHP: number;
  maxEnemyHP: number;
  enemiesDefeated: number;
  totalEnemies: number;

  // Battle / Questions
  currentQuestion: VocabQuestion | null;
  questionIndex: number;
  usedQuestionIds: number[];
  timerSeconds: number;
  battleResult: BattleResult | null;
  totalCorrect: number;
  totalWrong: number;
  isPaused: boolean;
  gameStartedAt: number | null;

  // Actions
  setDifficulty: (difficulty: Difficulty) => void;
  setIsPaused: (isPaused: boolean) => void;
  startGame: () => void;
  enterBattleTransition: (enemyId: string, playerPos?: { tx: number; ty: number }) => void;
  enterBattle: () => void;
  answerQuestion: (isCorrect: boolean) => void;
  timeUp: () => void;
  nextQuestion: () => void;
  defeatEnemy: () => void;
  resetGame: () => void;
  clearBattleResult: () => void;
  clearZoneBanner: () => void;

  // Profile / Save
  sessionToken: string | null;
  createProfile: (name: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  hasSave: () => boolean;
  getSavedName: () => string | null;
  continueGame: (name: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  saveProgress: () => void;
  saveCheckpoint: (tx: number, ty: number) => void;
  clearSave: () => void;
  recordScore: () => void;
  getLeaderboard: () => Promise<LeaderboardEntry[]>;

  // Pets & Gacha System
  petsOwned: string[];
  equippedPet: string | null;
  isGachaOpen: boolean;
  isInventoryOpen: boolean;
  buyGacha: () => string | null;
  buyGachaMultiple: (count: number) => string[] | null;
  equipPet: (pet: string | null) => void;
  setGachaOpen: (open: boolean) => void;
  setInventoryOpen: (open: boolean) => void;
  tickRespawns: () => void;

  // Equipment & Shop System
  itemsOwned: string[];
  equippedHat: string | null;
  equippedSword: string | null;
  equippedShoes: string | null;
  isShopOpen: boolean;
  hatUpgradeLevel: number;
  swordUpgradeLevel: number;
  setShopOpen: (open: boolean) => void;
  buyItem: (item: string) => boolean;
  upgradeItem: (item: "hat" | "sword") => boolean;
  equipItem: (item: string, slot: string) => void;
  unequipItem: (slot: string) => void;
  buyGateUnlock: (zone: 2 | 3 | 4) => boolean;
  setAdminCode: (code: string) => boolean;
  adminAddCoins: (amount?: number) => void;
  unlockGateAdmin: (zone: 2 | 3 | 4) => boolean;
  clearAdminMode: () => void;

  setBgmVolume: (vol: number) => void;
  toggleMute: () => void;
}

// ===== Helper: Get random questions =====

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getRandomQuestions(count: number, vocabLevel: string, usedIds: number[]): VocabQuestion[] {
  const allQuestions = vocabData as VocabQuestion[];
  const pool = allQuestions.filter((q) => q.difficulty === vocabLevel);

  const unused = shuffleArray(pool.filter((q) => !usedIds.includes(q.id)));
  if (unused.length >= count) {
    return unused.slice(0, count).map((q) => ({
      ...q,
      choices: shuffleArray(q.choices),
    }));
  }

  const recycled = shuffleArray(pool.filter((q) => usedIds.includes(q.id)));
  const available = [...unused, ...recycled];
  return available.slice(0, count).map((q) => ({
    ...q,
    choices: shuffleArray(q.choices),
  }));
}

// ===== Helper: Generate Enemies =====

function generateEnemies(): EnemyData[] {
  return ZONE_ENEMIES.map((spec, i) => ({
    id: `enemy-${i + 1}`,
    position: [spec.pos[0], 0.5, spec.pos[1]],
    defeated: false,
    name: spec.name,
    zone: spec.zone,
  }));
}

// ===== Helper: Upgrade Cost =====

export function getUpgradeCost(item: 'hat' | 'sword', nextLevel: number): number {
  if (item === 'hat') {
    return 15 + Math.floor(nextLevel * nextLevel * 2.5 + nextLevel * 5);
  } else {
    return 30 + Math.floor(nextLevel * nextLevel * 4.5 + nextLevel * 8);
  }
}

// ===== Store =====

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

function writeSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function eraseSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

function readLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function writeLeaderboard(list: LeaderboardEntry[]) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

function updateLeaderboard(entry: LeaderboardEntry) {
  const list = readLeaderboard();
  const idx = list.findIndex(
    (e) => e.name.toLowerCase() === entry.name.toLowerCase() && e.difficulty === entry.difficulty
  );
  if (idx >= 0) {
    if (entry.score > list[idx].score) list[idx] = entry;
  } else {
    list.push(entry);
  }
  list.sort((a, b) => b.score - a.score);
  writeLeaderboard(list);
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  bgmVolume: readSettings().bgmVolume,
  isMuted: readSettings().isMuted,
  gameState: "MENU",
  difficulty: "EASY",

  playerHP: 5,
  maxPlayerHP: 5,
  coins: 0,
  score: 0,
  playerName: "",
  pin: "",
  playerPos: { tx: 3, ty: 4 },

  sessionToken: readStoredToken()?.token ?? null,

  unlockedZones: [1],
  zoneBanner: null,
  adminMode: false,

  petsOwned: [],
  equippedPet: null,
  isGachaOpen: false,
  isInventoryOpen: false,

  itemsOwned: [],
  equippedHat: null,
  equippedSword: null,
  equippedShoes: null,
  isShopOpen: false,
  hatUpgradeLevel: 0,
  swordUpgradeLevel: 0,

  enemies: [],
  currentEnemy: null,
  enemyHP: 5,
  maxEnemyHP: 5,
  enemiesDefeated: 0,
  totalEnemies: 12,

  currentQuestion: null,
  questionIndex: 0,
  usedQuestionIds: [],
  timerSeconds: 10,
  battleResult: null,
  totalCorrect: 0,
  totalWrong: 0,
  isPaused: false,
  gameStartedAt: null,

  // ===== Actions =====

  setBgmVolume: (bgmVolume) => {
    set({ bgmVolume });
    writeSettings({ bgmVolume, isMuted: get().isMuted });
  },

  toggleMute: () => {
    const isMuted = !get().isMuted;
    set({ isMuted });
    writeSettings({ bgmVolume: get().bgmVolume, isMuted });
  },

  setIsPaused: (isPaused) => {
    set({ isPaused });
  },

  setDifficulty: (difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    set({
      difficulty,
      playerHP: config.playerHP,
      maxPlayerHP: config.playerHP,
      enemyHP: config.enemyHP,
      maxEnemyHP: config.enemyHP,
      timerSeconds: config.timerSeconds,
    });
  },

  startGame: () => {
    const { difficulty } = get();
    const config = DIFFICULTY_CONFIGS[difficulty];
    const saved = readSave();
    const continuing = !!saved && saved.name === get().playerName && saved.pin === get().pin;
    const adminMode = continuing ? (saved!.adminMode ?? false) : get().adminMode;
    set({
      gameState: "EXPLORE",
      difficulty: continuing ? saved!.difficulty : difficulty,
      playerHP: continuing ? saved!.playerHP : config.playerHP,
      maxPlayerHP: continuing ? saved!.maxPlayerHP : config.playerHP,
      coins: adminMode ? 9999999 : continuing ? saved!.coins : 0,
      score: continuing ? saved!.score : 0,
      playerPos: continuing ? saved!.playerPos : { tx: 3, ty: 4 },
      unlockedZones: continuing ? (saved!.unlockedZones ?? [1]) : [1],
      zoneBanner: null,
      enemyHP: config.enemyHP,
      maxEnemyHP: config.enemyHP,
      enemies: continuing ? saved!.enemies : generateEnemies(),
      currentEnemy: null,
      enemiesDefeated: continuing ? saved!.enemiesDefeated : 0,
      totalEnemies: config.totalEnemies,
      questionIndex: 0,
      usedQuestionIds: [],
      currentQuestion: null,
      battleResult: null,
      totalCorrect: 0,
      totalWrong: 0,
      isPaused: false,
      gameStartedAt: Date.now(),
      petsOwned: continuing ? (saved!.petsOwned ?? []) : [],
      equippedPet: continuing ? (saved!.equippedPet ?? null) : null,
      isGachaOpen: false,
      isInventoryOpen: false,
      itemsOwned: continuing ? (saved!.itemsOwned ?? []) : [],
      equippedHat: continuing ? (saved!.equippedHat ?? null) : null,
      equippedSword: continuing ? (saved!.equippedSword ?? null) : null,
      equippedShoes: continuing ? (saved!.equippedShoes ?? null) : null,
      isShopOpen: false,
      hatUpgradeLevel: continuing ? (saved!.hatUpgradeLevel ?? 0) : 0,
      swordUpgradeLevel: continuing ? (saved!.swordUpgradeLevel ?? 0) : 0,
      adminMode: adminMode,
    });
  },

  enterBattleTransition: (enemyId, playerPos) => {
    const { enemies } = get();
    const enemy = enemies.find((e) => e.id === enemyId);
    if (enemy && !enemy.defeated) {
      set({
        gameState: "BATTLE_TRANSITION",
        currentEnemy: enemy,
        ...(playerPos ? { playerPos } : {}),
      });
    }
  },

  enterBattle: () => {
    const { difficulty, usedQuestionIds, currentEnemy } = get();
    const config = DIFFICULTY_CONFIGS[difficulty];
    const questions = getRandomQuestions(config.questionCount, config.vocabLevel, usedQuestionIds);

    // Zone-based enemy HP: zone1 = difficulty config, zone2 = 7, zone3 = 10, zone4 = 15
    const zoneHPMap: Record<number, number> = { 1: config.enemyHP, 2: 7, 3: 10, 4: 15 };
    const zone = currentEnemy?.zone ?? 1;
    const enemyHP = zoneHPMap[zone] ?? config.enemyHP;

    if (questions.length > 0) {
      set({
        gameState: "BATTLE",
        enemyHP,
        maxEnemyHP: enemyHP,
        questionIndex: 0,
        currentQuestion: questions[0],
        battleResult: null,
        timerSeconds: config.timerSeconds,
      });
    }
  },

  answerQuestion: (isCorrect) => {
    const state = get();
    if (isCorrect) {
      const equippedPet = state.equippedPet;
      let petDmgBonus = 0;
      if (equippedPet === "cat" || equippedPet === "frog") petDmgBonus = 1;
      else if (equippedPet === "octopus" || equippedPet === "phoenix") petDmgBonus = 2;
      else if (equippedPet === "shadow") petDmgBonus = 3;

      const isSwordEquipped = state.equippedSword === "sword";
      const swordBonus = isSwordEquipped ? (1 + (state.swordUpgradeLevel > 0 ? 0.5 + state.swordUpgradeLevel * 0.5 : 0)) : 0;
      const dmg = 1 + petDmgBonus + swordBonus;
      const newEnemyHP = Math.max(0, state.enemyHP - dmg);
      set({
        enemyHP: newEnemyHP,
        battleResult: "CORRECT",
        totalCorrect: state.totalCorrect + 1,
        score: state.score + 10,
        usedQuestionIds: state.currentQuestion ? [...state.usedQuestionIds, state.currentQuestion.id] : state.usedQuestionIds,
      });

      if (newEnemyHP <= 0) {
        setTimeout(() => get().defeatEnemy(), 1200);
      }
    } else {
      const newPlayerHP = state.adminMode ? state.playerHP : state.playerHP - 1;
      set({
        playerHP: newPlayerHP,
        battleResult: "WRONG",
        totalWrong: state.totalWrong + 1,
        usedQuestionIds: state.currentQuestion ? [...state.usedQuestionIds, state.currentQuestion.id] : state.usedQuestionIds,
      });

      if (newPlayerHP <= 0) {
        setTimeout(() => {
          get().recordScore();
          get().clearSave();
          set({ gameState: "GAMEOVER" });
        }, 1200);
      }
    }
  },

  timeUp: () => {
    const state = get();
    const newPlayerHP = state.adminMode ? state.playerHP : state.playerHP - 1;
    set({
      playerHP: newPlayerHP,
      battleResult: "TIMEOUT",
      totalWrong: state.totalWrong + 1,
      usedQuestionIds: state.currentQuestion ? [...state.usedQuestionIds, state.currentQuestion.id] : state.usedQuestionIds,
    });

    if (newPlayerHP <= 0) {
      setTimeout(() => {
        get().recordScore();
        get().clearSave();
        set({ gameState: "GAMEOVER" });
      }, 1200);
    }
  },

  nextQuestion: () => {
    const state = get();
    const config = DIFFICULTY_CONFIGS[state.difficulty];
    const nextIndex = state.questionIndex + 1;

    const questions = getRandomQuestions(1, config.vocabLevel, state.usedQuestionIds);

    if (questions.length > 0) {
      set({
        questionIndex: nextIndex,
        currentQuestion: questions[0],
        battleResult: null,
        timerSeconds: config.timerSeconds,
      });
    }
  },

  defeatEnemy: () => {
    const state = get();
    if (!state.currentEnemy) return;

    const updatedEnemies = state.enemies.map((e) =>
      e.id === state.currentEnemy!.id ? { ...e, defeated: true, respawnTime: Date.now() + 20000 } : e
    );
    const newDefeated = state.enemiesDefeated + 1;
    const defeatedEnemyZone = state.currentEnemy.zone;
    const rewardMap: Record<number, number> = { 1: 2, 2: 5, 3: 10, 4: 15 };
    const reward = rewardMap[defeatedEnemyZone] || 2;
    const doubleCoinPet = state.equippedPet === 'pig' || state.equippedPet === 'cow' || state.equippedPet === 'phoenix' || state.equippedPet === 'shadow';
    const finalCoinReward = doubleCoinPet ? reward * 2 : reward;

    let finalPlayerHP = state.playerHP;
    const isHealerPet = state.equippedPet === 'dog' || state.equippedPet === 'shadow' || state.equippedPet === 'crab';
    if (isHealerPet) {
      const healAmount = state.playerHP <= 2 ? 2 : 1;
      finalPlayerHP = Math.min(state.maxPlayerHP, state.playerHP + healAmount);
    }

    const newUnlockedZones = [...state.unlockedZones];

    set({
      enemies: updatedEnemies,
      enemiesDefeated: newDefeated,
      coins: state.coins + finalCoinReward,
      playerHP: finalPlayerHP,
      currentEnemy: null,
      unlockedZones: newUnlockedZones,
      zoneBanner: null,
      gameState: "EXPLORE",
      battleResult: null,
      currentQuestion: null,
    });

    get().saveProgress();
  },

  clearBattleResult: () => {
    set({ battleResult: null });
  },

  clearZoneBanner: () => {
    set({ zoneBanner: null });
  },

  // ===== Profile / Save =====

  createProfile: async (name, pin) => {
    const finalName = name.trim() || "Player";
    const finalPin = pin.trim() || "0000";

    if (isCloudEnabled()) {
      try {
        const res = await registerCloud(finalName, finalPin);
        const tokenRes = await loginCloud(res.username, finalPin);
        storeToken({ token: tokenRes.token, playerId: tokenRes.player_id, username: tokenRes.username });
        set({ playerName: res.username, pin: finalPin, sessionToken: tokenRes.token });
        return { ok: true };
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "username_taken") {
          return { ok: false, error: "ชื่อนี้มีผู้ใช้แล้ว กรุณาใช้ชื่ออื่น" };
        }
        if (msg === "cloud_disabled") {
          // fall through to local-only
        } else {
          return { ok: false, error: "ไม่สามารถสร้างบัญชีได้ ลองอีกครั้ง" };
        }
      }
    }

    set({ playerName: finalName, pin: finalPin });
    return { ok: true };
  },

  hasSave: () => readSave() !== null,

  getSavedName: () => readSave()?.name ?? readStoredUsername(),

  continueGame: async (name, pin) => {
    const trimmedName = name.trim();
    const trimmedPin = pin.trim();
    if (!trimmedName || !trimmedPin) return { ok: false, error: "กรุณากรอกชื่อและ PIN" };

    if (isCloudEnabled()) {
      try {
        const login = await loginCloud(trimmedName, trimmedPin);
        storeToken({ token: login.token, playerId: login.player_id, username: login.username });
        set({
          playerName: login.username,
          pin: trimmedPin,
          sessionToken: login.token,
        });

        // Load cloud save (if any) into the store so startGame can continue it.
        const cloudSave = await loadProgressCloud(login.token);
        if (cloudSave) {
          writeSave(cloudSave);
          set({
            playerName: cloudSave.name,
            pin: cloudSave.pin,
            difficulty: cloudSave.difficulty,
            petsOwned: cloudSave.petsOwned ?? [],
            equippedPet: cloudSave.equippedPet ?? null,
            isGachaOpen: false,
            isInventoryOpen: false,
            itemsOwned: cloudSave.itemsOwned ?? [],
            equippedHat: cloudSave.equippedHat ?? null,
            equippedSword: cloudSave.equippedSword ?? null,
            equippedShoes: cloudSave.equippedShoes ?? null,
            isShopOpen: false,
            hatUpgradeLevel: cloudSave.hatUpgradeLevel ?? 0,
            swordUpgradeLevel: cloudSave.swordUpgradeLevel ?? 0,
            adminMode: cloudSave.adminMode ?? false,
          });
        } else {
          // No cloud save yet — push the existing local save up if it matches
          // this account (migration of the pre-cloud save), then reload it.
          const localSave = readSave();
          if (localSave && localSave.name.toLowerCase() === trimmedName.toLowerCase() && localSave.pin === trimmedPin) {
            await saveProgressCloud(login.token, localSave);
            set({
              playerName: localSave.name,
              pin: localSave.pin,
              difficulty: localSave.difficulty,
              petsOwned: localSave.petsOwned ?? [],
              equippedPet: localSave.equippedPet ?? null,
              isGachaOpen: false,
              isInventoryOpen: false,
              itemsOwned: localSave.itemsOwned ?? [],
              equippedHat: localSave.equippedHat ?? null,
              equippedSword: localSave.equippedSword ?? null,
              equippedShoes: localSave.equippedShoes ?? null,
              isShopOpen: false,
              hatUpgradeLevel: localSave.hatUpgradeLevel ?? 0,
              swordUpgradeLevel: localSave.swordUpgradeLevel ?? 0,
              adminMode: localSave.adminMode ?? false,
            });
          }
        }
        return { ok: true };
      } catch (err) {
        const msg = (err as Error).message;
        if (msg === "invalid_credentials") {
          return { ok: false, error: "ชื่อหรือ PIN ไม่ถูกต้อง" };
        }
        if (msg === "cloud_disabled") {
          // fall through to local-only
        } else {
          return { ok: false, error: "ไม่สามารถเข้าสู่ระบบได้ ลองอีกครั้ง" };
        }
      }
    }

    const saved = readSave();
    if (!saved) return { ok: false, error: "ยังไม่มีข้อมูลผู้เล่นนี้ในเครื่อง" };
    if (saved.name.toLowerCase() !== trimmedName.toLowerCase()) return { ok: false, error: "ชื่อหรือ PIN ไม่ถูกต้อง" };
    if (saved.pin !== trimmedPin) return { ok: false, error: "ชื่อหรือ PIN ไม่ถูกต้อง" };
    set({
      playerName: saved.name,
      pin: saved.pin,
      difficulty: saved.difficulty,
      petsOwned: saved.petsOwned ?? [],
      equippedPet: saved.equippedPet ?? null,
      isGachaOpen: false,
      isInventoryOpen: false,
      itemsOwned: saved.itemsOwned ?? [],
      equippedHat: saved.equippedHat ?? null,
      equippedSword: saved.equippedSword ?? null,
      equippedShoes: saved.equippedShoes ?? null,
      isShopOpen: false,
      hatUpgradeLevel: saved.hatUpgradeLevel ?? 0,
      swordUpgradeLevel: saved.swordUpgradeLevel ?? 0,
      adminMode: saved.adminMode ?? false,
    });
    return { ok: true };
  },

  saveProgress: () => {
    const s = get();
    if (!s.playerName) return;
    const data: SaveData = {
      name: s.playerName,
      pin: s.pin,
      difficulty: s.difficulty,
      playerHP: s.playerHP,
      maxPlayerHP: s.maxPlayerHP,
      coins: s.coins,
      score: s.score,
      enemiesDefeated: s.enemiesDefeated,
      totalEnemies: s.totalEnemies,
      enemies: s.enemies,
      playerPos: s.playerPos,
      unlockedZones: s.unlockedZones,
      petsOwned: s.petsOwned,
      equippedPet: s.equippedPet,
      itemsOwned: s.itemsOwned,
      equippedHat: s.equippedHat,
      equippedSword: s.equippedSword,
      equippedShoes: s.equippedShoes,
      hatUpgradeLevel: s.hatUpgradeLevel,
      swordUpgradeLevel: s.swordUpgradeLevel,
      adminMode: s.adminMode,
    };
    writeSave(data);

    // Sync to cloud (debounced — saveCheckpoint fires often)
    if (isCloudEnabled() && s.sessionToken) {
      if (cloudSaveTimer) clearTimeout(cloudSaveTimer);
      cloudSaveTimer = setTimeout(() => {
        cloudSaveTimer = null;
        saveProgressCloud(s.sessionToken!, data).catch(() => {
          /* offline — local copy remains */
        });
      }, 1500);
    }
  },

  saveCheckpoint: (tx, ty) => {
    const s = get();
    if (!s.playerName) return;
    set({ playerPos: { tx, ty } });
    get().saveProgress();
  },

  clearSave: () => {
    eraseSave();
    if (isCloudEnabled() && get().sessionToken) {
      if (cloudSaveTimer) {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = null;
      }
      saveProgressCloud(get().sessionToken!, {} as SaveData).catch(() => {
        /* ignore */
      });
    }
  },

  recordScore: () => {
    const s = get();
    if (!s.playerName) return;
    updateLeaderboard({
      name: s.playerName,
      score: s.score,
      difficulty: s.difficulty,
      enemiesDefeated: s.enemiesDefeated,
      date: new Date().toISOString().slice(0, 10),
    });

    if (isCloudEnabled() && s.sessionToken) {
      submitScoreCloud(s.sessionToken, s.score, s.difficulty, s.enemiesDefeated).catch(() => {
        /* ignore — score still saved locally */
      });
    }
  },

  getLeaderboard: async () => {
    if (isCloudEnabled()) {
      try {
        const rows = await getLeaderboardCloud(50);
        return rows.map((r) => ({
          name: r.username,
          score: r.score,
          difficulty: r.difficulty as Difficulty,
          enemiesDefeated: r.enemies_defeated,
          date: r.date,
        }));
      } catch {
        /* fall back to local board */
      }
    }
    return readLeaderboard();
  },

  resetGame: () => {
    set({
      gameState: "MENU",
      difficulty: "EASY",
      playerHP: 5,
      maxPlayerHP: 5,
      coins: 0,
      score: 0,
      playerName: "",
      pin: "",
      playerPos: { tx: 3, ty: 4 },
      unlockedZones: [1],
      zoneBanner: null,
      adminMode: false,
      enemies: [],
      currentEnemy: null,
      enemyHP: 5,
      maxEnemyHP: 5,
      enemiesDefeated: 0,
      totalEnemies: 12,
      questionIndex: 0,
      usedQuestionIds: [],
      currentQuestion: null,
      timerSeconds: 10,
      battleResult: null,
      totalCorrect: 0,
      totalWrong: 0,
      isPaused: false,
      gameStartedAt: null,
      petsOwned: [],
      equippedPet: null,
      isGachaOpen: false,
      itemsOwned: [],
      equippedHat: null,
      equippedSword: null,
      equippedShoes: null,
      isShopOpen: false,
      hatUpgradeLevel: 0,
      swordUpgradeLevel: 0,
    });
  },

  buyGacha: () => {
    const state = get();
    if (!state.adminMode && state.coins < 5) return null;

    const newCoins = state.adminMode ? state.coins : state.coins - 5;

    // Exact probabilities matching the gacha sheet:
    // Crab (36%), Cow (36%), Frog (16%), Octopus (6.2%), Dog (3.1%), Phoenix (2.1%), Shadow (0.6%)
    const rand = Math.random() * 100;
    let pulledPet = "crab";

    if (rand < 36) {
      pulledPet = "crab";
    } else if (rand < 72) {
      pulledPet = "cow";
    } else if (rand < 88) {
      pulledPet = "frog";
    } else if (rand < 94.2) {
      pulledPet = "octopus";
    } else if (rand < 97.3) {
      pulledPet = "dog";
    } else if (rand < 99.4) {
      pulledPet = "phoenix";
    } else {
      pulledPet = "shadow";
    }

    const newPets = [...(get().petsOwned || []), pulledPet];

    set({
      coins: newCoins,
      petsOwned: newPets,
    });

    get().saveProgress();
    return pulledPet;
  },

  buyGachaMultiple: (count) => {
    const state = get();
    let cost = count * 5;
    if (count === 3) cost = 15;
    else if (count === 8) cost = 40;

    if (!state.adminMode && state.coins < cost) return null;

    const newCoins = state.adminMode ? state.coins : state.coins - cost;
    const pulledPets: string[] = [];

    for (let i = 0; i < count; i++) {
      const rand = Math.random() * 100;
      let pulledPet = "crab";

      if (rand < 36) {
        pulledPet = "crab";
      } else if (rand < 72) {
        pulledPet = "cow";
      } else if (rand < 88) {
        pulledPet = "frog";
      } else if (rand < 94.2) {
        pulledPet = "octopus";
      } else if (rand < 97.3) {
        pulledPet = "dog";
      } else if (rand < 99.4) {
        pulledPet = "phoenix";
      } else {
        pulledPet = "shadow";
      }
      pulledPets.push(pulledPet);
    }

    const newPets = [...(get().petsOwned || []), ...pulledPets];

    set({
      coins: newCoins,
      petsOwned: newPets,
    });

    get().saveProgress();
    return pulledPets;
  },

  equipPet: (pet) => {
    set({ equippedPet: pet });
    get().saveProgress();
  },

  setGachaOpen: (open) => {
    set({ isGachaOpen: open });
  },

  setInventoryOpen: (open) => {
    set({ isInventoryOpen: open });
  },

  tickRespawns: () => {
    const now = Date.now();
    const { enemies } = get();
    let changed = false;
    const updatedEnemies = enemies.map((e) => {
      if (e.defeated && e.respawnTime && now >= e.respawnTime) {
        changed = true;
        const { respawnTime: _, ...rest } = e;
        return { ...rest, defeated: false };
      }
      return e;
    });

    if (changed) {
      set({ enemies: updatedEnemies });
      get().saveProgress();
    }
  },

  setShopOpen: (open) => {
    set({ isShopOpen: open });
  },

  buyGateUnlock: (zone) => {
    const state = get();
    // ต้องปลดโซนก่อนหน้าแล้วก่อน (1 → 2 → 3 → 4)
    const prevZone = (zone - 1) as 1 | 2 | 3;
    if (state.unlockedZones.includes(zone)) return false;
    if (!state.unlockedZones.includes(prevZone)) return false;
    const price = GATE_UNLOCK_PRICES[zone];
    if (price == null || state.coins < price) return false;

    const zoneName: Record<number, string> = { 2: "โซน 2 (ทะเลทราย)", 3: "โซน 3 (เขตน้ำแข็ง)", 4: "โซน 4 (ดินแดนลาวา)" };
    set({
      coins: state.coins - price,
      unlockedZones: [...state.unlockedZones, zone],
      zoneBanner: `🔓 ซื้อปลดล็อคประตูสำเร็จ! เปิดทางสู่ ${zoneName[zone] ?? `โซน ${zone}`} แล้ว (ใช้เหรียญ ${price})`,
    });
    get().saveProgress();
    return true;
  },

  buyItem: (item) => {
    const state = get();
    const priceMap: Record<string, number> = { hat: 15, sword: 30, shoes: 50 };
    const price = priceMap[item] ?? 999;
    if (!state.adminMode && state.coins < price) return false;
    if (state.itemsOwned.includes(item)) return false;

    // Check unlocks
    if (item === "sword" && !state.unlockedZones.includes(2)) return false;
    if (item === "shoes" && !state.unlockedZones.includes(4)) return false;

    set({
      coins: state.adminMode ? state.coins : state.coins - price,
      itemsOwned: [...state.itemsOwned, item],
    });
    get().saveProgress();
    return true;
  },

  upgradeItem: (item) => {
    const state = get();
    if (!state.itemsOwned.includes(item)) return false;

    const currentLevel = item === 'hat' ? (state.hatUpgradeLevel ?? 0) : (state.swordUpgradeLevel ?? 0);
    if (currentLevel >= 12) return false;

    const cost = getUpgradeCost(item, currentLevel + 1);
    if (!state.adminMode && state.coins < cost) return false;

    const nextLevel = currentLevel + 1;
    const newCoins = state.adminMode ? state.coins : state.coins - cost;

    if (item === 'hat') {
      const isEquipped = state.equippedHat === 'hat';
      const prevLevel = state.hatUpgradeLevel ?? 0;
      const prevBonus = 1 + (prevLevel > 0 ? 0.5 + prevLevel * 0.5 : 0);
      const nextBonus = 1 + (nextLevel > 0 ? 0.5 + nextLevel * 0.5 : 0);
      const bonusDiff = nextBonus - prevBonus;

      set({
        coins: newCoins,
        hatUpgradeLevel: nextLevel,
        ...(isEquipped ? {
          maxPlayerHP: state.maxPlayerHP + bonusDiff,
          playerHP: state.playerHP + bonusDiff,
        } : {}),
      });
    } else {
      set({
        coins: newCoins,
        swordUpgradeLevel: nextLevel,
      });
    }

    get().saveProgress();
    return true;
  },

  equipItem: (item, slot) => {
    const state = get();
    if (!state.itemsOwned.includes(item)) return;

    if (slot === "hat") {
      const isAlreadyEquipped = state.equippedHat === item;
      if (!isAlreadyEquipped) {
        const hatBonus = 1 + (state.hatUpgradeLevel > 0 ? 0.5 + state.hatUpgradeLevel * 0.5 : 0);
        set({
          equippedHat: item,
          maxPlayerHP: state.maxPlayerHP + hatBonus,
          playerHP: state.playerHP + hatBonus,
        });
      }
    } else if (slot === "sword") {
      set({ equippedSword: item });
    } else if (slot === "shoes") {
      set({ equippedShoes: item });
    }
    get().saveProgress();
  },

  unequipItem: (slot) => {
    const state = get();
    if (slot === "hat") {
      if (state.equippedHat) {
        const hatBonus = 1 + (state.hatUpgradeLevel > 0 ? 0.5 + state.hatUpgradeLevel * 0.5 : 0);
        const nextMax = Math.max(1, state.maxPlayerHP - hatBonus);
        const nextHP = Math.min(state.playerHP, nextMax);
        set({
          equippedHat: null,
          maxPlayerHP: nextMax,
          playerHP: nextHP,
        });
      }
    } else if (slot === "sword") {
      set({ equippedSword: null });
    } else if (slot === "shoes") {
      set({ equippedShoes: null });
    }
    get().saveProgress();
  },

  // ===== Admin Mode =====

  setAdminCode: (code) => {
    if (!code.trim()) {
      set({ adminMode: false });
      return false;
    }
    const valid = code.trim().toLowerCase() === ADMIN_CODE.toLowerCase();
    if (valid) {
      set({ adminMode: true });
      get().saveProgress();
    }
    return valid;
  },

  adminAddCoins: (amount = 100) => {
    const state = get();
    if (!state.adminMode) return;
    set({
      coins: state.coins + amount,
      zoneBanner: `⭐ ADMIN: ได้รับ 🪙 ${amount} เหรียญเพิ่ม!`,
    });
    get().saveProgress();
  },

  unlockGateAdmin: (zone) => {
    const state = get();
    if (!state.adminMode) return false;
    if (state.unlockedZones.includes(zone)) return false;
    const prevZone = (zone - 1) as 1 | 2 | 3;
    if (!state.unlockedZones.includes(prevZone)) return false;

    const zoneName: Record<number, string> = { 2: "โซน 2 (ทะเลทราย)", 3: "โซน 3 (เขตน้ำแข็ง)", 4: "โซน 4 (ดินแดนลาวา)" };
    set({
      unlockedZones: [...state.unlockedZones, zone],
      zoneBanner: `🔓 Admin ปลดล็อคฟรี! เปิดทางสู่ ${zoneName[zone] ?? `โซน ${zone}`} แล้ว`,
    });
    get().saveProgress();
    return true;
  },

  clearAdminMode: () => {
    set({ adminMode: false });
    get().saveProgress();
  },
}));
