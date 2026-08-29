import { MagnifyingGlassIcon, TimerIcon } from '@radix-ui/react-icons';
import { Input } from '@/components/ui/input';

export type DeckCategory = 'all' | 'verbs' | 'adjectives' | 'nouns' | 'expressions';

type DeckFilterBarProps = {
  category: DeckCategory;
  search: string;
  dueCount: number;
  showDueOnly: boolean;
  onCategoryChange: (category: DeckCategory) => void;
  onSearchChange: (search: string) => void;
  onToggleDueOnly: () => void;
};

const categories: Array<{ value: DeckCategory; label: string }> = [
  { value: 'all', label: 'All Stages' },
  { value: 'verbs', label: 'Verbs' },
  { value: 'adjectives', label: 'Adjectives' },
  { value: 'nouns', label: 'Nouns' },
  { value: 'expressions', label: 'Expressions' },
];

export default function DeckFilterBar({
  category,
  search,
  dueCount,
  showDueOnly,
  onCategoryChange,
  onSearchChange,
  onToggleDueOnly,
}: DeckFilterBarProps) {
  return (
    <section className="border-2 border-black bg-[#1a1f2c] p-3 shadow-[4px_4px_0px_0px_#000] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Vocabulary categories">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={category === item.value && !showDueOnly}
              onClick={() => onCategoryChange(item.value)}
              className={`shrink-0 border-2 border-black px-2.5 py-2 font-mono text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:px-3 ${
                category === item.value && !showDueOnly
                  ? 'bg-[#FFDE59] text-black'
                  : 'bg-white text-black hover:bg-neutral-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1 sm:w-56">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search stage or theme..."
              aria-label="Search vocabulary stages or themes"
              className="h-10 pl-9 font-mono text-xs font-bold shadow-[2px_2px_0px_0px_#000]"
            />
          </label>
          <button
            type="button"
            onClick={onToggleDueOnly}
            className={`flex h-10 shrink-0 items-center justify-center gap-2 border-2 border-black px-3 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
              showDueOnly ? 'bg-[#FF6B6B]' : 'bg-[#A3E636] hover:bg-[#b5eb5b]'
            }`}
          >
            <TimerIcon className="h-4 w-4" aria-hidden="true" />
            {showDueOnly ? 'Showing Due' : 'Review Due'}
            <span className="flex min-w-5 items-center justify-center border-2 border-black bg-black px-1 py-0.5 text-[#A3E636]">
              {dueCount}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}