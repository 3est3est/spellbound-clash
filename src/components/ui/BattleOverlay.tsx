import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DIFFICULTY_CONFIGS } from '../../types/game.types';
import PixelHeart from './PixelHeart';

export default function BattleOverlay() {
  const {
    playerHP, maxPlayerHP,
    enemyHP, maxEnemyHP,
    currentEnemy, currentQuestion,
    questionIndex, difficulty,
    isPaused, battleResult,
    answerQuestion, timeUp, nextQuestion, clearBattleResult,
  } = useGameStore();

  const config = DIFFICULTY_CONFIGS[difficulty];
  const diffLabel = { EASY: 'ง่าย', MEDIUM: 'กลาง', HARDCORE: 'ยาก' }[difficulty];

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
    const t = setTimeout(() => {
      clearBattleResult();
      setSelectedChoice(null);
      nextQuestion();
    }, 1500);
    return () => clearTimeout(t);
  }, [battleResult, playerHP, enemyHP, clearBattleResult, nextQuestion]);

  const handleAnswer = useCallback(
    (i: number, isCorrect: boolean) => {
      if (battleResult) return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelectedChoice(i);
      answerQuestion(isCorrect);
    },
    [battleResult, answerQuestion]
  );

  const timerPct = (timeLeft / config.timerSeconds) * 100;
  const timerClass =
    timeLeft <= 3 ? 'rpg-bar-fill-timer-danger' :
    timeLeft <= 5 ? 'rpg-bar-fill-timer-warn' :
    'rpg-bar-fill-timer';

  const labels = ['ก', 'ข', 'ค', 'ง'];
  
  // Use simple text shadows to make text readable without a panel background for HP
  const textShadowStyle = { textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end overflow-hidden pointer-events-none">

      {/* ── เลือดด้านบนซ้าย / ขวา (ไม่มีกรอบสี่เหลี่ยม) ── */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">

        {/* ผู้กล้า */}
        <div className="flex flex-col gap-1 animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="font-pixel font-bold text-sm" style={{ color: '#ffffff', ...textShadowStyle }}>ผู้กล้า</span>
          </div>
          <div className="flex gap-1 flex-wrap" style={{ maxWidth: '160px' }}>
            {Array.from({ length: maxPlayerHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < playerHP} />
            ))}
          </div>
        </div>

        {/* ศัตรู */}
        <div className="flex flex-col gap-1 items-end animate-slide-down">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-xs" style={{ color: '#aaaaaa', ...textShadowStyle }}>{diffLabel}</span>
            <span className="font-pixel font-bold text-sm" style={{ color: '#ffaaaa', ...textShadowStyle }}>
              {currentEnemy?.name ?? 'ศัตรู'}
            </span>
          </div>
          <div className="flex gap-1 flex-wrap justify-end" style={{ maxWidth: '160px' }}>
            {Array.from({ length: maxEnemyHP }).map((_, i) => (
              <PixelHeart key={i} filled={i < enemyHP} color="#ff6050" />
            ))}
          </div>
        </div>
      </div>

      {/* ── ผลการตอบ ── */}
      {battleResult && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className="font-pixel font-black animate-pop-in px-10 py-5 bg-white/90 border-4 border-[#a31c5d] rounded shadow-[8px_8px_0_rgba(0,0,0,0.2)]"
            style={{
              fontSize: 'clamp(28px, 6vw, 48px)',
              color: battleResult === 'CORRECT' ? '#22aa22'
                   : battleResult === 'TIMEOUT' ? '#f8a820'
                   : '#cc2222',
            }}
          >
            {battleResult === 'CORRECT' ? '✓ ถูกต้อง!' : battleResult === 'TIMEOUT' ? '⏰ หมดเวลา!' : '✗ พลาด!'}
          </div>
        </div>
      )}

      {/* ── กล่องคำถาม ── */}
      <div className="pointer-events-auto w-full flex justify-center p-2 sm:p-4 mb-2">
        {currentQuestion && (
          <div className="w-full max-w-2xl rpg-panel animate-slide-up">

            {/* หัว: ข้อที่ + เวลา */}
            <div className="flex justify-between items-center mb-3 gap-4">
              <span className="font-pixel text-sm font-semibold" style={{ color: '#a31c5d' }}>
                ข้อ {questionIndex + 1}/{config.questionCount}
              </span>
              <div className="flex items-center gap-2 flex-1 max-w-xs">
                <span
                  className={`font-pixel font-bold text-base w-6 text-right ${timeLeft <= 3 ? 'animate-blink' : ''}`}
                  style={{ color: timeLeft <= 3 ? '#cc2222' : '#a31c5d' }}
                >
                  {timeLeft}
                </span>
                <div className="rpg-bar-track h-4 flex-1">
                  <div
                    className={`${timerClass} h-full`}
                    style={{ width: `${timerPct}%`, transition: 'width 1s linear' }}
                  />
                </div>
              </div>
            </div>

            <div className="rpg-divider mb-4" />

            {/* คำศัพท์ */}
            <div className="text-center mb-6">
              <h2
                className="font-pixel font-black leading-tight rpg-title"
                style={{
                  fontSize: 'clamp(28px, 6vw, 42px)',
                  letterSpacing: '0.04em',
                }}
              >
                {currentQuestion.word}
              </h2>
            </div>

            {/* ตัวเลือก */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {currentQuestion.choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                const showResult = battleResult !== null;

                let extraClass = '';
                if (showResult) {
                  if (choice.isCorrect) extraClass = 'correct';
                  else if (isSelected && !choice.isCorrect) extraClass = 'wrong';
                  else extraClass = 'dimmed';
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i, choice.isCorrect)}
                    disabled={!!battleResult}
                    className={`rpg-choice-btn flex items-center gap-3 ${extraClass} ${!battleResult ? 'hover:-translate-y-1' : 'cursor-default'}`}
                  >
                    <span
                      className="font-pixel font-bold shrink-0 w-6 text-center text-sm"
                      style={{
                        color: extraClass === 'correct' ? '#006600'
                             : extraClass === 'wrong' ? '#660000'
                             : '#a31c5d',
                      }}
                    >
                      {labels[i]}
                    </span>
                    <span className="font-sans font-semibold text-lg" style={{ color: extraClass === 'dimmed' ? '#888888' : '#a31c5d' }}>
                      {choice.text}
                    </span>
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
