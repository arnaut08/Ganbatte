import { type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
const LegacyCard = Card as unknown as ComponentType<LegacyProps>;
const LegacyCardContent = CardContent as unknown as ComponentType<LegacyProps>;
const LegacyCardDescription = CardDescription as unknown as ComponentType<LegacyProps>;
const LegacyCardHeader = CardHeader as unknown as ComponentType<LegacyProps>;
const LegacyCardTitle = CardTitle as unknown as ComponentType<LegacyProps>;

export default function LearningScreen({ onBackToHome, onOpenKanaStudy, onOpenKanjiStudy, onOpenVocabStudy, onOpenGrammarStudy }: LearningScreenProps) {

  return (
    <main className="mx-auto max-w-4xl space-y-4 sm:space-y-6 pb-20 sm:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBackToHome}
          className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to home"
          aria-label="Return to home"
        >
          <span className="font-mono text-base sm:text-lg font-black">&lt;</span>
        </button>

        <div className="flex flex-col justify-center">
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // SECTION: LEARNING
          </span>
          <h2 className="text-lg sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
            Study Japanese Modules
          </h2>
        </div>
      </div>

      {/* Responsive Grid: Compact Linear Ribbons on Mobile -> Full 2x2 Grid on Desktop */}
      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
        {/* Card 01 - Kana (Yellow #FFDE59) */}
        <LegacyCard
          onClick={onOpenKanaStudy}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
        >
          <span
            className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 select-none font-mono text-[85px] sm:text-[130px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
            style={{ WebkitTextStroke: '2px rgba(255, 222, 89, 0.18)' }}
            aria-hidden="true"
          >
            仮
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-[#FFDE59] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                01 // KANA
              </span>
              <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                92 CHARS
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Kana
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
              Study Hiragana and Katakana characters with romaji readings and example vocabulary.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenKanaStudy();
              }}
              className="w-full border-2 border-black bg-white py-2 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[3.5px_3.5px_0px_0px_#000] transition-colors hover:bg-[#FFDE59] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 02 - Kanji (Cyan #70CFF8) */}
        <LegacyCard
          onClick={onOpenKanjiStudy}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
        >
          <span
            className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 select-none font-mono text-[85px] sm:text-[130px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
            style={{ WebkitTextStroke: '2px rgba(112, 207, 248, 0.18)' }}
            aria-hidden="true"
          >
            漢
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-[#70CFF8] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                02 // KANJI
              </span>
              <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                98 KANJI
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
              N5 Kanji
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
              Review essential N5 Kanji grouped by daily life themes with interactive flashcards.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenKanjiStudy();
              }}
              className="w-full border-2 border-black bg-white py-2 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[3.5px_3.5px_0px_0px_#000] transition-colors hover:bg-[#70CFF8] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 03 - Vocabulary (Lime #A3E636) */}
        <LegacyCard
          onClick={onOpenVocabStudy}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
        >
          <span
            className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 select-none font-mono text-[85px] sm:text-[130px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
            style={{ WebkitTextStroke: '2px rgba(163, 230, 54, 0.18)' }}
            aria-hidden="true"
          >
            語
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                03 // VOCAB
              </span>
              <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                564 WORDS
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Vocabulary
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
              Build your N5 word bank with themed stages, active recall, and spaced repetition reviews.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenVocabStudy();
              }}
              className="w-full border-2 border-black bg-white py-2 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[3.5px_3.5px_0px_0px_#000] transition-colors hover:bg-[#A3E636] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 04 - Grammar (Soft Purple #C084FC) */}
        <LegacyCard
          onClick={onOpenGrammarStudy}
          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden border-2 border-black border-l-8 border-l-[#C084FC] bg-[#1f2637] p-3.5 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000]"
        >
          <span
            className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-3 select-none font-mono text-[85px] sm:text-[130px] font-black leading-none text-transparent transition-all duration-300 group-hover:scale-105"
            style={{ WebkitTextStroke: '2px rgba(192, 132, 252, 0.18)' }}
            aria-hidden="true"
          >
            文
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-[#C084FC] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                04 // GRAMMAR
              </span>
              <span className="border-2 border-black bg-[#151922] px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
                GENKI I
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Grammar
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 text-xs sm:text-sm font-medium leading-relaxed text-neutral-300">
              Genki Volume 1 lessons broken down into step-by-step grammatical pattern blocks.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onOpenGrammarStudy();
              }}
              className="w-full border-2 border-black bg-white py-2 sm:py-3 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[3.5px_3.5px_0px_0px_#000] transition-colors hover:bg-[#C084FC] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>
      </div>
    </main>
  );
}
