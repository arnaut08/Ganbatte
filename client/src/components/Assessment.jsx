import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { buildRomajiDiff, scoreRomajiAnswer } from '../utils/romaji';

function Assessment({ room, kanaCards, onSubmitAnswer, onUseHint, onNextCard, username }) {
  const [answer, setAnswer] = useState('');
  const [showOpponentStatus, setShowOpponentStatus] = useState(true);

  const currentCard = kanaCards[room.currentCardIndex];
  const currentPlayer = room.players.find((p) => p.name === username);
  const otherPlayer = room.players.find((p) => p.name !== username);
  const totalHintsUsed = Array.isArray(currentPlayer?.hintsUsed)
    ? currentPlayer.hintsUsed.reduce((sum, value) => sum + Number(value || 0), 0)
    : 0;
  const currentHintsUsed = currentPlayer?.hintsUsed?.[room.currentCardIndex] ?? 0;

  // Determine submission state from room data to avoid race between
  // local state and server-synced room updates.
  const submitted = currentPlayer?.answers[room.currentCardIndex] !== undefined;
  const otherSubmitted = otherPlayer?.answers[room.currentCardIndex] !== undefined;
  const currentReady = currentPlayer?.ready === true;
  const otherReady = otherPlayer?.ready === true;
  const otherAnswer = otherPlayer?.answers[room.currentCardIndex];
  const otherCorrect = otherAnswer !== undefined
    && scoreRomajiAnswer(otherAnswer, currentCard?.romaji).percentage === 100;

  useEffect(() => {
    setAnswer('');
  }, [room.currentCardIndex]);

  const isKanjiAssessment = room?.deckType === 'kanji';
  const canUseHint = isKanjiAssessment && !submitted && totalHintsUsed < 2;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onSubmitAnswer(answer.toLowerCase().trim());
    }
  };

  const progress = ((room.currentCardIndex + 1) / kanaCards.length) * 100;
  const submittedAnswer = currentPlayer?.answers[room.currentCardIndex] || '';
  const answerScore = scoreRomajiAnswer(submittedAnswer, currentCard?.romaji);
  const isCorrect = answerScore.percentage === 100;
  const answerDiff = !isCorrect
    ? buildRomajiDiff(submittedAnswer, currentCard?.romaji)
    : null;

  const renderDifference = (segments, tokenClass) => segments.map((segment, index) => (
    <span
      key={`${segment.type}-${index}`}
      className={segment.type === 'diff' ? tokenClass : undefined}
    >
      {segment.text}
    </span>
  ));

  return (
    <div className="flex min-h-[calc(100vh-64px-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-3xl border-border">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Card {room.currentCardIndex + 1} of {kanaCards.length}
              </span>
              <Badge variant={isCorrect ? 'success' : 'secondary'}>
                {isCorrect ? 'Correct' : submitted ? 'Needs review' : 'In progress'}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Card Display */}
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <CardTitle className="text-center text-sm uppercase tracking-wider text-muted-foreground">
                {username}
              </CardTitle>
              <div className="text-5xl font-bold text-foreground">
                {currentCard?.kana}
              </div>
              {isKanjiAssessment && (
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Enter the reading in romaji
                </p>
              )}
              {isKanjiAssessment && currentHintsUsed > 0 && (
                <p className="text-sm text-amber-400">
                  Hint: {currentCard?.english}
                </p>
              )}
              {submitted && (
                <Badge
                  variant={isCorrect ? 'success' : 'destructive'}
                  className="mt-2 text-sm font-medium"
                >
                  {isCorrect ? '✓ Correct!' : '✗ Try again next time'}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Input / Answer Review Section */}
          <div>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <Input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={isKanjiAssessment ? 'Type the reading...' : 'Type the romaji...'}
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!answer.trim()}>
                  Submit
                </Button>
                {canUseHint && (
                  <Button type="button" variant="secondary" onClick={() => onUseHint(room.currentCardIndex)}>
                    Hint ({2 - totalHintsUsed})
                  </Button>
                )}
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your answer
                  </p>
                  <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                    {isCorrect || !answerDiff ? (
                      <span>{submittedAnswer}</span>
                    ) : (
                      renderDifference(answerDiff.given, 'text-destructive')
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Correct answer
                  </p>
                  <div className="rounded-md border border-border bg-muted/30 p-3 font-mono text-sm">
                    {isCorrect || !answerDiff ? (
                      <span>{currentCard?.romaji}</span>
                    ) : (
                      renderDifference(answerDiff.expected, 'text-green-400')
                    )}
                  </div>
                </div>

                {currentCard?.english && (
                  <p className="text-sm text-muted-foreground">
                    English: <strong className="text-foreground">{currentCard.english}</strong>
                  </p>
                )}

                <div className="flex items-center justify-between pt-2">
                  {!currentReady ? (
                    <Button onClick={() => onNextCard()}>Ready</Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Waiting...</span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {otherReady
                      ? 'Other player ready'
                      : otherSubmitted
                      ? 'Other player submitted'
                      : 'Other player not submitted'}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* Opponent Status */}
          {showOpponentStatus && (
            <Card className="border-border bg-card/50">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {otherPlayer ? otherPlayer.name : 'Opponent'}
                    </span>
                    {otherPlayer && otherSubmitted && otherCorrect && (
                      <Badge variant="success" className="text-xs">
                        ✓ Correct
                      </Badge>
                    )}
                    {otherPlayer && otherSubmitted && !otherCorrect && (
                      <Badge variant="destructive" className="text-xs">
                        ✗ Incorrect
                      </Badge>
                    )}
                    {otherPlayer && !otherSubmitted && (
                      <Badge variant="outline" className="text-xs">
                        ⏳ Not submitted
                      </Badge>
                    )}
                  </div>
                  {otherReady && (
                    <Badge variant="success" className="text-xs">
                      ✅ Ready
                    </Badge>
                  )}
                  {!otherPlayer && (
                    <span className="text-sm text-muted-foreground">
                      Waiting for opponent...
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2">
            <Switch
              id="show-opponent"
              checked={showOpponentStatus}
              onCheckedChange={setShowOpponentStatus}
            />
            <Label htmlFor="show-opponent" className="text-sm text-muted-foreground cursor-pointer">
              Show opponent status
            </Label>
          </div>

          {/* Hint */}
          <Card className="border-yellow-900/30 bg-yellow-950/30">
            <CardContent className="py-3">
              <p className="text-sm text-yellow-400">
                {isKanjiAssessment
                  ? '💡 Tip: Type the romaji reading for the kanji character shown above'
                  : '💡 Tip: Type the romaji (Latin letters) for the kana character shown above'}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

export default Assessment;
