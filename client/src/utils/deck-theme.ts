import type { Deck } from '../types';

export const DECK_ACCENTS: Record<Deck, string> = {
  kana: '#FFDE59',
  kanji: '#70CFF8',
  vocab: '#A3E636',
  grammar: '#C084FC',
};

export function getDeckAccent(deckType?: Deck | string | null): string {
  return deckType && deckType in DECK_ACCENTS
    ? DECK_ACCENTS[deckType as Deck]
    : DECK_ACCENTS.kana;
}