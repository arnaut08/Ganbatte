import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getGrammarLessons, getGrammarOverview } from '../../../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import type { GrammarLesson, GrammarLessonOverview } from '../../../types';

const KANJI_CHARACTER = /\p{Script=Han}/u;
const HIRAGANA_START = 0x3041;
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;

type GrammarStudyProps = {
  onBack: () => void;
  onPracticeLesson: (lessonNumber: number) => Promise<void> | void;
};

function normalizeKanaCharacter(character: string) {
  const codePoint = character.codePointAt(0);
  if (codePoint !== undefined && codePoint >= KATAKANA_START && codePoint <= KATAKANA_END) {
    return String.fromCodePoint(codePoint - KATAKANA_START + HIRAGANA_START);
  }
  return character;
}

function renderJapaneseWithReadings(japanese: string, furigana?: string): ReactNode {
  const text = String(japanese || '');
  const reading = String(furigana || '');
  if (!reading || ![...text].some((character) => KANJI_CHARACTER.test(character))) return text;

  const segments: Array<{ type: 'plain' | 'kanji'; text: string; reading?: string }> = [];
  let plainText = '';
  let kanjiText = '';
  let readingStart = 0;

  const flushPlainText = () => {
    if (!plainText) return;
    segments.push({ type: 'plain', text: plainText });
    plainText = '';
  };

  const flushKanji = (readingEnd: number) => {
    if (!kanjiText) return;
    const kanjiReading = reading.slice(readingStart, readingEnd);
    segments.push({ type: kanjiReading ? 'kanji' : 'plain', text: kanjiText, reading: kanjiReading });
    kanjiText = '';
  };

  for (const character of text) {
    if (KANJI_CHARACTER.test(character)) {
      flushPlainText();
      kanjiText += character;
      continue;
    }

    const readingCharacter = normalizeKanaCharacter(character);
    const remainingReading = [...reading.slice(readingStart)];
    const readingIndex = remainingReading.findIndex(
      (candidate) => normalizeKanaCharacter(candidate) === readingCharacter,
    );
    if (readingIndex >= 0) {
      const readingEnd = readingStart + readingIndex;
      flushKanji(readingEnd);
      plainText += character;
      readingStart = readingEnd + 1;
    } else {
      if (kanjiText) {
        flushKanji(reading.length);
      }
      plainText += character;
    }
  }

  flushKanji(reading.length);
  flushPlainText();

  return segments.map((segment, index) =>
    segment.type === 'kanji' ? (
      <ruby key={`${segment.text}-${index}`} className="kanji-reading" tabIndex={0}>
        <span>{segment.text}</span>
        <rt>{segment.reading}</rt>
      </ruby>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    ),
  );
}

