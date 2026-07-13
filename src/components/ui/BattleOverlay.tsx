import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';

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

  useEffect(() => {
    if (battleResult) return;

    setTimeLeft(config.timerSeconds);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, battleResult, config.timerSeconds, timeUp]);

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
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* ===== TOP HALF: Battle Scene ===== */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden border-b-4 border-white">
        
        {/* Transparent background so the 3D map shows through */}
        <div className="absolute inset-0 bg-black/30" />

        {/* Player side */}
        <div className="flex flex-col items-center gap-4 mr-24 relative z-10">
          <div className="bg-black retro-border px-4 py-2 flex gap-1">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <span key={i} className={`text-2xl ${i < playerHP ? '' : 'opacity-30 grayscale'}`}>
                {i < playerHP ? '❤️' : '🖤'}
              </span>
            ))}
          </div>

          <div
            className={`w-32 h-32 bg-blue-600 border-4 border-white flex items-center justify-center ${playerShake ? 'animate-shake bg-red-600' : ''}`}
          >
            <span className="text-5xl">🧙</span>
          </div>
          <div className="bg-black retro-border px-4 py-1">
            <p className="text-white text-lg font-bold tracking-widest uppercase">PLAYER</p>
          </div>
        </div>

        {/* VS */}
        <div className="text-5xl font-black text-white animate-blink mx-8 relative z-10">
          VS
        </div>

        {/* Enemy side */}
        <div className="flex flex-col items-center gap-4 ml-24 relative z-10">
          <div className="bg-black retro-border px-4 py-2 flex gap-1 flex-wrap justify-center max-w-48">
            {Array.from({ length: maxEnemyHP }).map((_, i) => (
              <span key={i} className={`text-2xl ${i < enemyHP ? '' : 'opacity-30 grayscale'}`}>
                {i < enemyHP ? '🖤' : '💀'}
              </span>
            ))}
          </div>

          <div
            className={`w-32 h-32 bg-red-600 border-4 border-white flex items-center justify-center ${enemyShake ? 'animate-shake bg-white' : ''}`}
          >
            <span className="text-5xl">👹</span>
          </div>
          <div className="bg-black retro-border px-4 py-1">
            <p className="text-white text-lg font-bold tracking-widest uppercase">{currentEnemy?.name ?? 'ENEMY'}</p>
          </div>
        </div>

        {/* Battle result overlay */}
        {battleResult && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/60">
            <div
              className={`text-6xl font-black px-12 py-6 uppercase tracking-widest ${
                battleResult === 'CORRECT' ? 'bg-emerald-600 text-white retro-border-emerald' : 'bg-red-600 text-white retro-border-red'
              }`}
            >
              {battleResult === 'CORRECT' ? 'HIT!' : battleResult === 'TIMEOUT' ? 'TIME UP!' : 'MISS!'}
            </div>
          </div>
        )}
      </div>

      {/* ===== BOTTOM HALF: Quiz Dialog Box ===== */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
        {currentQuestion && (
          <div className="w-full max-w-4xl bg-black retro-border p-8 flex flex-col">
            
            {/* Header info */}
            <div className="flex justify-between items-center mb-6 border-b-4 border-white pb-4">
              <span className="text-white text-xl tracking-widest uppercase">
                Q: {questionIndex + 1}/{config.questionCount}
              </span>
              <div className="flex items-center gap-4 w-1/2">
                <span className="text-white text-xl tracking-widest uppercase w-24">TIME: {timeLeft}</span>
                <div className="flex-1 h-6 border-2 border-white bg-black">
                  <div 
                    className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
                    style={{ width: `${timerBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Word display */}
            <div className="text-center mb-10 mt-4">
              <h2 className="text-6xl font-bold text-white tracking-widest mb-4">
                {currentQuestion.word}
              </h2>
              {currentQuestion.phonetic && (
                <p className="text-slate-400 text-2xl">{currentQuestion.phonetic}</p>
              )}
            </div>

            {/* Choices */}
            <div className="grid grid-cols-2 gap-6 w-full">
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
                      px-6 py-6 text-2xl font-bold uppercase tracking-widest text-left
                      transition-none
                      ${btnClass}
                      ${!battleResult ? 'cursor-pointer active:translate-y-1 active:translate-x-1' : 'cursor-default'}
                    `}
                  >
                    <span className="mr-4 inline-block w-8">
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
