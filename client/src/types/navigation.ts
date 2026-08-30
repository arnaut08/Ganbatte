/**
 * Navigation unions for the app's high-level screen state machine.
 * Single source of truth shared by the context, hooks and router.
 */

/** Every top-level screen the app can be on. */
export type AppStatus =
  | 'selector'
  | 'friends'
  | 'passport'
  | 'kana-intro'
  | 'kana-filter'
  | 'kana-study'
  | 'kanji-intro'
  | 'kanji-study'
  | 'vocab-intro'
  | 'vocab-study'
  | 'grammar-study'
  | 'grammar-practice'
  | 'history'
  | 'lobby'
  | 'assessment'
  | 'results'
  | 'assessment-preparing';

/** Which root selector tab is active on the home (`selector`) screen. */
export type SelectorScreen = 'home' | 'learning' | 'practice';

/**
 * Screens that keep a live room session alive in the view stack. Used to
 * decide presence broadcasts and to prevent leaving the room flow.
 */
export const ROOM_VIEW_STATUSES: readonly AppStatus[] = [
  'lobby',
  'assessment',
  'results',
  'assessment-preparing',
];