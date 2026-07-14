import { create } from 'zustand';
import {
  type GameState,
  type Difficulty,
  type VocabQuestion,
  type EnemyData,
  type BattleResult,
  DIFFICULTY_CONFIGS,
} from '../types/game.types';
import vocabData from '../data/vocabQuestions.json';
import { getSpacedPathPoints } from '../components/3d/mapPath';

// ===== Store Interface =====

interface GameStore {
  // Core State
  gameState: GameState;
  difficulty: Difficulty;

  // Player
  playerHP: number;
  maxPlayerHP: number;

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
}

// ===== Helper: Get random questions =====

function getRandomQuestions(
  count: number,
  vocabLevel: string,
  usedIds: number[]
): VocabQuestion[] {
  const allQuestions = vocabData as VocabQuestion[];

  // Filter by difficulty level and exclude used questions
  let available = allQuestions.filter(
    (q) => q.difficulty === vocabLevel && !usedIds.includes(q.id)
  );

  // If not enough questions at this level, include other levels
  if (available.length < count) {
    const otherQuestions = allQuestions.filter(
      (q) => q.difficulty !== vocabLevel && !usedIds.includes(q.id)
    );
    available = [...available, ...otherQuestions];
  }

  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ===== Helper: Generate Enemies =====

function generateEnemies(count: number): EnemyData[] {
  const names = ['Shadow Goblin', 'Dark Sprite', 'Forest Wraith', 'Swamp Troll', 'Nightmare Bat', 'Cave Spider', 'Toxic Slime'];
  const enemies: EnemyData[] = [];

  // Place enemies evenly spaced along the winding path. We use a shorter
  // stretch (8%–60% of the path) so the first enemies appear close to the
  // player's start point and battles start quickly.
  const pathPoints = getSpacedPathPoints(count, 0.08, 0.6);

  for (let i = 0; i < count; i++) {
    const [xPos, zPos] = pathPoints[i] ?? [0, -15 - i * 20];
    enemies.push({
      id: `enemy-${i + 1}`,
      position: [xPos, 0.5, zPos],
      defeated: false,
      name: names[i % names.length],
    });
  }

  return enemies;
}

// ===== Store =====

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial State
  gameState: 'MENU',
  difficulty: 'EASY',

  playerHP: 5,
  maxPlayerHP: 5,

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
    set({
      gameState: 'EXPLORE',
      playerHP: config.playerHP,
      maxPlayerHP: config.playerHP,
      enemyHP: config.enemyHP,
      maxEnemyHP: config.enemyHP,
      enemies: generateEnemies(config.totalEnemies),
      currentEnemy: null,
      enemiesDefeated: 0,
      totalEnemies: config.totalEnemies,
      questionIndex: 0,
      usedQuestionIds: [],
      currentQuestion: null,
      battleResult: null,
      totalCorrect: 0,
      totalWrong: 0,
      isPaused: false,
    });
  },

  enterBattleTransition: (enemyId) => {
    const { enemies } = get();
    const enemy = enemies.find((e) => e.id === enemyId);
    if (enemy && !enemy.defeated) {
      set({
        gameState: 'BATTLE_TRANSITION',
        currentEnemy: enemy,
      });
    }
  },

  enterBattle: () => {
    const { difficulty, usedQuestionIds } = get();
    const config = DIFFICULTY_CONFIGS[difficulty];
    const questions = getRandomQuestions(
      config.questionCount,
      config.vocabLevel,
      usedQuestionIds
    );

    if (questions.length > 0) {
      set({
        gameState: 'BATTLE',
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
        battleResult: 'CORRECT',
        totalCorrect: state.totalCorrect + 1,
        usedQuestionIds: state.currentQuestion
          ? [...state.usedQuestionIds, state.currentQuestion.id]
          : state.usedQuestionIds,
      });

      // Check if enemy is defeated
      if (newEnemyHP <= 0) {
        setTimeout(() => get().defeatEnemy(), 1200);
      }
    } else {
      const newPlayerHP = state.playerHP - 1;
      set({
        playerHP: newPlayerHP,
        battleResult: 'WRONG',
        totalWrong: state.totalWrong + 1,
        usedQuestionIds: state.currentQuestion
          ? [...state.usedQuestionIds, state.currentQuestion.id]
          : state.usedQuestionIds,
      });

      // Check if player is dead
      if (newPlayerHP <= 0) {
        setTimeout(() => set({ gameState: 'GAMEOVER' }), 1200);
      }
    }
  },

  timeUp: () => {
    const state = get();
    const newPlayerHP = state.playerHP - 1;
    set({
      playerHP: newPlayerHP,
      battleResult: 'TIMEOUT',
      totalWrong: state.totalWrong + 1,
      usedQuestionIds: state.currentQuestion
        ? [...state.usedQuestionIds, state.currentQuestion.id]
        : state.usedQuestionIds,
    });

    if (newPlayerHP <= 0) {
      setTimeout(() => set({ gameState: 'GAMEOVER' }), 1200);
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

    const updatedEnemies = state.enemies.map((e) =>
      e.id === state.currentEnemy!.id ? { ...e, defeated: true } : e
    );
    const newDefeated = state.enemiesDefeated + 1;

    if (newDefeated >= state.totalEnemies) {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        currentEnemy: null,
        gameState: 'WIN',
      });
    } else {
      set({
        enemies: updatedEnemies,
        enemiesDefeated: newDefeated,
        currentEnemy: null,
        gameState: 'EXPLORE',
        battleResult: null,
        currentQuestion: null,
      });
    }
  },

  clearBattleResult: () => {
    set({ battleResult: null });
  },

  resetGame: () => {
    set({
      gameState: 'MENU',
      difficulty: 'EASY',
      playerHP: 5,
      maxPlayerHP: 5,
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
    });
  },
}));
