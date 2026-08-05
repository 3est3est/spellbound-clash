// ===== Game State Types =====

export type GameState = "MENU" | "EXPLORE" | "PAUSED" | "BATTLE_TRANSITION" | "BATTLE" | "GAMEOVER" | "WIN";

export type Difficulty = "EASY" | "MEDIUM" | "HARDCORE";

// ===== Difficulty Config =====

export interface DifficultyConfig {
  playerHP: number;
  enemyHP: number;
  questionCount: number;
  timerSeconds: number;
  vocabLevel: "basic" | "intermediate" | "advanced";
  totalEnemies: number;
  label: string;
  labelTh: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    playerHP: 5,
    enemyHP: 5,
    questionCount: 5,
    timerSeconds: 12,
    vocabLevel: 'basic',
    totalEnemies: 12,
    label: 'Easy',
    labelTh: 'ง่าย',
  },
  MEDIUM: {
    playerHP: 3,
    enemyHP: 7,
    questionCount: 7,
    timerSeconds: 8,
    vocabLevel: 'intermediate',
    totalEnemies: 12,
    label: 'Medium',
    labelTh: 'ปานกลาง',
  },
  HARDCORE: {
    playerHP: 2,
    enemyHP: 10,
    questionCount: 10,
    timerSeconds: 6,
    vocabLevel: 'advanced',
    totalEnemies: 12,
    label: 'Hard',
    labelTh: 'ยาก',
  },
};

// ===== Vocab Question =====

export interface VocabChoice {
  text: string;
  isCorrect: boolean;
}

export interface VocabQuestion {
  id: number;
  word: string;
  phonetic?: string;
  choices: VocabChoice[];
  difficulty: "basic" | "intermediate" | "advanced";
}

// ===== Enemy =====

export interface EnemyData {
  id: string;
  position: [number, number, number];
  defeated: boolean;
  name: string;
  zone: 1 | 2 | 3 | 4;
}

// ===== Battle Result =====

export type BattleResult = "CORRECT" | "WRONG" | "TIMEOUT";

// ===== Save / Profile =====

export interface SaveData {
  name: string;
  pin: string;
  difficulty: Difficulty;
  playerHP: number;
  maxPlayerHP: number;
  coins: number;
  score: number;
  enemiesDefeated: number;
  totalEnemies: number;
  enemies: EnemyData[];
  playerPos: { tx: number; ty: number };
  unlockedZones: number[];
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  difficulty: Difficulty;
  enemiesDefeated: number;
  date: string;
}
