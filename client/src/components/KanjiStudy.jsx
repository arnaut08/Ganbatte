import { useEffect, useState } from 'react';
import { getKanjiCards } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

function KanjiStudy({ onBack }) {
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [kanjiData, setKanjiData] = useState({ cards: [], groups: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanjiCards()
      .then(setKanjiData)
      .catch(() => setError('Unable to load Kanji cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const cards = selectedGroups.length === 0
    ? kanjiData.cards
    : kanjiData.cards.filter((card) => selectedGroups.includes(card.groupId));
  const card = cards[cardIndex];

  const selectGroup = (groupId) => {
    setSelectedGroups((current) => current.includes(groupId)
      ? current.filter((selected) => selected !== groupId)
      : [...current, groupId]);
    setCardIndex(0);
    setIsRevealed(false);
  };

  const moveCard = (direction) => {
    setCardIndex((current) => (current + direction + cards.length) % cards.length);
    setIsRevealed(false);
  };

  const filterSummary = selectedGroups.length === 0
    ? 'All kanji'
    : `${selectedGroups.length} groups selected`;

  return (
    <main className="container mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <Card className="border-border">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary sm:text-sm">
                Kanji practice
              </p>
              <CardTitle className="kana-font text-xl sm:text-2xl">
                Build your reading foundation
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed sm:text-base">
                Study 100 beginner kanji, grouped by everyday themes.
              </CardDescription>
            </div>
            <Button
              variant="secondary"
              size="icon"
              onClick={onBack}
              className="h-9 w-9 rounded-full self-start sm:self-auto"
              aria-label="Back to home"
              title="Back to home"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter */}
      <div className="relative max-w-[15rem]">
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              aria-label="Filter Kanji groups"
            >
              <span>{filterSummary}</span>
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full border-border bg-popover" align="start">
            <DropdownMenuItem
              className={selectedGroups.length === 0 ? 'bg-accent/50' : ''}
              onSelect={() => {
                setSelectedGroups([]);
                setCardIndex(0);
                setIsRevealed(false);
                setIsFilterOpen(false);
              }}
            >
              <span className="mr-2">
                {selectedGroups.length === 0 ? '✓' : ''}
              </span>
              All kanji
            </DropdownMenuItem>
            {kanjiData.groups.map((group) => (
              <DropdownMenuItem
                key={group.id}
                className={selectedGroups.includes(group.id) ? 'bg-accent/50' : ''}
                onSelect={() => selectGroup(group.id)}
              >
                <span className="mr-2">
                  {selectedGroups.includes(group.id) ? '✓' : ''}
                </span>
                {group.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Kanji Card */}
      {isLoading && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Skeleton className="mb-4 h-6 w-3/4" />
            <Skeleton className="h-24 w-24 rounded-full" />
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!isLoading && !error && card && (
        <Card className="border-accent/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-primary">
              {card.groupName}
            </p>
            <div className="kana-font text-7xl font-bold text-foreground sm:text-8xl">
              {card.kanji}
            </div>
            {isRevealed ? (
              <div className="mt-8 w-full max-w-md space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Reading
                      </p>
                      <p className="mt-1 text-xl font-medium text-foreground">
                        {card.reading}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Meaning
                      </p>
                      <p className="mt-1 text-xl font-medium text-foreground">
                        {card.meaning}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                {card.example && (
                  <Card className="border-border">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Example
                      </p>
                      <p className="mt-1 text-lg text-foreground">
                        {card.example[0]}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {card.example[1]}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Button
                className="mt-8"
                onClick={() => setIsRevealed(true)}
              >
                Show reading
              </Button>
            )}
            <p className="mt-6 text-sm text-muted-foreground">
              Card {cardIndex + 1} of {cards.length}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      {!isLoading && !error && card && (
        <div className="flex justify-center gap-3">
          <Button variant="secondary" onClick={() => moveCard(-1)}>
            <ChevronLeftIcon className="h-4 w-4" />
            Previous
          </Button>
          <Button onClick={() => moveCard(1)}>
            <ChevronRightIcon className="h-4 w-4" />
            Next
          </Button>
        </div>
      )}
    </main>
  );
}

export default KanjiStudy;
