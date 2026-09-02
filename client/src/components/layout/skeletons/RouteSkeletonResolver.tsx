import type { ReactNode } from 'react';
import { HomeSkeleton } from '../AppHomeSkeleton';
import { MasteryPassportSkeleton } from '../../profile/MasteryPassportSkeleton';
import GroupMapSkeleton from '../../learning/GroupMapSkeleton';
import GrammarStudySkeleton from '../../learning/grammar/GrammarStudySkeleton';
import KanaFilterSkeleton from '../../learning/kana/KanaFilterSkeleton';
import KanaRecallSkeleton from '../../learning/kana/KanaRecallSkeleton';
import AssessmentHistorySkeleton from '../../profile/AssessmentHistorySkeleton';
import AssessmentLoadingScreen from '../../practice/AssessmentLoadingScreen';
import GrammarPracticeSkeleton from '../../practice/GrammarPracticeSkeleton';
import GauntletSkeleton from '../../skeletons/GauntletSkeleton';
import { getDeckAccent } from '../../../utils/deck-theme';
import {
  AssessmentSkeleton,
  FriendsSkeleton,
  LearningIntroSkeleton,
  RoomLobbySkeleton,
  ResultsSkeleton,
} from './RouteSkeletons';

type DeckType = 'kana' | 'kanji' | 'vocab' | 'grammar' | undefined;

export function resolveRouteSkeleton(status: string | undefined, deckType?: DeckType): ReactNode {
  const assessmentAccent = getDeckAccent(deckType);
  const preparingTitle = deckType === 'grammar'
    ? 'Preparing the grammar deck'
    : deckType === 'kanji'
      ? 'Preparing the kanji drill'
      : deckType === 'vocab'
        ? 'Preparing the vocabulary drill'
        : 'Preparing the reading deck';

  switch (status) {
    case 'gauntlet': return <GauntletSkeleton />;
    case 'selector': return <HomeSkeleton />;
    case 'friends': return <FriendsSkeleton />;
    case 'lobby': return <RoomLobbySkeleton accent={assessmentAccent} />;
    case 'kana-intro': return <LearningIntroSkeleton accent="#FFDE59" deck="kana" />;
    case 'kana-filter': return <KanaFilterSkeleton fullScreen />;
    case 'kana-study': return <KanaRecallSkeleton fullScreen />;
    case 'kanji-intro': return <LearningIntroSkeleton accent="#70CFF8" deck="kanji" />;
    case 'kanji-study': return <GroupMapSkeleton count={6} accentColor="#70CFF8" fullScreen deck="kanji" />;
    case 'vocab-intro': return <LearningIntroSkeleton accent="#A3E636" deck="vocab" />;
    case 'vocab-study': return <GroupMapSkeleton count={6} accentColor="#A3E636" fullScreen deck="vocab" />;
    case 'grammar-intro': return <LearningIntroSkeleton accent="#C084FC" deck="grammar" />;
    case 'grammar-study': return <GrammarStudySkeleton fullScreen />;
    case 'grammar-practice': return <GrammarPracticeSkeleton />;
    case 'assessment': return deckType === 'grammar'
      ? <GrammarPracticeSkeleton showForfeit />
      : <AssessmentSkeleton accent={assessmentAccent} />;
    case 'results': return deckType === 'grammar'
      ? <GrammarPracticeSkeleton forceResults />
      : <ResultsSkeleton accent={assessmentAccent} />;
    case 'assessment-preparing': return <AssessmentLoadingScreen title={preparingTitle} description="Generating the question set and synchronizing operators..." accent={assessmentAccent} />;
    case 'history': return <AssessmentHistorySkeleton fullScreen />;
    case 'passport': return <MasteryPassportSkeleton />;
    default: return null;
  }
}