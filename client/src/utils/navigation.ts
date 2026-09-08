import type { AppStatus, SelectorScreen } from '../types';

export const DEFAULT_STATUS: AppStatus = 'selector';

export type NavigationContext = {
  currentStatus: AppStatus;
  selectorScreen: SelectorScreen;
  activeRoomCode?: string | null;
  roomStatus?: 'lobby' | 'preparing' | 'active' | 'completed' | null;
};

export type BackDestination = {
  nextStatus: AppStatus;
  nextSelectorScreen?: SelectorScreen;
};

export function getBackDestination({
  currentStatus,
  selectorScreen,
  activeRoomCode,
  roomStatus,
}: NavigationContext): BackDestination {
  // 1. High-Priority Room Session Guard
  // If the user belongs to an active live room and navigated away to another page (Passport, Kana, Kanji, etc.)
  if (activeRoomCode && roomStatus && roomStatus !== 'completed') {
    if (roomStatus === 'active' && currentStatus !== 'assessment') {
      return { nextStatus: 'assessment' };
    }
    if ((roomStatus === 'lobby' || roomStatus === 'preparing') && currentStatus !== 'lobby') {
      return { nextStatus: 'lobby' };
    }
  }

  // 2. Deterministic Screen Target Map (Solo / Non-Room State)
  switch (currentStatus) {
    // Overlays / Global Pages
    case 'friends':
    case 'profile':
    case 'passport':
    case 'history':
      return { nextStatus: 'selector', nextSelectorScreen: selectorScreen || 'home' };

    // Kana Module
    case 'kana-intro':
    case 'kana-study':
      return { nextStatus: 'selector', nextSelectorScreen: 'learning' };
    case 'kana-filter':
      return { nextStatus: 'kana-intro' };

    // Kanji Module
    case 'kanji-intro':
    case 'kanji-study':
      return { nextStatus: 'selector', nextSelectorScreen: 'learning' };

    // Vocab Module
    case 'vocab-intro':
    case 'vocab-study':
      return { nextStatus: 'selector', nextSelectorScreen: 'learning' };

    // Grammar Module
    case 'grammar-intro':
    case 'grammar-study':
      return { nextStatus: 'selector', nextSelectorScreen: 'learning' };
    case 'grammar-practice':
      // Finished/cancelled solo practice -> Returns to lesson presentation deck
      return { nextStatus: 'grammar-study' };

    // Room Flow (When backing out from inside the room views)
    case 'lobby':
      return { nextStatus: 'selector', nextSelectorScreen: 'practice' };
    case 'assessment-preparing':
    case 'assessment':
    case 'results':
      return { nextStatus: 'lobby' };

    case 'selector':
    default:
      return { nextStatus: 'selector', nextSelectorScreen: 'home' };
  }
}