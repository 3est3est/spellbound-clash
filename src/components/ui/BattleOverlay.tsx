import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';
import BattlePlayer from '../3d/BattlePlayer';
import BattleEnemy from '../3d/BattleEnemy';
import PixelHeart from './PixelHeart';

export default function BattleOverlay() {
  const {
    playerHP,
    maxPlayerHP,
    enemyHP,
    maxEnemyHP,
    currentEnemy,
    currentQuestion,
    questionIndex,
    difficulty,
    isPaused,
    battleResult,
    answerQuestion,
    timeUp,
    nextQuestion,
    clearBattleResult,
  } = useGameStore();

  const config = DIFFICULTY_CONFIGS[difficulty];
  const [timeLeft, setTimeLeft] = useState(config.timerSeconds);
  const [playerShake, setPlayerShake] = useState(false);
  const [enemyShake, setEnemyShake] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedOutRef = useRef(false);

  // Reset the countdown (and the one-shot timeout guard) for each new question.
  useEffect(() => {
    setTimeLeft(config.timerSeconds);
    timedOutRef.current = false;
  }, [currentQuestion, config.timerSeconds]);

  // Tick the countdown only while actively battling and not paused.
  useEffect(() => {
    if (battleResult || isPaused || timedOutRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, battleResult, isPaused]);

  // Fire the timeout exactly once when the countdown reaches zero.
  useEffect(() => {
    if (timeLeft === 0 && !battleResult && !timedOutRef.current) {
      timedOutRef.current = true;
      timeUp();
    }
  }, [timeLeft, battleResult, timeUp]);

  useEffect(() => {
    if (battleResult === 'CORRECT') {
      setEnemyShake(true);
      setTimeout(() => setEnemyShake(false), 500);
    } else if (battleResult === 'WRONG' || battleResult === 'TIMEOUT') {
      setPlayerShake(true);
      setTimeout(() => setPlayerShake(false), 500);
    }
  }, [battleResult]);

  useEffect(() => {
    if (!battleResult) return;
    if (playerHP <= 0 || enemyHP <= 0) return;

    const timeout = setTimeout(() => {
      clearBattleResult();
      setSelectedChoice(null);
      nextQuestion();
    }, 1500);

    return () => clearTimeout(timeout);
  }, [battleResult, playerHP, enemyHP, clearBattleResult, nextQuestion]);

  const handleAnswer = useCallback(
    (choiceIndex: number, isCorrect: boolean) => {
      if (battleResult) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelectedChoice(choiceIndex);
      answerQuestion(isCorrect);
    },
    [battleResult, answerQuestion]
  );

  const timerColor =
    timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 5 ? 'bg-amber-500' : 'bg-emerald-500';
  const timerBarWidth = (timeLeft / config.timerSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* ===== TOP HALF: Battle Scene =====
          Locked to a fixed share (basis-[42%] + shrink-0) so it can never be
          squeezed off the top of the screen by the taller quiz panel below. */}
      <div className="relative flex-shrink-0 basis-[42%] flex items-center justify-center overflow-hidden border-b-4 border-white">
        {/* Transparent background so the 3D map shows through */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Player side - 3D Canvas */}
        <div className="flex flex-col items-center gap-2 mr-12 relative z-10">
          <div className="bg-black retro-border px-3 py-1.5 flex gap-1 flex-wrap justify-center max-w-44">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < playerHP} />
            ))}
          </div>

          <div
            className={`w-40 h-40 bg-black border-4 border-white flex items-center justify-center ${
              battleResult === 'CORRECT' ? 'animate-lunge-right'
              : playerShake ? 'animate-shake bg-red-600'
              : ''
            }`}
          >
            <Canvas
              dpr={1}
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              camera={{ position: [0, 5, 8], zoom: 10, fov: undefined }}
            >
              <OrthographicCamera makeDefault position={[0, 5, 8]} zoom={10} />
              <ambientLight intensity={1.5} />
              <BattlePlayer shake={playerShake} />
            </Canvas>
          </div>
          <div className="bg-black retro-border px-4 py-1">
            <p className="font-pixel text-white text-xs tracking-widest uppercase">PLAYER</p>
          </div>
        </div>

        {/* VS */}
        <div className="font-pixel text-3xl text-white animate-blink mx-4 relative z-10" style={{ textShadow: '3px 3px 0 #000' }}>
          VS
        </div>

        {/* Enemy side - 3D Canvas */}
        <div className="flex flex-col items-center gap-2 ml-12 relative z-10">
          <div className="bg-black retro-border px-3 py-1.5 flex gap-1 flex-wrap justify-center max-w-44">
            {Array.from({ length: maxEnemyHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < enemyHP} />
            ))}
          </div>

          <div
            className={`w-40 h-40 bg-black border-4 border-white flex items-center justify-center ${enemyShake ? 'animate-shake bg-white' : ''}`}
          >
            <Canvas
              dpr={1}
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              camera={{ position: [0, 5, 8], zoom: 10, fov: undefined }}
            >
              <OrthographicCamera makeDefault position={[0, 5, 8]} zoom={10} />
              <ambientLight intensity={1.5} />
              <BattleEnemy shake={enemyShake} />
            </Canvas>
          </div>
          <div className="bg-black retro-border px-4 py-1">
            <p className="font-pixel text-white text-xs tracking-widest uppercase">{currentEnemy?.name ?? 'ENEMY'}</p>
          </div>
        </div>

        {/* Battle result overlay */}
        {battleResult && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
            <div
              className={`font-pixel text-3xl sm:text-4xl px-10 py-5 uppercase tracking-widest ${
                battleResult === 'CORRECT' ? 'bg-emerald-600 text-white retro-border-emerald' : 'bg-red-600 text-white retro-border-red'
              }`}
            >
              {battleResult === 'CORRECT' ? 'HIT!' : battleResult === 'TIMEOUT' ? 'TIME UP!' : 'MISS!'}
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM HALF: Quiz Dialog Box =====
          flex-1 + min-h-0 lets this panel scroll internally if it is ever
          taller than its share, so it can never push the battle scene off-screen. */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center p-6 bg-black">
        {currentQuestion && (
          <div className="w-full max-w-3xl bg-black retro-border p-6 flex flex-col">
            {/* Header info */}
            <div className="flex justify-between items-center mb-4 border-b-4 border-white pb-3 gap-4">
              <span className="font-pixel text-white text-xs tracking-widest uppercase whitespace-nowrap">
                Q: {questionIndex + 1}/{config.questionCount}
              </span>
              <div className="flex items-center gap-3 w-1/2">
                <span className="font-pixel text-white text-xs tracking-widest uppercase whitespace-nowrap">TIME: {timeLeft}</span>
                <div className="flex-1 h-5 border-2 border-white bg-black">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
                    style={{ width: `${timerBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Word display */}
            <div className="text-center mb-6 mt-2">
              <h2 className="font-pixel text-white leading-tight tracking-widest mb-3 text-2xl sm:text-3xl md:text-4xl">
                {currentQuestion.word}
              </h2>
              {currentQuestion.phonetic && (
                <p className="text-slate-400 text-lg">{currentQuestion.phonetic}</p>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-4 w-full">
              {currentQuestion.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const showResult = battleResult !== null;
                let btnClass = 'bg-black border-4 border-white hover:bg-white hover:text-black text-white';

                if (showResult) {
                  if (choice.isCorrect) {
                    btnClass = 'bg-emerald-600 border-4 border-emerald-400 text-white';
                  } else if (isSelected && !choice.isCorrect) {
                    btnClass = 'bg-red-600 border-4 border-red-400 text-white';
                  } else {
                    btnClass = 'bg-black border-4 border-slate-700 text-slate-500';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i, choice.isCorrect)}
                    disabled={!!battleResult}
                    className={`
                      px-5 py-4 text-lg sm:text-xl font-bold uppercase tracking-widest text-left
                      transition-none
                      ${btnClass}
                      ${!battleResult ? 'cursor-pointer active:translate-y-1 active:translate-x-1' : 'cursor-default'}
                    `}
                  >
                    <span className="font-pixel mr-3 inline-block w-6">
                      {['A', 'B', 'C', 'D'][i]}.
                    </span>
                    {choice.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}