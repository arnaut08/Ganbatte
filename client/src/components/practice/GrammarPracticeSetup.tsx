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
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <BackButton onClick={onBack} label="Back to previous screen" />
      </div>

      <LegacyCard>
        <LegacyCardHeader>
          <LegacyCardTitle>Grammar practice</LegacyCardTitle>
          <LegacyCardDescription className="font-bold">
            Choose a lesson range and generate a Genki practice set.
          </LegacyCardDescription>
        </LegacyCardHeader>
        <LegacyCardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-wider text-black/70">Max lesson</label>
              <select
                value={selectedLesson}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setSelectedLesson(Number(event.target.value))}
                className="flex h-10 w-full border-2 border-black bg-white px-3 py-2 text-sm font-bold shadow-[3px_3px_0px_0px_#000] focus:outline-none"
              >
                {LESSON_OPTIONS.map((lesson) => (
                  <option key={lesson} value={lesson}>Lesson {lesson}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black uppercase tracking-wider text-black/70">Question count</label>
              <LegacyInput
                type="number"
                min={1}
                max={25}
                value={count}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setCount(Math.max(1, Math.min(25, Number(event.target.value) || 1)))}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <LegacyButton onClick={() => onGenerate(selectedLesson, count)} variant="default">
              Generate assessment
            </LegacyButton>
          </div>
        </LegacyCardContent>
      </LegacyCard>
    </div>
  );
}

export default GrammarPracticeSetup;
