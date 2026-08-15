import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@radix-ui/react-icons';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';
import { supabase } from '../config/supabase';

function renderDifference(answer, expected, side) {
  const segments = buildRomajiDiff(answer, expected)[side];
  const tokenClass = side === 'given' ? 'text-destructive' : 'text-green-400';

  return segments.map((segment, index) => (
    <span
      key={`${segment.type}-${index}`}
      className={segment.type === 'diff' ? tokenClass : undefined}
    >
      {segment.text}
    </span>
  ));
}

function renderCorrectAnswer(answer) {
  return <span className="text-green-400">{answer}</span>;
}

function Results({ results, roomCode, kanaCards, username, user }) {
  const [showDetails, setShowDetails] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const savedResult = useRef(false);

  const resultStorageKey = user && roomCode
    ? `ganbatte-saved-result:${user.id}:${roomCode}`
    : null;

  const computeStats = (answers) => {
    let correct = 0;
    let matchedTokens = 0;
    let totalTokens = 0;
    const total = kanaCards.length;
    for (let i = 0; i < total; i++) {
      const submitted = answers[i];
      const score = scoreRomajiAnswer(submitted, kanaCards[i]?.romaji);
      matchedTokens += score.matched;
      totalTokens += score.total;
      if (score.matched === score.total) correct++;
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
  const currentStats = computeStats(currentPlayer?.answers || []);
  const currentPlayerUserId = currentPlayer?.userId ?? user?.id ?? null;
  const companionPlayer = currentPlayerUserId
    ? (results.find((player) => player?.userId && player.userId !== currentPlayerUserId) ?? null)
    : null;
  const companionUserId = companionPlayer?.userId ?? null;
  const companionName = companionPlayer?.name ?? null;

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
        assessment_type: 'kana-reading',
        score_percentage: currentStats.percentage,
        correct_questions: currentStats.correct,
        total_questions: currentStats.total,
        companion_user_id: companionUserId,
        companion_name: companionName,
        details: { answers: currentPlayer.answers || [] },
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
  }, [currentPlayer, currentStats.correct, currentStats.percentage, currentStats.total, roomCode, user, companionUserId, resultStorageKey]);

  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-4xl border-border">
        <CardHeader>
          <div className="text-center">
            <CardTitle className="text-3xl font-bold">
              Assessment Complete! 🎉
            </CardTitle>
            <CardDescription className="mt-2">
              Great job! You've completed the Kana assessment.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Leaderboard */}
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Summary
            </h3>
            <div className="space-y-3">
              {results.map((player, idx) => {
                const stats = computeStats(player.answers || []);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{player.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Score: {stats.percentage}% • Correct: {stats.correct}/{stats.total}
                      </p>
                    </div>
                    <Badge
                      variant={stats.percentage >= 80 ? 'success' : stats.percentage >= 50 ? 'warning' : 'destructive'}
                      className="text-sm font-bold"
                    >
                      {stats.percentage}%
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
              {showDetails ? 'Hide' : 'Show'} Submitted Answers
            </Button>
            <Button onClick={() => window.location.reload()}>
              Start New Session
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (typeof window.generateCards === 'function') {
                  window.generateCards(10, true);
                }
              }}
            >
              Generate New Set & Replay
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Your room code was: <strong className="text-foreground">{roomCode}</strong>
          </p>

          {/* Detailed Answers */}
          {showDetails && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Submitted Answers
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Kana</TableHead>
                    <TableHead className="font-mono">Correct Answer</TableHead>
                    {results.map((player, pi) => (
                      <TableHead key={pi} className="font-mono">
                        {player.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kanaCards.map((card, i) => (
                    <React.Fragment key={i}>
                      <TableRow>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell className="text-xl">{card.kana}</TableCell>
                        <TableCell className="font-mono">
                          {renderCorrectAnswer(card.romaji)}
                        </TableCell>
                        {results.map((player, pi) => (
                          <TableCell key={pi} className="font-mono">
                            {player.answers[i] !== undefined
                              ? renderDifference(player.answers[i] || '', card.romaji, 'given')
                              : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={2}>
                          <span className="text-xs text-muted-foreground">
                            {card.english}
                          </span>
                        </TableCell>
                        <TableCell colSpan={results.length} />
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>

              {/* Expandable per-card review */}
              <div className="space-y-2">
                {kanaCards.map((card, i) => {
                  const isExpanded = expandedCard === i;
                  return (
                    <Card key={i} className="border-border">
                      <CardHeader
                        className="cursor-pointer py-3"
                        onClick={() => setExpandedCard(isExpanded ? null : i)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-lg">
                              {card.kana}
                            </Badge>
                            <span className="font-medium">Card {i + 1}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            {isExpanded ? (
                              <ChevronUpIcon className="h-4 w-4" />
                            ) : (
                              <ChevronDownIcon className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="pb-4">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Correct answer
                              </p>
                              <span className="font-mono text-green-400">
                                {card.romaji}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                English
                              </p>
                              <span className="text-sm text-foreground">
                                {card.english}
                              </span>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Player answers
                              </p>
                              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {results.map((player, pi) => (
                                  <div key={pi} className="rounded border border-border p-2">
                                    <span className="text-xs text-muted-foreground">
                                      {player.name}
                                    </span>
                                    <div className="font-mono text-sm">
                                      {player.answers[i] !== undefined
                                        ? renderDifference(player.answers[i] || '', card.romaji, 'given')
                                        : <span className="text-muted-foreground">No answer</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style>{`
        .kanji-font {
          font-family: 'Noto Serif JP', 'Hiragino Mincho ProN', 'Yu Mincho', serif;
        }
      `}</style>
    </div>
  );
}

export default Results;
