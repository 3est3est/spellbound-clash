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
  enterBattleTransition: (enemyId: string) => void;
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
    });
  },

  enterBattleTransition: (enemyId) => {
    const { enemies } = get();
    const enemy = enemies.find((e) => e.id === enemyId);
    if (enemy && !enemy.defeated) {
      set({
        gameState: "BATTLE_TRANSITION",
        currentEnemy: enemy,
      });
    }
  },

  enterBattle: () => {
    const { difficulty, usedQuestionIds } = get();
    const config = DIFFICULTY_CONFIGS[difficulty];
    const questions = getRandomQuestions(config.questionCount, config.vocabLevel, usedQuestionIds);

    if (questions.length > 0) {
      set({
        gameState: "BATTLE",
        enemyHP: config.enemyHP,
        maxEnemyHP: config.enemyHP,
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
      const newEnemyHP = state.enemyHP - 1;
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

    const updatedEnemies = state.enemies.map((e) => (e.id === state.currentEnemy!.id ? { ...e, defeated: true } : e));
    const newDefeated = state.enemiesDefeated + 1;
    const reward = state.difficulty === "HARDCORE" ? 5 : state.difficulty === "MEDIUM" ? 3 : 2;

    const defeatedEnemyZone = state.currentEnemy.zone;
    const currentZoneEnemies = updatedEnemies.filter((e) => e.zone === defeatedEnemyZone);
    const isZoneCleared = currentZoneEnemies.every((e) => e.defeated);

    const newUnlockedZones = [...state.unlockedZones];
    let banner: string | null = null;

    if (isZoneCleared) {
      if (defeatedEnemyZone === 1 && !newUnlockedZones.includes(2)) {
        newUnlockedZones.push(2);
        banner = "🔓 ปราบศัตรูโซน 1 สำเร็จ! ประตูสู่โซน 2 ปลดล็อคแล้ว!";
      } else if (defeatedEnemyZone === 2 && !newUnlockedZones.includes(3)) {
        newUnlockedZones.push(3);
        banner = "🔓 ปราบศัตรูโซน 2 สำเร็จ! ประตูสู่โซน 3 ปลดล็อคแล้ว!";
      } else if (defeatedEnemyZone === 3 && !newUnlockedZones.includes(4)) {
        newUnlockedZones.push(4);
        banner = "🔓 ปราบศัตรูโซน 3 สำเร็จ! ประตูสู่โซน 4 ปลดล็อคแล้ว!";
      }
    }

    if (newDefeated >= state.totalEnemies) {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        coins: state.coins + reward,
        currentEnemy: null,
        unlockedZones: newUnlockedZones,
        zoneBanner: "🎉 ชัยชนะครั้งใหญ่! คุณปราบศัตรูครบทั้ง 4 โซน!",
        gameState: "WIN",
      });
    } else {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        coins: state.coins + reward,
        currentEnemy: null,
        unlockedZones: newUnlockedZones,
        zoneBanner: banner,
        gameState: "EXPLORE",
        battleResult: null,
        currentQuestion: null,
      });
    }

    get().saveProgress();
    if (newDefeated >= state.totalEnemies) get().recordScore();
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
    });
  },
}));
