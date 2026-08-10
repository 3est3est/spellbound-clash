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

const SAVE_KEY = "spellbound_save";
const LEADERBOARD_KEY = "spellbound_leaderboard";

// ราคาซื้อปลดล็อคประตูไปโซนถัดไป (key = โซนที่ต้องการปลด)
export const GATE_UNLOCK_PRICES: Record<number, number> = { 2: 10, 3: 30, 4: 60 };

// ===== Store Interface =====

interface GameStore {
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
  createProfile: (name: string, pin: string) => void;
  hasSave: () => boolean;
  getSavedName: () => string | null;
  continueGame: (name: string, pin: string) => boolean;
  saveProgress: () => void;
  saveCheckpoint: (tx: number, ty: number) => void;
  clearSave: () => void;
  recordScore: () => void;
  getLeaderboard: () => LeaderboardEntry[];

  // Pets & Gacha System
  petsOwned: string[];
  equippedPet: string | null;
  isGachaOpen: boolean;
  isInventoryOpen: boolean;
  buyGacha: () => string | null;
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

  let available = allQuestions.filter((q) => q.difficulty === vocabLevel && !usedIds.includes(q.id));

  if (available.length < count) {
    const otherQuestions = allQuestions.filter((q) => q.difficulty !== vocabLevel && !usedIds.includes(q.id));
    available = [...available, ...otherQuestions];
  }

  const shuffled = shuffleArray(available);
  return shuffled.slice(0, count).map((q) => ({
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

function uniqueName(base: string): string {
  const existing = readSave();
  if (!existing) return base;
  if (existing.name.toLowerCase() !== base.toLowerCase()) return base;
  let n = 2;
  let candidate = `${base}${n}`;
  while (existing.name.toLowerCase() === candidate.toLowerCase()) {
    n += 1;
    candidate = `${base}${n}`;
  }
  return candidate;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
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
    set({
      gameState: "EXPLORE",
      difficulty: continuing ? saved!.difficulty : difficulty,
      playerHP: continuing ? saved!.playerHP : config.playerHP,
      maxPlayerHP: continuing ? saved!.maxPlayerHP : config.playerHP,
      coins: continuing ? saved!.coins : 0,
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
      const isCatEquipped = state.equippedPet === "cat";
      const isSwordEquipped = state.equippedSword === "sword";
      const swordBonus = isSwordEquipped ? (1 + (state.swordUpgradeLevel > 0 ? 0.5 + state.swordUpgradeLevel * 0.5 : 0)) : 0;
      const dmg = (isCatEquipped ? 2 : 1) + swordBonus;
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
      const newPlayerHP = state.playerHP - 1;
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
    const newPlayerHP = state.playerHP - 1;
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
      e.id === state.currentEnemy!.id ? { ...e, defeated: true, respawnTime: Date.now() + 40000 } : e
    );
    const newDefeated = state.enemiesDefeated + 1;
    const defeatedEnemyZone = state.currentEnemy.zone;
    const rewardMap: Record<number, number> = { 1: 2, 2: 5, 3: 10, 4: 15 };
    const reward = rewardMap[defeatedEnemyZone] || 2;
    const isPigEquipped = state.equippedPet === 'pig';
    const finalCoinReward = isPigEquipped ? reward * 2 : reward;

    let finalPlayerHP = state.playerHP;
    if (state.equippedPet === 'dog') {
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

  createProfile: (name, pin) => {
    const finalName = uniqueName(name.trim() || "Player");
    set({ playerName: finalName, pin: pin.trim() });
  },

  hasSave: () => readSave() !== null,

  getSavedName: () => readSave()?.name ?? null,

  continueGame: (name, pin) => {
    const saved = readSave();
    if (!saved) return false;
    if (saved.name.toLowerCase() !== name.trim().toLowerCase()) return false;
    if (saved.pin !== pin.trim()) return false;
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
    });
    return true;
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
    };
    writeSave(data);
  },

  saveCheckpoint: (tx, ty) => {
    const s = get();
    if (!s.playerName) return;
    set({ playerPos: { tx, ty } });
    get().saveProgress();
  },

  clearSave: () => {
    eraseSave();
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
  },

  getLeaderboard: () => readLeaderboard(),

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
    const { coins } = get();
    if (coins < 5) return null;

    const newCoins = coins - 5;
    const pets = ["dog", "cat", "pig"];
    const pulledPet = pets[Math.floor(Math.random() * pets.length)];
    const newPets = [...(get().petsOwned || []), pulledPet];

    set({
      coins: newCoins,
      petsOwned: newPets,
    });

    get().saveProgress();
    return pulledPet;
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
    if (state.coins < price) return false;
    if (state.itemsOwned.includes(item)) return false;

    // Check unlocks
    if (item === "sword" && !state.unlockedZones.includes(2)) return false;
    if (item === "shoes" && !state.unlockedZones.includes(4)) return false;

    set({
      coins: state.coins - price,
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
    if (state.coins < cost) return false;

    const nextLevel = currentLevel + 1;
    const newCoins = state.coins - cost;

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
}));
