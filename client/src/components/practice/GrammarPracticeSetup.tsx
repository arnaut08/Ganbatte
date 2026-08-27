import { useState } from 'react';
import type { ChangeEvent, ComponentType, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import BackButton from '../common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const LESSON_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

type LegacyProps = {
  children?: ReactNode;
  className?: string;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyProps>;
const LegacyCard = Card as unknown as ComponentType<LegacyProps>;
const LegacyCardContent = CardContent as unknown as ComponentType<LegacyProps>;
const LegacyCardDescription = CardDescription as unknown as ComponentType<LegacyProps>;
const LegacyCardHeader = CardHeader as unknown as ComponentType<LegacyProps>;
const LegacyCardTitle = CardTitle as unknown as ComponentType<LegacyProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyProps>;

type GrammarPracticeSetupProps = {
  onBack: () => void;
  onGenerate: (selectedLesson: number, count: number) => void;
};

function GrammarPracticeSetup({ onBack, onGenerate }: GrammarPracticeSetupProps) {
  const [selectedLesson, setSelectedLesson] = useState(3);
  const [count, setCount] = useState(10);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3.5 sm:space-y-4 px-3 py-3 sm:px-4 sm:py-4 pb-20 sm:pb-24">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <BackButton onClick={onBack} label="Back to previous screen" />
      </div>

      <LegacyCard className="border-2 border-black bg-[#FFDE59] p-3.5 sm:p-6 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
        <LegacyCardHeader className="p-0 pb-3 sm:pb-4 border-b-2 border-black/40">
          <LegacyCardTitle className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black">
            Grammar Practice
          </LegacyCardTitle>
          <LegacyCardDescription className="text-xs sm:text-sm font-bold text-black/80 leading-snug">
            Choose a lesson range and generate a Genki practice set.
          </LegacyCardDescription>
        </LegacyCardHeader>
        <LegacyCardContent className="p-0 pt-3 sm:pt-4 space-y-3 sm:space-y-4">
          <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
            <div className="space-y-1 sm:space-y-1.5">
              <label className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/80">
                Max lesson
              </label>
              <select
                value={selectedLesson}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedLesson(Number(event.target.value))}
                className="flex h-9 sm:h-10 w-full border-2 border-black bg-white px-2.5 py-1 text-xs sm:text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              >
                {LESSON_OPTIONS.map((lesson) => (
                  <option key={lesson} value={lesson}>Lesson {lesson}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black/80">
                Question count
              </label>
              <LegacyInput
                type="number"
                min={1}
                max={25}
                value={count}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
                className="h-9 sm:h-10 border-2 border-black bg-white px-2.5 font-mono text-xs sm:text-sm font-bold text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000]"
              />
            </div>
          </div>

          <div className="pt-1">
            <LegacyButton
              onClick={() => onGenerate(selectedLesson, count)}
              className="w-full border-2 border-black bg-black py-2.5 sm:py-3.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-[#FFDE59] shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] hover:bg-neutral-800 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Generate assessment →
            </LegacyButton>
          </div>
        </LegacyCardContent>
      </LegacyCard>
    </div>
  );
}

export default GrammarPracticeSetup;
