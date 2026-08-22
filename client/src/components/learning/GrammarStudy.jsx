import { useEffect, useState } from 'react';
import { getGrammarLessons } from '../../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

function GrammarStudy({ onBack, onPracticeLesson }) {
    const [lessons, setLessons] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [slideIndex, setSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isPracticing, setIsPracticing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        getGrammarLessons()
            .then((data) => setLessons(Array.isArray(data) ? data : []))
            .catch(() => setError('Unable to load grammar lessons. Please try again.'))
            .finally(() => setIsLoading(false));
    }, []);

    const lesson = lessons[selectedIndex]?.content;
    const slideLabels = lesson
        ? ['Overview', ...lesson.grammarPoints.map((point) => point.pattern), 'Mistakes', 'Review']
        : [];

    useEffect(() => {
        setSlideIndex(0);
    }, [selectedIndex]);

    const moveLesson = (direction) => {
        setSelectedIndex((current) => Math.min(Math.max(current + direction, 0), lessons.length - 1));
    };

    const moveSlide = (direction) => {
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
        <main className="container mx-auto max-w-4xl space-y-6 px-4 py-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000]"
                    title="Back to learning"
                >
                    <ChevronLeftIcon className="h-5 w-5 stroke-[3]" />
                </button>
                <div>
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // STUDY: GENKI GRAMMAR
                    </span>
                    <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-tight">
                        Genki Volume 1
                    </h1>
                </div>
            </div>

            {isLoading && <div className="border-2 border-black bg-[#1a1f2c] p-12 text-center font-mono text-sm font-bold text-neutral-300 shadow-[6px_6px_0px_0px_#000000]">LOADING LESSONS...</div>}
            {error && <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000]">{error}</div>}
            {!isLoading && !error && lessons.length === 0 && <div className="border-2 border-black bg-[#1a1f2c] p-12 text-center font-mono text-sm font-bold text-neutral-300 shadow-[6px_6px_0px_0px_#000000]">NO PUBLISHED LESSONS YET.</div>}

            {!isLoading && !error && lesson && (
                <div className="space-y-6">
                    {/* Top: Chapter/Lesson Pills Bar */}
                    <div className="flex flex-wrap gap-2">
                        {lessons.map((entry, index) => (
                            <button
                                key={entry.lessonNumber}
                                type="button"
                                onClick={() => {
                                    setSelectedIndex(index);
                                    setSlideIndex(0);
                                }}
                                className={`border-2 border-black px-3.5 py-1.5 font-mono text-xs font-black uppercase transition-all shadow-[3px_3px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${index === selectedIndex
                                        ? 'bg-[#FFDE59] text-black'
                                        : 'bg-[#1a1f2c] text-neutral-400 hover:bg-[#2c3345] hover:text-white'
                                    }`}
                            >
                                Lesson {entry.lessonNumber}
                            </button>
                        ))}
                    </div>

                    {/* Main Presentation Deck Card */}
                    <article className="flex flex-col border-2 border-black bg-[#FFDE59] text-black shadow-[6px_6px_0px_0px_#000000]">
                        {/* Card Header */}
                        <div className="p-6 sm:p-8 pb-4">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <span className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[11px] font-black uppercase text-[#FFDE59]">
                                        Lesson {lesson.lessonNumber}
                                    </span>
                                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
                                        {lesson.title}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={handlePractice}
                                    disabled={isPracticing}
                                    className="border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-wait disabled:opacity-60"
                                >
                                    {isPracticing ? 'Preparing...' : 'Practice this lesson ⚡'}
                                </button>
                            </div>

                            {/* Slide Progress Indicator */}
                            <div className="mt-6 flex items-center justify-between border-y-2 border-black py-2.5 font-mono text-xs font-black uppercase">
                                <span>Slide {slideIndex + 1} of {slideLabels.length}</span>
                                <span className="bg-black/10 px-2 py-0.5">{slideLabels[slideIndex]}</span>
                            </div>
                        </div>

                        {/* Dynamic Slide Body */}
                        <div className="min-h-[320px] px-6 sm:px-8 py-2">
                            {slideIndex === 0 && (
                                <section className="space-y-5">
                                    <p className="max-w-3xl text-base font-bold leading-relaxed">{lesson.overview}</p>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
                                            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-600">// Objectives</h3>
                                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-bold">
                                                {lesson.objectives.map((objective) => (
                                                    <li key={objective}>{objective}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
                                            <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-600">// What you will learn</h3>
                                            <p className="mt-3 text-sm font-bold leading-relaxed">
                                                Work through each grammar point sequentially, then test your understanding with guided practice and quizzes.
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {slideIndex > 0 && slideIndex <= lesson.grammarPoints.length && (
                                <section className="space-y-4">
                                    {(() => {
                                        const point = lesson.grammarPoints[slideIndex - 1];
                                        return (
                                            <div key={point.pattern} className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_#000000]">
                                                <div className="border-b-2 border-black pb-3">
                                                    <span className="font-mono text-xs font-black uppercase text-neutral-500">// Pattern</span>
                                                    <h4 className="text-2xl font-black">{point.pattern} <span className="text-base font-bold text-neutral-600">| {point.meaning}</span></h4>
                                                </div>

                                                <div className="mt-3">
                                                    <span className="font-mono text-xs font-black uppercase text-neutral-500">// Formation</span>
                                                    <p className="mt-1 font-mono text-sm font-bold bg-neutral-100 p-2 border border-black/20">{point.formation}</p>
                                                </div>

                                                {point.usageNotes?.length > 0 && (
                                                    <div className="mt-4 border-l-4 border-[#70CFF8] pl-3">
                                                        <h5 className="font-mono text-xs font-black uppercase">// When to use it</h5>
                                                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold">
                                                            {point.usageNotes.map((note) => (
                                                                <li key={note}>{note}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                <div className="mt-4 space-y-2">
                                                    <span className="font-mono text-xs font-black uppercase text-neutral-500">// Examples</span>
                                                    {point.examples.map((example) => (
                                                        <div key={`${point.pattern}-${example.japanese}`} className="border-2 border-black bg-[#A3E636]/20 p-3 text-sm">
                                                            <p className="font-black text-base">{example.japanese}</p>
                                                            {example.furigana && <p className="font-mono text-xs text-neutral-600">{example.furigana}</p>}
                                                            <p className="font-mono text-xs text-neutral-600">{example.romaji}</p>
                                                            <p className="font-semibold text-neutral-800">{example.english}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </section>
                            )}

                            {slideIndex === lesson.grammarPoints.length + 1 && (
                                <section className="border-2 border-black bg-[#FF6B6B] p-5 shadow-[3px_3px_0px_0px_#000000]">
                                    <h3 className="font-mono text-xs font-black uppercase tracking-wider">// Common mistakes</h3>
                                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-bold">
                                        {lesson.commonMistakes.map((mistake) => (
                                            <li key={mistake}>{mistake}</li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                            {slideIndex === lesson.grammarPoints.length + 2 && (
                                <section className="space-y-4">
                                    <div className="border-2 border-black bg-white p-5 shadow-[3px_3px_0px_0px_#000000]">
                                        <h3 className="font-mono text-xs font-black uppercase tracking-wider text-neutral-600">// Review checklist</h3>
                                        <ul className="mt-3 space-y-2 text-sm font-bold">
                                            {lesson.reviewChecklist.map((item) => (
                                                <li key={item} className="flex items-center gap-2">
                                                    <input type="checkbox" className="h-4 w-4 rounded-none border-2 border-black accent-black" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    {lesson.guidedPractice?.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="font-mono text-xs font-black uppercase tracking-wider">// Guided practice</h3>
                                            {lesson.guidedPractice.map((item, index) => (
                                                <div key={`${item.prompt}-${index}`} className="border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_#000000]">
                                                    <p className="font-black">{index + 1}. {item.prompt}</p>
                                                    <p className="mt-2 text-sm font-bold"><span className="font-mono text-xs uppercase bg-black text-white px-1 py-0.5">Answer</span> {item.answer}</p>
                                                    <p className="mt-1 text-sm font-semibold text-neutral-600">{item.explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}
                        </div>

                        {/* Integrated Deck Bottom Navigation */}
                        <div className="mt-6 border-t-2 border-black bg-black/5 p-4 sm:p-6 flex flex-col gap-4">
                            {/* Slide Quick-Selector Tabs */}
                            <div className="flex flex-wrap gap-1.5" aria-label="Lesson slides">
                                {slideLabels.map((label, index) => (
                                    <button
                                        key={`${label}-${index}`}
                                        type="button"
                                        onClick={() => setSlideIndex(index)}
                                        className={`border-2 border-black px-2.5 py-1 font-mono text-[11px] font-black uppercase shadow-[2px_2px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${index === slideIndex
                                                ? 'bg-black text-[#FFDE59]'
                                                : 'bg-white text-black hover:bg-neutral-100'
                                            }`}
                                    >
                                        {index + 1}. {label}
                                    </button>
                                ))}
                            </div>

                            {/* Stepper Controls */}
                            <div className="flex items-center justify-between gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => moveSlide(-1)}
                                    disabled={slideIndex === 0}
                                    className="border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    ← Prev Slide
                                </button>
                                <button
                                    type="button"
                                    onClick={() => moveSlide(1)}
                                    disabled={slideIndex === slideLabels.length - 1}
                                    className="border-2 border-black bg-[#A3E636] px-5 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next Slide →
                                </button>
                            </div>
                        </div>
                    </article>

                    {/* Lesson-to-Lesson Global Footer Navigation */}
                    <div className="flex justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                moveLesson(-1);
                                setSlideIndex(0);
                            }}
                            disabled={selectedIndex === 0}
                            className="flex h-11 items-center gap-1.5 border-2 border-black bg-white px-4 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeftIcon className="h-4 w-4" /> Previous Lesson
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                moveLesson(1);
                                setSlideIndex(0);
                            }}
                            disabled={selectedIndex === lessons.length - 1}
                            className="flex h-11 items-center gap-1.5 border-2 border-black bg-[#70CFF8] px-4 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000000] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Next Lesson <ChevronRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default GrammarStudy;