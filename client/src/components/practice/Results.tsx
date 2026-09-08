import { useEffect, useRef, useState } from 'react';
import {
  areRomajiAnswersEqual,
  buildDirectRomajiDiff,
  buildRomajiDiff,
  scoreRomajiAnswer,
} from '../../utils/romaji';
import { supabase } from '../../config/supabase';
import useActivityRecorder from '../../hooks/useActivityRecorder';
import { getDeckAccent } from '../../utils/deck-theme';
import type { AssessmentResult, DiffSegment, KanaCard, KanjiCard } from '../../types';

type ResultPlayer = Partial<AssessmentResult>;
type ResultCard = Partial<KanaCard & KanjiCard> & {
  questionType?: 'multiple-choice' | 'type-in';
  promptKind?: 'kanji' | 'english';
  prompt?: string;
  options?: string[];
  correctAnswer?: string;
  answerType?: 'romaji' | 'text';
};

type ResultsProps = {
  results?: ResultPlayer[];
  roomCode?: string | null;
  kanaCards?: ResultCard[];
  username?: string;
  user?: { id?: string } | null;
  room?: { selectedGroups?: string[]; deckType?: string; winnerUserId?: string | null } | null;
  isHost?: boolean;
  onReplaySet?: () => void;
  onStartNewSession?: () => void;
  onRequestHost?: (action: string) => void;
};

type ResultStats = {
  correct: number;
  incorrect: number;
  total: number;
  matchedTokens: number;
  totalTokens: number;
  percentage: number;
};

function renderDifference(answer: string, expected: string, side: 'given' | 'expected', isKanjiDeck: boolean) {
  const segments = (isKanjiDeck
    ? buildDirectRomajiDiff(answer, expected)
    : buildRomajiDiff(answer, expected))[side];
  const tokenClass = side === 'given' ? 'text-[#FF6B6B] font-black' : 'text-[#A3E636] font-black';

  return segments.map((segment, index) => (
    <span
      key={`${segment.type}-${index}`}
      className={segment.type === 'diff' ? tokenClass : undefined}
    >
      {segment.text}
    </span>
  ));
}

