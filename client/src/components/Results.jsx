import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';
import { supabase } from '../config/supabase';

function renderDifference(answer, expected, side) {
  const segments = buildRomajiDiff(answer, expected)[side];
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

function Results({ results = [], roomCode, kanaCards = [], username, user, room }) {
  const [showDetails, setShowDetails] = useState(true);
  const savedResult = useRef(false);
  const isKanjiDeck = kanaCards.some((card) => card?.groupId || card?.groupName);
  const selectedDeckGroups = Array.isArray(room?.selectedGroups)
    ? room.selectedGroups
    : [...new Set((kanaCards || []).map((card) => card?.groupId).filter(Boolean))];

  const resultStorageKey = user && roomCode
    ? `ganbatte-saved-result:${user.id}:${roomCode}`
    : null;

  const computeStats = (answers = []) => {
    let correct = 0;
    let matchedTokens = 0;
    let totalTokens = 0;
    const total = kanaCards.length;

    for (let i = 0; i < total; i++) {
      const submitted = answers[i];
      const score = scoreRomajiAnswer(submitted, kanaCards[i]?.romaji);
      matchedTokens += score.matched;
      totalTokens += score.total;

      if (isKanjiDeck) {
        if (score.percentage === 100) correct++;
      } else if (score.matched === score.total) {
        correct++;
      }
    }

    if (isKanjiDeck) {
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

  const getHintTotal = (player) => (
    Array.isArray(player?.hintsUsed)
      ? player.hintsUsed.reduce((total, count) => total + Number(count || 0), 0)
      : 0
  );

  const currentStats = computeStats(currentPlayer?.answers || []);
  const currentPlayerUserId = currentPlayer?.userId ?? user?.id ?? null;
  const companionPlayer = currentPlayerUserId
    ? (results.find((player) => player?.userId && player.userId !== currentPlayerUserId) ?? null)
    : null;
  const companionUserId = companionPlayer?.userId ?? null;

  // Supabase Result Sync
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
        console.error('Assessment result save blocked: player user does not match the active auth session.', {
          playerUserId,
          authenticatedUserId,
          currentPlayerName: currentPlayer.name,
        });
        return;
      }

      savedResult.current = true;

      const { error } = await supabase.from('assessment_results').insert({
        user_id: authenticatedUserId,
        assessment_type: isKanjiDeck ? 'kanji-reading' : 'kana-reading',
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
    };

    saveCurrentAssessmentResult();
  }, [currentPlayer, currentStats.correct, currentStats.percentage, currentStats.total, roomCode, user, companionUserId, resultStorageKey, isKanjiDeck, selectedDeckGroups]);

  // Determine top score for winner podium
  const maxScore = Math.max(
    ...results.map((p) => computeStats(p.answers || []).percentage)
  );

  return (
    <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // SESSION COMPLETE
          </span>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
            Assessment Results
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {roomCode && (
            <span className="border-2 border-black bg-[#252c3d] px-3 py-1 font-mono text-xs font-black uppercase text-neutral-300 shadow-[2px_2px_0px_0px_#000]">
              ROOM: {roomCode}
            </span>
          )}
          <span className="border-2 border-black bg-[#A3E636] px-3 py-1 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000]">
            COMPLETED
          </span>
        </div>
      </div>

      {/* 2. Podium Scoreboard */}
      <div className="grid gap-4 sm:grid-cols-2">
        {results.map((player, idx) => {
          const stats = computeStats(player.answers || []);
          const isWinner = results.length > 1 && stats.percentage === maxScore;

          return (
            <div
              key={idx}
              className={`relative flex flex-col justify-between border-2 border-black p-5 shadow-[6px_6px_0px_0px_#000000] ${
                isWinner ? 'bg-[#FFDE59]' : 'bg-[#1a1f2c]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`border-2 border-black px-2 py-0.5 font-mono text-[10px] font-black uppercase ${
                    isWinner ? 'bg-black text-[#FFDE59]' : 'bg-[#2c3345] text-neutral-300'
                  }`}
                >
                  {isWinner ? '★ WINNER' : results.length > 1 ? `RANK #${idx + 1}` : 'OPERATOR'}
                </span>
                <span
                  className={`font-mono text-xs font-bold ${
                    isWinner ? 'text-black/70' : 'text-neutral-400'
                  }`}
                >
                  P{idx + 1}
                </span>
              </div>

              <div className="my-4">
                <h2
                  className={`text-xl font-black uppercase truncate ${
                    isWinner ? 'text-black' : 'text-white'
                  }`}
                >
                  {player.name}
                </h2>
                <div
                  className={`mt-1 font-mono text-5xl font-black ${
                    isWinner ? 'text-black' : 'text-[#A3E636]'
                  }`}
                >
                  {stats.percentage}%
                </div>
              </div>

              <div
                className={`flex flex-wrap items-center gap-3 border-t-2 pt-3 font-mono text-xs font-black ${
                  isWinner ? 'border-black/20 text-black' : 'border-neutral-700 text-neutral-400'
                }`}
              >
                <span className="text-[#10b981]">✔ {stats.correct}/{stats.total} CORRECT</span>
                <span>·</span>
                <span className="text-[#ef4444]">✖ {stats.incorrect} WRONG</span>
                {isKanjiDeck && (
                  <>
                    <span>·</span>
                    <span className="text-[#FFDE59]">HINTS: {getHintTotal(player)}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="flex h-11 items-center gap-2 border-2 border-black bg-white px-4 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          {showDetails ? <ChevronUpIcon className="h-4 w-4 stroke-[3]" /> : <ChevronDownIcon className="h-4 w-4 stroke-[3]" />}
          <span>{showDetails ? 'Hide' : 'Show'} Breakdown</span>
        </button>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 border-2 border-black bg-[#FFDE59] px-5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#ffe57e] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Start New Session
        </button>

        <button
          type="button"
          onClick={() => {
            if (typeof window.generateCards === 'function') {
              window.generateCards(10, true);
            }
          }}
          className="h-11 border-2 border-black bg-[#A3E636] px-5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
        >
          Replay Set →
        </button>
      </div>

      {/* 4. Round-by-Round Breakdown List */}
      {showDetails && (
        <div className="space-y-4 pt-4">
          <div className="border-b-2 border-neutral-700 pb-2">
            <span className="font-mono text-xs font-black uppercase tracking-wider text-[#70CFF8]">
              // CARD EVALUATION ({kanaCards.length} ITEMS)
            </span>
          </div>

          <div className="space-y-3">
            {kanaCards.map((card, i) => (
              <div
                key={i}
                className="border-2 border-black bg-[#1a1f2c] p-4 shadow-[4px_4px_0px_0px_#000000] space-y-3"
              >
                {/* Top Row: Index, Phrase, English */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b-2 border-black/40 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="border border-black bg-white px-2 py-0.5 font-mono text-xs font-black text-black">
                      #{i + 1}
                    </span>
                    <p className="jp-font text-xl font-black text-white sm:text-2xl">
                      {card.kana}
                    </p>
                  </div>
                  {card.english && (
                    <p className="font-mono text-xs font-bold text-neutral-400">
                      EN: {card.english}
                    </p>
                  )}
                </div>

                {/* Submissions vs Target */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {/* Correct Solution */}
                  <div className="border-2 border-black bg-[#A3E636] p-3 shadow-[2px_2px_0px_0px_#000000]">
                    <span className="font-mono text-[10px] font-black uppercase text-black/70">
                      TARGET ROMAJI
                    </span>
                    <p className="mt-0.5 font-mono text-sm font-black text-black sm:text-base">
                      {card.romaji}
                    </p>
                  </div>

                  {/* Player Answers */}
                  <div className="grid gap-2">
                    {results.map((player, pi) => {
                      const playerAnswer = player.answers[i];
                      const isUnanswered = playerAnswer === undefined || playerAnswer === null;
                      return (
                        <div
                          key={pi}
                          className="flex items-center justify-between border-2 border-black bg-[#252c3d] px-3 py-1.5 shadow-[2px_2px_0px_0px_#000000]"
                        >
                          <span className="font-mono text-xs font-bold text-neutral-300">
                            {player.name}:
                          </span>
                          <span className="font-mono text-xs font-black text-white">
                            {isUnanswered ? (
                              <span className="text-neutral-500 font-mono">[NO INPUT]</span>
                            ) : (
                              renderDifference(playerAnswer || '', card.romaji, 'given')
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hints Footer for Kanji Decks */}
                {isKanjiDeck && (
                  <div className="font-mono text-[11px] font-bold text-[#FFDE59] pt-1">
                    {results
                      .map((player) => `${player.name}: ${Number(player.hintsUsed?.[i] || 0)} hint(s)`)
                      .join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

export default Results;