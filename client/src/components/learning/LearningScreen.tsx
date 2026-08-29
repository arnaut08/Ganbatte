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
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          onClick={onBackToHome}
          className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to home"
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

      {/* Balanced Neo-Brutalist Grid */}
      <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 01 - Kana (Cyan) */}
        <LegacyCard className="group relative flex min-h-0 sm:min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#70CFF8] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000]">
          {/* Background Watermark Kanji */}
          <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-3 select-none font-black text-[90px] sm:text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105 font-mono">
            仮
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#70CFF8] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                01 // Kana
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1 sm:mt-0">
              Kana
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm font-bold leading-snug sm:leading-relaxed text-black/85">
              Study Hiragana and Katakana characters with romaji readings and example vocabulary.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={onOpenKanaStudy}
              className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-xs font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 02 - Kanji (Yellow) */}
        <LegacyCard className="group relative flex min-h-0 sm:min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#FFDE59] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000]">
          <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-3 select-none font-black text-[90px] sm:text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105 font-mono">
            漢
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FFDE59] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                02 // Kanji
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1 sm:mt-0">
              N5 Kanji
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm font-bold leading-snug sm:leading-relaxed text-black/85">
              Review essential N5 Kanji grouped by daily life themes with interactive flashcards.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={onOpenKanjiStudy}
              className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-xs font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 03 - Grammar (Coral Red) */}
        <LegacyCard className="group relative flex min-h-0 sm:min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#FF6B6B] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] md:col-span-2 lg:col-span-1">
          <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-3 select-none font-black text-[90px] sm:text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105 font-mono">
            文
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FF6B6B] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                03 // Grammar
              </span>
              <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                AVAILABLE
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1 sm:mt-0">
              Grammar
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm font-bold leading-snug sm:leading-relaxed text-black/85">
              Genki Volume 1 lessons broken down into step-by-step grammatical pattern blocks.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={onOpenGrammarStudy}
              className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-xs font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>

        {/* Card 04 - Vocabulary (Lime) */}
        <LegacyCard className="group relative flex min-h-0 sm:min-h-[380px] flex-col justify-between overflow-hidden border-2 border-black bg-[#A3E636] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000] transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000000] md:col-span-2 lg:col-span-1">
          <span className="pointer-events-none absolute -bottom-3 -right-2 sm:-bottom-5 sm:-right-3 select-none font-black text-[90px] sm:text-[130px] leading-none text-black/[0.08] transition-transform duration-200 group-hover:scale-105 font-mono">
            語
          </span>

          <LegacyCardHeader className="relative z-10 p-0">
            <div className="mb-1.5 sm:mb-4 flex items-center justify-between gap-2">
              <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#A3E636] shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                04 // Vocabulary
              </span>
              <span className="border-2 border-black bg-white px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
                N5
              </span>
            </div>

            <LegacyCardTitle className="text-xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1 sm:mt-0">
              Vocabulary
            </LegacyCardTitle>
            <LegacyCardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm font-bold leading-snug sm:leading-relaxed text-black/85">
              Build your N5 word bank with themed stages, active recall, and spaced repetition reviews.
            </LegacyCardDescription>
          </LegacyCardHeader>

          <LegacyCardContent className="relative z-10 p-0 pt-3 sm:pt-6">
            <LegacyButton
              onClick={onOpenVocabStudy}
              className="w-full border-2 border-black bg-white py-2.5 sm:py-5 text-xs sm:text-xs font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-neutral-100 group-hover:shadow-[5px_5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            >
              Study Now →
            </LegacyButton>
          </LegacyCardContent>
        </LegacyCard>
      </div>
    </div>
  );
}