export default function Results({
  results = [],
  roomCode,
  kanaCards = [],
  username,
  user,
  room,
  isHost,
  onReplaySet,
  onStartNewSession,
  onRequestHost,
}: ResultsProps) {
  const [requestedAction, setRequestedAction] = useState<string | null>(null);
  const savedResult = useRef(false);
  const { recordActivity } = useActivityRecorder();

  useEffect(() => {
    if (!results || results.length === 0 || !kanaCards || kanaCards.length === 0) {
      onStartNewSession?.();
    }
  }, [results, kanaCards, onStartNewSession]);

  if (!results || results.length === 0 || !kanaCards || kanaCards.length === 0) {
    return null;
  }

  const isKanjiDeck = room?.deckType === 'kanji' || kanaCards.some((card) => card?.groupId || card?.groupName);
  const isVocabDeck = room?.deckType === 'vocab';
  const isGrammarDeck = room?.deckType === 'grammar';
  const themeAccent = getDeckAccent(isKanjiDeck ? 'kanji' : isVocabDeck ? 'vocab' : isGrammarDeck ? 'grammar' : 'kana');

  const selectedDeckGroups = Array.isArray(room?.selectedGroups)
    ? room.selectedGroups
    : [...new Set((kanaCards || []).map((card) => card?.groupId).filter(Boolean))];

  const resultStorageKey = user && roomCode
    ? `ganbatte-saved-result:${user.id}:${roomCode}`
    : null;

  const computeStats = (answers: unknown[] = []): ResultStats => {
    let correct = 0;
    let matchedTokens = 0;
    let totalTokens = 0;
    const total = kanaCards.length;

    for (let i = 0; i < total; i++) {
      const submitted = answers[i];
      const card = kanaCards[i];
      const isExactText = isVocabDeck && card?.answerType === 'text';
      const isCorrect = isExactText
        ? String(submitted || '').trim().toLowerCase() === String(card?.correctAnswer || '').trim().toLowerCase()
        : isKanjiDeck || isVocabDeck
          ? areRomajiAnswersEqual(submitted, card?.romaji)
          : scoreRomajiAnswer(submitted, card?.romaji).percentage === 100;
      const score = isExactText ? { matched: isCorrect ? 1 : 0, total: 1 } : scoreRomajiAnswer(submitted, card?.romaji);
      matchedTokens += score.matched;
      totalTokens += score.total;

      if (isCorrect) correct++;
    }

    if (isKanjiDeck || isVocabDeck) {
      return {
        correct,
        incorrect: total - correct,
        total,
        matchedTokens: correct,
        totalTokens: total,
        percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
      };
    }

    return {
      correct,
      incorrect: total - correct,
      total,
      matchedTokens,
      totalTokens,
      percentage: totalTokens === 0 ? 0 : Math.round((matchedTokens / totalTokens) * 100),
    };
  };

  const currentPlayer = results.find((player) => player.userId === user?.id)
    || results.find((player) => player.name === username)
    || results[0];

  const getHintTotal = (player: ResultPlayer) => (
    Array.isArray(player?.hintsUsed)
      ? player.hintsUsed.reduce((total, count) => total + Number(count || 0), 0)
      : 0
  );

  const handleReplaySelection = () => {
    if (isHost) {
      onReplaySet?.();
      return;
    }

    setRequestedAction('replay');
    onRequestHost?.('replay');
  };

  const currentStats = computeStats(currentPlayer?.answers || []);
  const currentPlayerUserId = currentPlayer?.userId ?? user?.id ?? null;
  const companionPlayer = currentPlayerUserId
    ? (results.find((player) => player?.userId && player.userId !== currentPlayerUserId) ?? null)
    : null;
  const companionUserId = companionPlayer?.userId ?? null;

  useEffect(() => {
    const saveCurrentAssessmentResult = async () => {
      if (savedResult.current || !supabase || !roomCode || !currentPlayer || !resultStorageKey) return;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        console.error('Supabase session unavailable while saving assessment result:', sessionError || 'No active session');
        return;
      }

      const authenticatedUserId = session.user.id;
      const storageKey = `ganbatte-saved-result:${authenticatedUserId}:${roomCode}`;
      if (sessionStorage.getItem(storageKey) === 'true') {
        savedResult.current = true;
        return;
      }

      const playerUserId = currentPlayer.userId ?? user?.id ?? authenticatedUserId;
      if (playerUserId !== authenticatedUserId) {
        return;
      }

      savedResult.current = true;

      const { error } = await supabase.from('assessment_results').insert({
        user_id: authenticatedUserId,
        assessment_type: isKanjiDeck ? 'kanji-reading' : isVocabDeck ? 'vocab' : isGrammarDeck ? 'grammar' : 'kana-reading',
        score_percentage: currentStats.percentage,
        correct_questions: currentStats.correct,
        total_questions: currentStats.total,
        companion_user_id: companionUserId,
        details: {
          answers: currentPlayer.answers || [],
          ...(isKanjiDeck ? { groups: selectedDeckGroups, hints_used: currentPlayer.hintsUsed || [] } : {}),
        },
      });

      if (error) {
        console.error('Unable to save assessment result:', error);
        sessionStorage.removeItem(storageKey);
        savedResult.current = false;
        return;
      }

      sessionStorage.setItem(storageKey, 'true');

      if (companionUserId) {
        void recordActivity();
      }
    };

    saveCurrentAssessmentResult();
  }, [currentPlayer, currentStats.correct, currentStats.percentage, currentStats.total, roomCode, user, companionUserId, resultStorageKey, isKanjiDeck, isVocabDeck, isGrammarDeck, selectedDeckGroups, recordActivity]);

  const maxScore = Math.max(
    ...results.map((p) => computeStats(p.answers || []).percentage)
  );

  return (
    <main className="container mx-auto max-w-4xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span
            className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider"
            style={{ color: themeAccent }}
          >
            // SESSION COMPLETE
          </span>
          <h1 className="text-lg sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
            Assessment Results
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
          {roomCode && (
            <span className="border-2 border-black bg-[#151922] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-neutral-300 shadow-[1.5px_1.5px_0px_0px_#000]">
              ROOM: {roomCode}
            </span>
          )}
          <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000]">
            COMPLETED
          </span>
        </div>
      </div>

      {/* 2. Podium Scoreboard */}
      <div className="grid gap-2.5 sm:gap-4 sm:grid-cols-2">
          {results.map((player, idx) => {
          const stats = computeStats(player.answers || []);
            const isWinner = results.length > 1 && (room?.winnerUserId
              ? player.userId === room.winnerUserId
              : stats.percentage === maxScore);

          return (
            <div
              key={idx}
              className={`relative flex flex-col justify-between border-2 border-black p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] ${isWinner ? 'border-l-8 bg-[#1f2637] text-white' : 'bg-[#151922] text-white'
                }`}
              style={isWinner ? { borderLeftColor: themeAccent } : undefined}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`border-2 border-black px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase shadow-[1px_1px_0px_0px_#000] ${isWinner ? 'bg-white text-black' : 'bg-black text-neutral-400'
                    }`}
                  style={isWinner ? { backgroundColor: themeAccent, color: '#000000' } : undefined}
                >
                  {isWinner ? '★ WINNER' : results.length > 1 ? `RANK #${idx + 1}` : 'OPERATOR'}
                </span>
                <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                  P{idx + 1}
                </span>
              </div>

              <div className="my-2 sm:my-4">
                <h2 className="text-base sm:text-xl font-black uppercase truncate text-white">
                  {player.name}
                </h2>
                <div
                  className="mt-0.5 sm:mt-1 font-mono text-3xl sm:text-5xl font-black leading-none"
                  style={{ color: isWinner ? themeAccent : '#A3E636' }}
                >
                  {stats.percentage}%
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-t-2 border-white/10 pt-2 sm:pt-3 font-mono text-[10px] sm:text-xs font-black">
                <span className="text-[#A3E636]">✔ {stats.correct}/{stats.total} CORRECT</span>
                <span className="text-neutral-500">·</span>
                <span className="text-[#FF6B6B]">✖ {stats.incorrect} WRONG</span>
                {isKanjiDeck && (
                  <>
                    <span className="text-neutral-500">·</span>
                    <span className="text-[#70CFF8]">HINTS: {getHintTotal(player)}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
        {requestedAction ? (
          <div className="flex items-center gap-2 border-2 border-black bg-[#151922] px-3 py-2 sm:px-5 sm:py-3 shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping bg-[#A3E636] opacity-75" />
              <span className="relative inline-flex h-2 w-2 bg-[#A3E636]" />
            </span>
            <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-white">
              Waiting for Host to <span style={{ color: themeAccent }}>Start New Assessment</span>
              <span className="animate-pulse">...</span>
            </span>
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:gap-3">
            <button
              type="button"
              onClick={onStartNewSession}
              className="h-9 sm:h-11 cursor-pointer border-2 border-black bg-white px-3 sm:px-5 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-neutral-100 hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              New Session
            </button>
            <button
              type="button"
              onClick={handleReplaySelection}
              style={{ backgroundColor: themeAccent }}
              className="h-9 sm:h-11 cursor-pointer border-2 border-black px-3 sm:px-5 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Replay Set →
            </button>
          </div>
        )}
      </div>

      {/* 4. Round-by-Round Breakdown List */}
      <div className="space-y-2.5 sm:space-y-4 pt-2 sm:pt-4">
        <div className="border-b-2 border-white/10 pb-1.5 sm:pb-2">
          <span
            className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider"
            style={{ color: themeAccent }}
          >
            // CARD EVALUATION ({kanaCards.length} ITEMS)
          </span>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {kanaCards.map((card, i) => (
            <div
              key={i}
              className="border-2 border-black bg-[#1f2637] p-3 sm:p-4 shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] space-y-2.5 sm:space-y-3"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b-2 border-white/10 pb-2">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="border border-black bg-white px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[10px] sm:text-xs font-black text-black">
                    #{i + 1}
                  </span>
                  <p className="jp-font text-base sm:text-2xl font-black text-white">
                    {card.kana}
                  </p>
                </div>
                {card.english && (
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                    EN: {card.english}
                  </p>
                )}
              </div>

              <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
                <div className="border-2 border-black bg-white p-2 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000]">
                  <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase text-neutral-600">
                    {isVocabDeck && card.answerType === 'text' ? 'TARGET ANSWER' : 'TARGET ROMAJI'}
                  </span>
                  <p className="mt-0.5 font-mono text-xs sm:text-base font-black text-black">
                    {isVocabDeck && card.answerType === 'text' ? card.correctAnswer : card.romaji}
                  </p>
                </div>

                <div className="grid gap-1.5 sm:gap-2">
                  {results.map((player, pi) => {
                    const playerAnswer = player.answers?.[i];
                    const isUnanswered = playerAnswer === undefined || playerAnswer === null;
                    return (
                      <div
                        key={pi}
                        className="flex items-center justify-between border-2 border-black bg-[#151922] px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-[1.5px_1.5px_0px_0px_#000]"
                      >
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-neutral-300">
                          {player.name}:
                        </span>
                        <span className="font-mono text-[10px] sm:text-xs font-black text-white">
                          {isUnanswered ? (
                            <span className="text-neutral-500 font-mono">[NO INPUT]</span>
                          ) : (
                            isVocabDeck && card.answerType === 'text'
                              ? String(playerAnswer || '')
                              : renderDifference(String(playerAnswer || ''), card.romaji || '', 'given', isKanjiDeck)
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isKanjiDeck && (() => {
                const playersWithHints = results.filter(
                  (player) => Number(player.hintsUsed?.[i] || 0) > 0
                );

                if (playersWithHints.length === 0) return null;

                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-white/10">
                    <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      // Hints used:
                    </span>
                    {playersWithHints.map((player, pi) => (
                      <span
                        key={pi}
                        className="inline-flex items-center gap-1 border-2 border-black bg-[#70CFF8] px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000]"
                      >
                        {player.name}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}