function GrammarStudy({ onBack, onPracticeLesson }: GrammarStudyProps) {
  const [lessons, setLessons] = useState<GrammarLesson[]>([]);
  const [lessonProgress, setLessonProgress] = useState<Record<number, GrammarLessonOverview>>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPracticing, setIsPracticing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.allSettled([getGrammarLessons(), getGrammarOverview()])
      .then(([lessonsRes, overviewRes]) => {
        if (lessonsRes.status === 'fulfilled') {
          const rawData = lessonsRes.value;
          setLessons(Array.isArray(rawData) ? (rawData as GrammarLesson[]) : []);
        } else {
          setError('Unable to load grammar lessons. Please try again.');
        }

        if (overviewRes.status === 'fulfilled' && overviewRes.value?.lessons) {
          const progressMap: Record<number, GrammarLessonOverview> = {};
          overviewRes.value.lessons.forEach((item: GrammarLessonOverview) => {
            progressMap[item.lesson_number] = item;
          });
          setLessonProgress(progressMap);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const lesson = lessons[selectedIndex]?.content;
  const currentProgress = useMemo(
    () => (lesson ? lessonProgress[lesson.lessonNumber] : undefined),
    [lesson, lessonProgress],
  );

  const slideLabels = lesson
    ? ['Overview', ...lesson.grammarPoints.map((point) => point.pattern), 'Mistakes', 'Review']
    : [];

  useEffect(() => {
    setSlideIndex(0);
  }, [selectedIndex]);

  const moveLesson = (direction: number) => {
    setSelectedIndex((current) => Math.min(Math.max(current + direction, 0), lessons.length - 1));
  };

  const moveSlide = (direction: number) => {
    setSlideIndex((current) => Math.min(Math.max(current + direction, 0), slideLabels.length - 1));
  };

  const handlePractice = async () => {
    if (!lesson || !onPracticeLesson) return;
    setIsPracticing(true);
    try {
      await onPracticeLesson(lesson.lessonNumber);
    } finally {
      setIsPracticing(false);
    }
  };

  return (
    <main className="container mx-auto max-w-4xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* Header Bar */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          title="Back to learning"
        >
          <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
        </button>
        <div>
          <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // STUDY: GENKI GRAMMAR
          </span>
          <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
            Genki Volume 1
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className="border-2 border-black bg-[#1a1f2c] p-8 sm:p-12 text-center font-mono text-xs sm:text-sm font-bold text-neutral-300 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          LOADING LESSONS...
        </div>
      )}
      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-3 sm:p-4 text-center font-mono text-xs sm:text-sm font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
          {error}
        </div>
      )}
      {!isLoading && !error && lessons.length === 0 && (
        <div className="border-2 border-black bg-[#1a1f2c] p-8 sm:p-12 text-center font-mono text-xs sm:text-sm font-bold text-neutral-300 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          NO PUBLISHED LESSONS YET.
        </div>
      )}

      {!isLoading && !error && lesson && (
        <div className="space-y-3.5 sm:space-y-6">
          {/* Top: Chapter/Lesson Pills Bar (Horizontal Scroll on Mobile) */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
            {lessons.map((entry, index) => {
              const progress = lessonProgress[entry.lessonNumber];
              const isMastered = progress?.is_mastered;
              const isCleared = progress?.is_cleared;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={entry.lessonNumber}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(index);
                    setSlideIndex(0);
                  }}
                  className={`relative shrink-0 flex items-center gap-1.5 border-2 border-black px-2.5 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[10px] sm:text-xs font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                    isSelected
                      ? 'bg-[#FFDE59] text-black'
                      : 'bg-[#1a1f2c] text-neutral-400 hover:bg-[#2c3345] hover:text-white'
                  }`}
                >
                  <span>Lesson {entry.lessonNumber}</span>
                  {isMastered ? (
                    <span
                      className={`text-[9px] sm:text-[10px] ${
                        isSelected ? 'text-purple-900' : 'text-[#C084FC]'
                      }`}
                      title="Mastered"
                    >
                      ★
                    </span>
                  ) : isCleared ? (
                    <span
                      className={`text-[9px] sm:text-[10px] ${
                        isSelected ? 'text-green-900' : 'text-[#A3E636]'
                      }`}
                      title="Cleared"
                    >
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Main Presentation Deck Card */}
          <article className="flex flex-col border-2 border-black bg-[#FFDE59] text-black shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
            {/* Card Header */}
            <div className="p-3.5 sm:p-8 pb-2.5 sm:pb-4">
              <div className="flex flex-col gap-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border-2 border-black bg-black px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[11px] font-black uppercase text-[#FFDE59]">
                      Lesson {lesson.lessonNumber}
                    </span>
                    {currentProgress?.is_mastered ? (
                      <span className="border-2 border-black bg-[#C084FC] px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[11px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000]">
                        ★ Mastered
                      </span>
                    ) : currentProgress?.is_cleared ? (
                      <span className="border-2 border-black bg-[#A3E636] px-1.5 py-0.5 sm:px-2 font-mono text-[9px] sm:text-[11px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000]">
                        ✓ Cleared
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-1.5 sm:mt-3 text-xl sm:text-3xl font-black uppercase tracking-tight">
                    {lesson.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handlePractice}
                  disabled={isPracticing}
                  className="w-full sm:w-auto border-2 border-black bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 font-mono text-[11px] sm:text-xs font-black uppercase whitespace-nowrap shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-wait disabled:opacity-60"
                >
                  {isPracticing ? 'Preparing...' : 'Practice this lesson ⚡'}
                </button>
              </div>

              {/* Slide Progress Indicator */}
              <div className="mt-3.5 sm:mt-6 flex items-center justify-between border-y-2 border-black py-1.5 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black uppercase">
                <span>Slide {slideIndex + 1} of {slideLabels.length}</span>
                <span className="bg-black/10 px-1.5 py-0.5">{slideLabels[slideIndex]}</span>
              </div>
            </div>

            {/* Dynamic Slide Body */}
            <div className="min-h-0 sm:min-h-[320px] px-3.5 sm:px-8 py-2">
              {/* Slide 0: Overview */}
              {slideIndex === 0 && (
                <section className="space-y-3 sm:space-y-5">
                  <p className="max-w-3xl text-xs sm:text-base font-bold leading-relaxed">{lesson.overview}</p>
                  <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2">
                    <div className="border-2 border-black bg-white p-3 sm:p-4 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                      <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-600">// Objectives</h3>
                      <ul className="mt-2 list-disc space-y-1 sm:space-y-2 pl-4 text-xs sm:text-sm font-bold">
                        {lesson.objectives.map((objective) => (
                          <li key={objective}>{objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-2 border-black bg-white p-3 sm:p-4 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                      <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-600">// What you will learn</h3>
                      <p className="mt-2 text-xs sm:text-sm font-bold leading-relaxed">
                        Work through each grammar point sequentially, then test your understanding with guided practice and quizzes.
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Slide 1..N: Grammar Points */}
              {slideIndex > 0 && slideIndex <= lesson.grammarPoints.length && (
                <section className="space-y-3 sm:space-y-4">
                  {(() => {
                    const point = lesson.grammarPoints[slideIndex - 1];
                    return (
                      <div key={point.pattern} className="border-2 border-black bg-white p-3.5 sm:p-5 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                        <div className="border-b-2 border-black pb-2 sm:pb-3">
                          <span className="font-mono text-[9px] sm:text-xs font-black uppercase text-neutral-500">// Pattern</span>
                          <h4 className="text-lg sm:text-2xl font-black mt-0.5">
                            {point.pattern} <span className="text-xs sm:text-base font-bold text-neutral-600">| {point.meaning}</span>
                          </h4>
                        </div>

                        <div className="mt-2 sm:mt-3">
                          <span className="font-mono text-[9px] sm:text-xs font-black uppercase text-neutral-500">// Formation</span>
                          <p className="mt-1 font-mono text-xs sm:text-sm font-bold bg-neutral-100 p-1.5 sm:p-2 border border-black/20">
                            {point.formation}
                          </p>
                        </div>

                        {(point.usageNotes || []).length > 0 && (
                          <div className="mt-2.5 sm:mt-4 border-l-4 border-[#70CFF8] pl-2.5 sm:pl-3">
                            <h5 className="font-mono text-[10px] sm:text-xs font-black uppercase">// When to use it</h5>
                            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs sm:text-sm font-semibold">
                              {(point.usageNotes || []).map((note) => (
                                <li key={note}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2">
                          <span className="font-mono text-[9px] sm:text-xs font-black uppercase text-neutral-500">// Examples</span>
                          {point.examples.map((example) => (
                            <div key={`${point.pattern}-${example.japanese}`} className="border-2 border-black bg-[#A3E636]/20 p-2 sm:p-3 text-xs sm:text-sm">
                              <p className="jp-font text-sm sm:text-base font-black" aria-label={`${example.japanese}${example.furigana ? ` (${example.furigana})` : ''}`}>
                                {renderJapaneseWithReadings(example.japanese, example.furigana)}
                              </p>
                              <p className="font-mono text-[10px] sm:text-xs text-neutral-600">{example.romaji}</p>
                              <p className="font-semibold text-neutral-800">{example.english}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </section>
              )}

              {/* Common Mistakes Slide */}
              {slideIndex === lesson.grammarPoints.length + 1 && (
                <section className="border-2 border-black bg-[#FF6B6B] p-3.5 sm:p-5 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                  <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider">// Common mistakes</h3>
                  <ul className="mt-2 list-disc space-y-1 sm:space-y-2 pl-4 text-xs sm:text-sm font-bold">
                    {lesson.commonMistakes.map((mistake) => (
                      <li key={mistake}>{mistake}</li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Review Checklist Slide */}
              {slideIndex === lesson.grammarPoints.length + 2 && (
                <section className="space-y-3 sm:space-y-4">
                  <div className="border-2 border-black bg-white p-3.5 sm:p-5 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                    <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-600">// Review checklist</h3>
                    <ul className="mt-2 space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-bold">
                      {lesson.reviewChecklist.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <input type="checkbox" className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-none border-2 border-black accent-black" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {(lesson.guidedPractice || []).length > 0 && (
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider">// Guided practice</h3>
                      {(lesson.guidedPractice || []).map((item, index) => (
                        <div key={`${item.prompt}-${index}`} className="border-2 border-black bg-white p-3 sm:p-4 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]">
                          <p className="font-black text-xs sm:text-sm">{index + 1}. {item.prompt}</p>
                          <p className="mt-1.5 text-xs sm:text-sm font-bold">
                            <span className="font-mono text-[9px] sm:text-xs uppercase bg-black text-white px-1 py-0.5">Answer</span> {item.answer}
                          </p>
                          <p className="mt-0.5 text-xs sm:text-sm font-semibold text-neutral-600">{item.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Integrated Deck Bottom Navigation */}
            <div className="mt-4 sm:mt-6 border-t-2 border-black bg-black/5 p-3 sm:p-6 flex flex-col gap-2.5 sm:gap-4">
              {/* Slide Quick-Selector Tabs */}
              <div className="flex gap-1 sm:gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0 sm:flex-wrap" aria-label="Lesson slides">
                {slideLabels.map((label, index) => (
                  <button
                    key={`${label}-${index}`}
                    type="button"
                    onClick={() => setSlideIndex(index)}
                    className={`shrink-0 border-2 border-black px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[11px] font-black uppercase shadow-[1px_1px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                      index === slideIndex
                        ? 'bg-black text-[#FFDE59]'
                        : 'bg-white text-black hover:bg-neutral-100'
                    }`}
                  >
                    {index + 1}. {label}
                  </button>
                ))}
              </div>

              {/* Stepper Controls */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => moveSlide(-1)}
                  disabled={slideIndex === 0}
                  className="border-2 border-black bg-white px-3 py-1.5 sm:px-4 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => moveSlide(1)}
                  disabled={slideIndex === slideLabels.length - 1}
                  className="border-2 border-black bg-[#A3E636] px-3.5 py-1.5 sm:px-5 sm:py-2.5 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          </article>

          {/* Lesson-to-Lesson Global Footer Navigation */}
          <div className="flex justify-between gap-2 sm:gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                moveLesson(-1);
                setSlideIndex(0);
              }}
              disabled={selectedIndex === 0}
              className="flex h-9 sm:h-11 items-center gap-1 border-2 border-black bg-white px-3 sm:px-4 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Prev Lesson
            </button>
            <button
              type="button"
              onClick={() => {
                moveLesson(1);
                setSlideIndex(0);
              }}
              disabled={selectedIndex === lessons.length - 1}
              className="flex h-9 sm:h-11 items-center gap-1 border-2 border-black bg-[#70CFF8] px-3 sm:px-4 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next Lesson <ChevronRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default GrammarStudy;