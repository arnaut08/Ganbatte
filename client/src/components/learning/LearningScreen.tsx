import { type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import BrutalistCard from '../common/BrutalistCard';
import GlobalPageHeader from '../common/GlobalPageHeader';

type LearningScreenProps = {
  onBackToHome: () => void;
  onOpenKanaStudy: () => void;
  onOpenKanjiStudy: () => void;
  onOpenVocabStudy: () => void;
  onOpenGrammarStudy: () => void;
};

type LegacyProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;

export default function LearningScreen({ onBackToHome, onOpenKanaStudy, onOpenKanjiStudy, onOpenVocabStudy, onOpenGrammarStudy }: LearningScreenProps) {
  const modules = [
    {
      accentColor: '#FFDE59',
      strokeColor: 'rgba(255, 222, 89, 0.18)',
      watermark: '仮',
      badge: '01 // KANA',
      count: '92 CHARS',
      title: 'Kana',
      description: 'Study Hiragana and Katakana characters with romaji readings and example vocabulary.',
      buttonHoverClass: 'hover:bg-[#FFDE59]',
      onOpen: onOpenKanaStudy,
    },
    {
      accentColor: '#70CFF8',
      strokeColor: 'rgba(112, 207, 248, 0.18)',
      watermark: '漢',
      badge: '02 // KANJI',
      count: '98 KANJI',
      title: 'N5 Kanji',
      description: 'Review essential N5 Kanji grouped by daily life themes with interactive flashcards.',
      buttonHoverClass: 'hover:bg-[#70CFF8]',
      onOpen: onOpenKanjiStudy,
    },
    {
      accentColor: '#A3E636',
      strokeColor: 'rgba(163, 230, 54, 0.18)',
      watermark: '語',
      badge: '03 // VOCAB',
      count: '564 WORDS',
      title: 'Vocabulary',
      description: 'Build your N5 word bank with themed stages, active recall, and spaced repetition reviews.',
      buttonHoverClass: 'hover:bg-[#A3E636]',
      onOpen: onOpenVocabStudy,
    },
    {
      accentColor: '#C084FC',
      strokeColor: 'rgba(192, 132, 252, 0.18)',
      watermark: '文',
      badge: '04 // GRAMMAR',
      count: 'GENKI I',
      title: 'Grammar',
      description: 'Genki Volume 1 lessons broken down into step-by-step grammatical pattern blocks.',
      buttonHoverClass: 'hover:bg-[#C084FC]',
      onOpen: onOpenGrammarStudy,
    },
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <GlobalPageHeader
        onBack={onBackToHome}
        punchline="// SECTION: LEARNING"
        title="Study Japanese Modules"
        accentClass="text-[#FFDE59]"
      />

      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
        {modules.map((module) => (
          <BrutalistCard
            key={module.badge}
            accentColor={module.accentColor}
            onClick={module.onOpen}
            className="p-3.5 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
            watermark={(
              <span
                className="pointer-events-none absolute -bottom-3 -right-2 select-none font-mono text-[85px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105 sm:-bottom-4 sm:-right-3 sm:text-[130px]"
                style={{ WebkitTextStroke: `2px ${module.strokeColor}` }}
                aria-hidden="true"
              >
                {module.watermark}
              </span>
            )}
            badges={(
              <div className="mb-1.5 flex items-center justify-between gap-2 sm:mb-4">
                <span className="border-2 border-black px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:text-[10px] sm:shadow-[2px_2px_0px_0px_#000]" style={{ backgroundColor: module.accentColor }}>
                  {module.badge}
                </span>
                <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:text-[10px] sm:shadow-[2px_2px_0px_0px_#000]">
                  {module.count}
                </span>
              </div>
            )}
            title={(
              <>
                <h2 className="text-xl font-black uppercase tracking-tight text-white sm:text-3xl">{module.title}</h2>
                <p className="mt-1 text-xs font-medium leading-relaxed text-neutral-300 sm:text-sm">{module.description}</p>
              </>
            )}
          >
            <div className="relative z-10 p-0 pt-3 sm:pt-6">
              <LegacyButton
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  module.onOpen();
                }}
                className={`w-full border-2 border-black bg-white py-2 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] transition-colors active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3 sm:text-sm ${module.buttonHoverClass}`}
              >
                Study Now →
              </LegacyButton>
            </div>
          </BrutalistCard>
        ))}
      </div>
    </main>
  );
}
