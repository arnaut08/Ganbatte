import type { ReactNode } from 'react';
import { HomeSkeleton } from '../AppHomeSkeleton';
import { MasteryPassportSkeleton } from '../../profile/MasteryPassportSkeleton';
import GroupMapSkeleton from '../../learning/GroupMapSkeleton';
import GrammarStudySkeleton from '../../learning/grammar/GrammarStudySkeleton';
import KanaFilterSkeleton from '../../learning/kana/KanaFilterSkeleton';
import KanaRecallSkeleton from '../../learning/kana/KanaRecallSkeleton';
import AssessmentHistorySkeleton from '../../profile/AssessmentHistorySkeleton';
import AssessmentLoadingScreen from '../../practice/AssessmentLoadingScreen';
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

  switch (status) {
    case 'gauntlet': return <GauntletSkeleton />;
    case 'selector': return <HomeSkeleton />;
    case 'friends': return <FriendsSkeleton />;
    case 'lobby': return <RoomLobbySkeleton accent={assessmentAccent} />;
    case 'kana-intro': return <LearningIntroSkeleton accent="#FFDE59" />;
    case 'kana-filter': return <KanaFilterSkeleton fullScreen />;
    case 'kana-study': return <KanaRecallSkeleton fullScreen />;
    case 'kanji-intro': return <LearningIntroSkeleton accent="#70CFF8" />;
    case 'kanji-study': return <GroupMapSkeleton count={6} accentColor="#70CFF8" />;
    case 'vocab-intro': return <LearningIntroSkeleton accent="#A3E636" />;
    case 'vocab-study': return <GroupMapSkeleton count={6} accentColor="#A3E636" />;
    case 'grammar-intro': return <LearningIntroSkeleton accent="#C084FC" />;
    case 'grammar-study': return <GrammarStudySkeleton />;
    case 'grammar-practice':
      return <AssessmentSkeleton accent="#C084FC" />;
    case 'assessment': return <AssessmentSkeleton accent={assessmentAccent} />;
    case 'results': return <ResultsSkeleton accent={assessmentAccent} />;
    case 'assessment-preparing': return <AssessmentLoadingScreen title="Preparing your assessment" description="Generating the question set and synchronizing operators..." />;
    case 'history': return <AssessmentHistorySkeleton fullScreen />;
    case 'passport': return <MasteryPassportSkeleton />;
    default: return null;
  }
}