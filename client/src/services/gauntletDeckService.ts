import { getKanaCards, getKanjiCards } from './api';
import type { Deck } from '@/types';

export interface GauntletCard {
  id: string;
  char: string;
  romaji: string[];
  type: 'kana' | 'kanji_n5';
}

type RawRecord = Record<string, unknown>;

interface DeckFilterOptions {
  deckType?: Deck;
  selectedGroups?: string[];
}

function splitReadings(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(splitReadings);
  if (typeof value !== 'string') return [];
  return value.split(/[,/]/).map((reading) => reading.toLowerCase().trim()).filter(Boolean);
}

function getCharacter(record: RawRecord, ...keys: string[]): string | undefined {
  const value = keys.map((key) => record[key]).find((candidate) => typeof candidate === 'string');
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export async function loadGauntletDeck({ deckType = 'kana', selectedGroups = [] }: DeckFilterOptions = {}): Promise<GauntletCard[]> {
  const cards: GauntletCard[] = [];
  const isSelected = (card: RawRecord) => {
    if (selectedGroups.length === 0) return true;
    const groupId = String(card.groupId ?? card.group_id ?? '');
    const groupName = String(card.groupName ?? card.group_name ?? '');
    return selectedGroups.includes(groupId) || selectedGroups.includes(groupName);
  };

  if (deckType === 'kana') {
    try {
      const kanaData = await getKanaCards();
      if (Array.isArray(kanaData?.cards)) kanaData.cards.forEach((rawCard) => {
      const card = rawCard as RawRecord;
      if (!isSelected(card)) return;
      const char = getCharacter(card, 'kana', 'character', 'char');
      const romaji = splitReadings(card.romaji);
      if (char && romaji.length > 0) {
        cards.push({
          id: `kana-${String(card.id ?? char)}`,
          char,
          romaji,
          type: 'kana',
        });
      }
      });
    } catch (error) {
      console.error('Failed to load Kana deck:', error);
    }
  }

  if (deckType === 'kanji') {
    try {
      const kanjiData = await getKanjiCards();
      if (Array.isArray(kanjiData?.cards)) kanjiData.cards.forEach((rawCard) => {
      const card = rawCard as RawRecord;
      if (!isSelected(card)) return;
      const char = getCharacter(card, 'kanji', 'character', 'char');
      const romaji = splitReadings(card.romaji);
      if (char && romaji.length > 0) {
        cards.push({
          id: `kanji-${String(card.id ?? char)}`,
          char,
          romaji: [...new Set(romaji)],
          type: 'kanji_n5',
        });
      }
      });
    } catch (error) {
      console.error('Failed to load Kanji deck:', error);
    }
  }

  return cards;
}