import { useEffect, useState } from 'react';
import { getKanjiGroup, reviewKanji } from '../../services/api';
import type { KanjiCard } from '../../types';
import KanjiStudyCard, { type KanjiRating, type KanjiStudyCardData } from './KanjiStudyCard';
import StudySkeleton from './StudySkeleton';

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
            setItems((current) => current.map((item) => item.id === reviewedCard.id ? { ...item, progress: result.progress } : item));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-7 sm:py-8"><StudySkeleton /></main>;
    if (error) return <main className="mx-auto max-w-3xl px-4 py-8"><div className="border-2 border-black bg-[#FF6B6B] p-5 text-center font-mono text-xs font-black uppercase text-black">{error}</div></main>;
    if (!card) return (
        <main className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:space-y-7 sm:py-8">
            <section className="border-2 border-black bg-[#A3E636] p-6 text-black shadow-[6px_6px_0px_#000] sm:p-10">
                <span className="font-mono text-xs font-black uppercase tracking-wider">{groupName} // Complete</span>
                <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-5xl">Group Complete</h1>
                <p className="mt-3 font-mono text-sm font-bold uppercase">{done} characters reviewed and saved.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    <button type="button" onClick={onBack} className="border-2 border-black bg-white px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000] hover:bg-neutral-100 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Return to Group Map</button>
                    <button type="button" onClick={onQuiz} className="border-2 border-black bg-[#70CFF8] px-4 py-3 font-mono text-xs font-black uppercase shadow-[3px_3px_0px_#000] hover:bg-[#8bd9fa] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">Take a Quiz</button>
                </div>
            </section>
        </main>
    );

    return (
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-6 sm:gap-7 sm:py-8">
            <header className="flex items-center gap-3"><button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center border-2 border-black bg-white font-black text-black shadow-[2px_2pxpx_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">&lt;</button><div><span className="font-mono text-[10px] font-black uppercase text-[#FFDE59]">KANJI GROUP // {groupName}</span><h1 className="text-2xl font-black uppercase text-white">Kanji Recall</h1></div></header>
            <section className="border-2 border-black bg-[#151922] p-3 shadow-[4px_4pxpx_0px_#000]"><div className="mb-2 flex justify-between font-mono text-[10px] font-black uppercase text-white"><span>{done} of {total} reviewed</span><span>{queue.length} remaining</span></div><div className="h-5 border-2 border-black bg-white"><div className="h-full bg-[#A3E636] transition-all" style={{ width: `${percent}%` }} /></div></section>
            <KanjiStudyCard key={`${card.id}-${cardTurn}`} card={card} groupName={groupName} position={done + 1} total={total} saving={saving} onRate={rate} />
        </main>
    );
}
