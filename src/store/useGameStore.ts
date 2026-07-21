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
import { getSpacedPathPoints } from "../game/enemyPlacement";

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

function getRandomQuestions(count: number, vocabLevel: string, usedIds: number[]): VocabQuestion[] {
  const allQuestions = vocabData as VocabQuestion[];

  // Filter by difficulty level and exclude used questions
  let available = allQuestions.filter((q) => q.difficulty === vocabLevel && !usedIds.includes(q.id));

  // If not enough questions at this level, include other levels
  if (available.length < count) {
    const otherQuestions = allQuestions.filter((q) => q.difficulty !== vocabLevel && !usedIds.includes(q.id));
    available = [...available, ...otherQuestions];
  }

  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ===== Helper: Generate Enemies =====

function generateEnemies(count: number): EnemyData[] {
  const names = ["ก็อบลินเงา", "ภูตมืด", "วิญญาณแห่งป่า", "โทรลล์บึง", "ค้างคาวฝันร้าย", "แมงมุมถ้ำ", "สไลม์พิษ"];
  const enemies: EnemyData[] = [];

  // Place enemies on walkable path tiles near the player's start so battles
  // trigger in a natural sequence.
  const pathPoints = getSpacedPathPoints(count);

  for (let i = 0; i < count; i++) {
    const [tx, ty] = pathPoints[i] ?? [10, 10];
    enemies.push({
      id: `enemy-${i + 1}`,
      // position keeps the [x,y,z] shape; here x=tx, z=ty (tile coords).
      position: [tx, 0.5, ty],
      defeated: false,
      name: names[i % names.length],
    });
  }

  return enemies;
}

// ===== Store =====

// ---- localStorage helpers (local profile, no backend) ----
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
    /* ignore quota / privacy errors */
  }
}

function eraseSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

// ---- leaderboard helpers ----
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

// Update (or insert) the player's best score in the leaderboard.
function updateLeaderboard(entry: LeaderboardEntry) {
  const list = readLeaderboard();
  const idx = list.findIndex(
    (e) => e.name.toLowerCase() === entry.name.toLowerCase() && e.difficulty === entry.difficulty
  );
  if (idx >= 0) {
    // Keep the highest score for this name+difficulty.
    if (entry.score > list[idx].score) list[idx] = entry;
  } else {
    list.push(entry);
  }
  list.sort((a, b) => b.score - a.score);
  writeLeaderboard(list);
}

// Build a unique name if the desired name already exists in the save.
function uniqueName(base: string): string {
  const existing = readSave();
  if (!existing) return base;
  if (existing.name.toLowerCase() !== base.toLowerCase()) return base;
  // Same name already taken: append a number.
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
  playerPos: { tx: 3, ty: 3 },

  enemies: [],
  currentEnemy: null,
  enemyHP: 5,
  maxEnemyHP: 5,
  enemiesDefeated: 0,
  totalEnemies: 3,

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
    // If we're continuing a saved profile, keep the accumulated progress
    // (coins/score/enemies/position) instead of wiping it.
    const saved = readSave();
    const continuing = !!saved && saved.name === get().playerName && saved.pin === get().pin;
    set({
      gameState: "EXPLORE",
      difficulty: continuing ? saved!.difficulty : difficulty,
      playerHP: continuing ? saved!.playerHP : config.playerHP,
      maxPlayerHP: continuing ? saved!.maxPlayerHP : config.playerHP,
      coins: continuing ? saved!.coins : 0,
      score: continuing ? saved!.score : 0,
      playerPos: continuing ? saved!.playerPos : { tx: 3, ty: 3 },
      enemyHP: config.enemyHP,
      maxEnemyHP: config.enemyHP,
      enemies: continuing ? saved!.enemies : generateEnemies(config.totalEnemies),
      currentEnemy: null,
      enemiesDefeated: continuing ? saved!.enemiesDefeated : 0,
      totalEnemies: continuing ? saved!.totalEnemies : config.totalEnemies,
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

      // Check if enemy is defeated
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

      // Check if player is dead
      if (newPlayerHP <= 0) {
        setTimeout(() => {
          get().recordScore(); // record before wiping the save
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
        get().recordScore(); // record before wiping the save
        get().clearSave();
        set({ gameState: "GAMEOVER" });
      }, 1200);
    }
  },

  nextQuestion: () => {
    const state = get();
    const config = DIFFICULTY_CONFIGS[state.difficulty];
    const nextIndex = state.questionIndex + 1;

    // Get next random question
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
    // Reward scales with difficulty so harder fights pay more.
    const reward = state.difficulty === "HARDCORE" ? 5 : state.difficulty === "MEDIUM" ? 3 : 2;

    if (newDefeated >= state.totalEnemies) {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        coins: state.coins + reward,
        currentEnemy: null,
        gameState: "WIN",
      });
    } else {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        coins: state.coins + reward,
        currentEnemy: null,
        gameState: "EXPLORE",
        battleResult: null,
        currentQuestion: null,
      });
    }
    // Persist progress after each win so "Continue" resumes correctly.
    // On a full victory we still save (accumulated score/coins) — the save
    // is only erased when the player actually dies (GAMEOVER).
    get().saveProgress();
    // A full clear still records the score to the leaderboard.
    if (newDefeated >= state.totalEnemies) get().recordScore();
  },

  clearBattleResult: () => {
    set({ battleResult: null });
  },

  // ===== Profile / Save =====

  createProfile: (name, pin) => {
    const finalName = uniqueName(name.trim() || "Player");
    set({ playerName: finalName, pin: pin.trim() });
    // Don't start the game yet; startGame() handles the actual launch and
    // will notice this profile has no save (fresh run).
  },

  hasSave: () => readSave() !== null,

  getSavedName: () => readSave()?.name ?? null,

  continueGame: (name, pin) => {
    const saved = readSave();
    if (!saved) return false;
    if (saved.name.toLowerCase() !== name.trim().toLowerCase()) return false;
    if (saved.pin !== pin.trim()) return false;
    // Resume: load the profile + saved progress into the store.
    set({
      playerName: saved.name,
      pin: saved.pin,
      difficulty: saved.difficulty,
    });
    // startGame() will read this save and continue from it.
    return true;
  },

  saveProgress: () => {
    const s = get();
    if (!s.playerName) return; // not logged in yet
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
    };
    writeSave(data);
  },

  // Save including the live player position (used when pausing / exiting).
  saveCheckpoint: (tx, ty) => {
    const s = get();
    if (!s.playerName) return;
    set({ playerPos: { tx, ty } });
    get().saveProgress();
  },

  clearSave: () => {
    eraseSave();
  },

  // Record the player's score into the leaderboard (best per name+difficulty).
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
    // Going back to menu keeps the save (so "Continue" still works) unless
    // the player died — death clears the save explicitly elsewhere.
    set({
      gameState: "MENU",
      difficulty: "EASY",
      playerHP: 5,
      maxPlayerHP: 5,
      coins: 0,
      score: 0,
      playerName: "",
      pin: "",
      playerPos: { tx: 3, ty: 3 },
      enemies: [],
      currentEnemy: null,
      enemyHP: 5,
      maxEnemyHP: 5,
      enemiesDefeated: 0,
      totalEnemies: 3,
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
