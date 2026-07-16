// ===== Game State Types =====

export type GameState = 'MENU' | 'EXPLORE' | 'PAUSED' | 'BATTLE_TRANSITION' | 'BATTLE' | 'GAMEOVER' | 'WIN';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// ===== Difficulty Config =====

export interface DifficultyConfig {
  playerHP: number;
  enemyHP: number;
  questionCount: number;
  timerSeconds: number;
  vocabLevel: 'basic' | 'intermediate' | 'advanced';
  totalEnemies: number;
  label: string;
  labelTh: string;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  EASY: {
    playerHP: 5,
    enemyHP: 5,
    questionCount: 5,
    timerSeconds: 10,
    vocabLevel: 'basic',
    totalEnemies: 3,
    label: 'Easy',
    labelTh: 'ง่าย',
  },
  MEDIUM: {
    playerHP: 3,
    enemyHP: 7,
    questionCount: 7,
    timerSeconds: 7,
    vocabLevel: 'intermediate',
    totalEnemies: 3,
    label: 'Medium',
    labelTh: 'ปานกลาง',
  },
  HARD: {
    playerHP: 1,
    enemyHP: 10,
    questionCount: 10,
    timerSeconds: 5,
    vocabLevel: 'advanced',
    totalEnemies: 3,
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
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

// ===== Enemy =====

export interface EnemyData {
  id: string;
  position: [number, number, number];
  defeated: boolean;
  name: string;
}

// ===== Battle Result =====

export type BattleResult = 'CORRECT' | 'WRONG' | 'TIMEOUT';
