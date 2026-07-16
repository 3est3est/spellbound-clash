import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';
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
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timedOutRef = useRef(false);

  useEffect(() => {
    setTimeLeft(config.timerSeconds);
    timedOutRef.current = false;
  }, [currentQuestion, config.timerSeconds]);

  useEffect(() => {
    if (battleResult || isPaused || timedOutRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, battleResult, isPaused]);

  useEffect(() => {
    if (timeLeft === 0 && !battleResult && !timedOutRef.current) {
      timedOutRef.current = true;
      timeUp();
    }
  }, [timeLeft, battleResult, timeUp]);

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
    timeLeft <= 3 ? 'bg-red-500' : timeLeft <= 5 ? 'bg-amber-400' : 'bg-emerald-400';
  const timerBarWidth = (timeLeft / config.timerSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden pointer-events-none">
      {/* HP bars pinned to the very top, over the live duel stage */}
      <div className="absolute top-3 left-4 right-4 flex justify-between items-start gap-3 pointer-events-none">
        <div className="rpg-panel px-3 py-2 flex flex-col gap-1 pointer-events-none">
          <span className="font-pixel text-[10px] text-[#2b3a8c] tracking-wide uppercase">
            ผู้กล้า {playerHP}/{maxPlayerHP}
          </span>
          <div className="flex gap-0.5 flex-wrap max-w-52">
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < playerHP} />
            ))}
          </div>
        </div>
        <div className="rpg-panel-red px-3 py-2 flex flex-col gap-1 items-end pointer-events-none">
          <span className="font-pixel text-[10px] text-[#ffe3d3] tracking-wide uppercase">
            {currentEnemy?.name ?? 'ศัตรู'} {enemyHP}/{maxEnemyHP}
          </span>
          <div className="flex gap-0.5 flex-wrap max-w-52 justify-end">
            {Array.from({ length: maxEnemyHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < enemyHP} />
            ))}
          </div>
        </div>
      </div>

      {/* Battle result flash */}
      {battleResult && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className={`font-pixel text-4xl sm:text-5xl px-10 py-5 uppercase tracking-widest drop-shadow-[4px_4px_0_#000] ${
              battleResult === 'CORRECT'
                ? 'text-emerald-300'
                : battleResult === 'TIMEOUT'
                ? 'text-amber-300'
                : 'text-red-400'
            }`}
          >
            {battleResult === 'CORRECT' ? 'HIT!' : battleResult === 'TIMEOUT' ? "TIME'S UP!" : 'MISS!'}
          </div>
        </div>
      )}

      {/* ===== Bottom: Quiz dialog box (slides up from bottom, kept slim) ===== */}
      <div className="pointer-events-auto w-full flex justify-center p-3 sm:p-4">
        {currentQuestion && (
          <div className="w-full max-w-2xl rpg-panel p-4 sm:p-5 flex flex-col animate-[slideUp_0.25s_ease-out]">
            <div className="flex justify-between items-center mb-2 border-b-4 border-[#3a2a5a] pb-2 gap-4">
              <span className="font-pixel text-[#2b3a8c] text-xs tracking-widest uppercase whitespace-nowrap">
                ข้อที่ {questionIndex + 1}/{config.questionCount}
              </span>
              <div className="flex items-center gap-3 w-1/2">
                <span className="font-pixel text-[#2b3a8c] text-xs tracking-widest uppercase whitespace-nowrap">
                  ⏱ {timeLeft}
                </span>
                <div className="flex-1 h-4 border-2 border-[#3a2a5a] bg-[#1a1430]">
                  <div
                    className={`h-full transition-all duration-1000 ease-linear ${timerColor}`}
                    style={{ width: `${timerBarWidth}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="text-center mb-3 mt-1">
              <h2 className="font-pixel text-[#1a1430] leading-snug mb-1 text-2xl sm:text-3xl md:text-4xl rpg-title-dark">
                {currentQuestion.word}
              </h2>
              {currentQuestion.phonetic && (
                <p className="text-[#7a5a1a] text-lg">{currentQuestion.phonetic}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              {currentQuestion.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const showResult = battleResult !== null;
                let btnClass = 'rpg-btn';

                if (showResult) {
                  if (choice.isCorrect) {
                    btnClass = 'rpg-btn bg-emerald-500 text-white border-emerald-800';
                  } else if (isSelected && !choice.isCorrect) {
                    btnClass = 'rpg-btn bg-red-600 text-white border-red-900';
                  } else {
                    btnClass = 'rpg-btn bg-[#cdbf95] text-[#7a7050] border-[#3a2a5a] opacity-70';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i, choice.isCorrect)}
                    disabled={!!battleResult}
                    className={`
                      px-4 py-3 text-base sm:text-lg font-bold uppercase tracking-widest text-left
                      ${btnClass}
                      ${!battleResult ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <span className="font-pixel mr-2 inline-block w-6">
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
