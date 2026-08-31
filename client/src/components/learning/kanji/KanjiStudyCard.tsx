import { useEffect, useState } from 'react';
import {
  CheckCircledIcon,
  ExclamationTriangleIcon,
  LightningBoltIcon,
  ThickArrowRightIcon,
} from '@radix-ui/react-icons';
import type { KanjiCard } from '../../../types';

export type KanjiStudyCardData = KanjiCard & { id: string; reading?: string; meaning?: string; example?: [string, string] };
export type KanjiRating = 1 | 2 | 3 | 4;

type Props = {
  card: KanjiStudyCardData;
  groupName: string;
  position: number;
  total: number;
  saving: boolean;
  onRate: (rating: KanjiRating) => void;
};

const ratings: Array<{ value: KanjiRating; label: string; icon: typeof ExclamationTriangleIcon; className: string }> = [
  { value: 1, label: 'Again', icon: ExclamationTriangleIcon, className: 'bg-[#FF6B6B] hover:bg-[#ff8585]' },
  { value: 2, label: 'Hard', icon: LightningBoltIcon, className: 'bg-[#FFDE59] hover:bg-[#ffe77f]' },
  { value: 3, label: 'Good', icon: CheckCircledIcon, className: 'bg-[#70CFF8] hover:bg-[#8bd9fa]' },
  { value: 4, label: 'Easy', icon: ThickArrowRightIcon, className: 'bg-[#A3E636] hover:bg-[#b5eb5b]' },
];

export default function KanjiStudyCard({ card, groupName, position, total, saving, onRate }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setRevealed(false);
  }, [card.kanji, card.reading]);

  return (
    <div className="grid w-full grid-cols-1 [perspective:1200px]">
      <section style={{ gridArea: '1 / 1' }} className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#FFDE59] p-4 text-black shadow-[6px_6px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 ${revealed ? 'pointer-events-none opacity-0 [transform:rotateY(180deg)]' : 'z-10 opacity-100 [transform:rotateY(0deg)]'}`}>
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3"><span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#000]">{groupName}</span><span className="font-mono text-[10px] font-black uppercase">{position} / {total}</span></div>
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center"><span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-black/60">RECALL THE READING + MEANING</span><h2 className="jp-font mt-5 text-8xl font-black leading-none sm:text-[10rem]">{card.kanji}</h2></div>
        <button type="button" onClick={() => setRevealed(true)} className="w-full border-2 border-black bg-black py-3 font-mono text-xs font-black uppercase tracking-wider text-white shadow-[2px_2px_0px_#000]">Reveal answer →</button>
      </section>

      <section style={{ gridArea: '1 / 1' }} className={`flex min-h-[460px] w-full flex-col justify-between border-2 border-black bg-[#70CFF8] p-4 text-black shadow-[6px_6px_0px_#000] transition-all duration-500 ease-in-out [backface-visibility:hidden] sm:min-h-[500px] sm:p-6 ${!revealed ? 'pointer-events-none opacity-0 [transform:rotateY(-180deg)]' : 'z-10 opacity-100 [transform:rotateY(0deg)]'}`}>
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-3"><span className="font-mono text-[10px] font-black uppercase">ANSWER // {groupName}</span><span className="font-mono text-[10px] font-black uppercase">{position} / {total}</span></div>
        <div className="my-auto grid gap-3 text-left sm:grid-cols-2"><div className="border-2 border-black bg-white p-3 shadow-[2px_2pxpx_#000]"><span className="font-mono text-[9px] font-black uppercase text-neutral-500">READING</span><p className="jp-font mt-1 text-xl font-black">{card.reading}</p><p className="font-mono text-xs font-bold uppercase text-neutral-600">{card.romaji}</p></div><div className="border-2 border-black bg-white p-3 shadow-[2px_2pxpx_#000]"><span className="font-mono text-[9px] font-black uppercase text-neutral-500">MEANING</span><p className="mt-1 text-xl font-black">{card.meaning}</p></div>{card.example && <div className="border-2 border-black bg-white p-3 shadow-[2px_2pxpx_#000] sm:col-span-2"><span className="font-mono text-[9px] font-black uppercase text-neutral-500">EXAMPLE</span><p className="jp-font mt-1 text-sm font-bold">{card.example[0]}</p><p className="mt-1 font-mono text-xs font-bold text-neutral-600">{card.example[1]}</p></div>}</div>
        <div className="border-t-2 border-black pt-3"><span className="mb-2 block font-mono text-[9px] font-black uppercase">RATE THIS RECALL</span><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{ratings.map((rating) => { const Icon = rating.icon; return <button key={rating.value} type="button" disabled={saving} onClick={() => onRate(rating.value)} className={`flex h-9 items-center justify-center gap-1 border-2 border-black font-mono text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#000] disabled:opacity-50 ${rating.className}`}><Icon className="h-3 w-3" /><span>{rating.label}</span></button>; })}</div></div>
      </section>
    </div>
  );
}
