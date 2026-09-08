import { useEffect, useState } from 'react';
import { getKanjiGroup, reviewKanji } from '../../../services/api';
import KanjiStudyCard, { type KanjiRating, type KanjiStudyCardData } from './KanjiStudyCard';
import StudySkeleton from '../StudySkeleton';

type Props = { groupId: string; groupName: string; onBack: () => void; onQuiz: () => void };

export default function KanjiStudySession({ groupId, groupName, onBack, onQuiz }: Props) {
    const [items, setItems] = useState<KanjiStudyCardData[]>([]);
    const [queue, setQueue] = useState<KanjiStudyCardData[]>([]);
    const [cardTurn, setCardTurn] = useState(0);
    const [done, setDone] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getKanjiGroup(groupId)
            .then((data) => {
                const cards = (data.items || []).filter((item): item is KanjiStudyCardData => Boolean(item.id));
                setItems(cards);
                setQueue(cards);
            })
            .catch(() => setError('Unable to load this Kanji group.'))
            .finally(() => setLoading(false));
    }, [groupId]);

    const card = queue[0];
    const total = items.length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    const rate = async (rating: KanjiRating) => {
        if (!card || saving) return;
        setSaving(true);
        const reviewedCard = card;

        setQueue((current) => {
            const rest = current.slice(1);
            return rating === 1 ? [...rest, reviewedCard] : rest;
        });
        setCardTurn((current) => current + 1);
        if (rating !== 1) setDone((value) => value + 1);

        try {
            const result = await reviewKanji(reviewedCard.id, rating);
            setItems((current) =>
                current.map((item) => (item.id === reviewedCard.id ? { ...item, progress: result.progress } : item))
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <StudySkeleton deck="kanji" />;
    }

    if (error) {
        return (
            <main className="mx-auto max-w-3xl px-3 py-6 sm:px-4 sm:py-8">
                <div className="border-2 border-black bg-[#FF6B6B] p-4 text-center font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000]">
                    {error}
                </div>
            </main>
        );
    }

    if (!card) {
        return (
            <main className="mx-auto w-full max-w-3xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-4 sm:py-8">
                <section className="border-2 border-black border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-5 text-white shadow-[4px_4px_0px_0px_#000] sm:p-8 sm:shadow-[6px_6px_0px_0px_#000]">
                    <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#70CFF8] sm:text-xs">
                        {groupName} // COMPLETE
                    </span>
                    <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-white sm:text-4xl">
                        Group Complete
                    </h1>
                    <p className="mt-2 font-mono text-xs font-bold uppercase text-neutral-300 sm:text-sm">
                        {done} characters reviewed and saved.
                    </p>
                    <div className="mt-6 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onBack}
                            className="cursor-pointer border-2 border-black bg-white px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
                        >
                            Return to Group Map
                        </button>
                        <button
                            type="button"
                            onClick={onQuiz}
                            className="cursor-pointer border-2 border-black bg-[#70CFF8] px-4 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:py-3"
                        >
                            Take a Quiz →
                        </button>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-3.5 px-3 py-4 sm:gap-5 sm:px-4 sm:py-6 sm:pb-28">
            {/* Header */}
            <header className="flex items-center gap-2.5 sm:gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
                    title="Back to Kanji Group Map"
                    aria-label="Back to Kanji Group Map"
                >
                    <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
                </button>
                <div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#70CFF8] sm:text-xs">
                        KANJI GROUP // {groupName}
                    </span>
                    <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-2xl">
                        Kanji Recall
                    </h1>
                </div>
            </header>

            {/* Progress Track */}
            <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3">
                <div className="mb-1.5 flex justify-between font-mono text-[9px] font-black uppercase text-neutral-300 sm:text-[10px]">
                    <span>{done} OF {total} REVIEWED</span>
                    <span className="text-[#70CFF8]">{queue.length} REMAINING</span>
                </div>
                <div className="h-4 overflow-hidden border-2 border-black bg-[#1f2637] shadow-[1px_1px_0px_0px_#000] sm:h-4.5">
                    <div
                        className="h-full bg-[#70CFF8] transition-all duration-300"
                        style={{ width: `${percent}%` }}
                    />
                </div>
            </section>

            {/* Study Card */}
            <KanjiStudyCard
                key={`${card.id}-${cardTurn}`}
                card={card}
                groupName={groupName}
                position={done + 1}
                total={total}
                saving={saving}
                onRate={rate}
            />
        </main>
    );
}