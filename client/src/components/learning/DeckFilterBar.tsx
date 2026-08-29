import { MagnifyingGlassIcon, TimerIcon, Cross2Icon } from '@radix-ui/react-icons';

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
    <section className="border-2 border-black bg-[#151922] p-3 shadow-[4px_4px_0px_0px_#000] sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* CATEGORY TABS */}
        <div
          className="flex flex-nowrap gap-2 overflow-x-auto py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Vocabulary categories"
        >
          {categories.map((item) => {
            const isSelected = category === item.value && !showDueOnly;
            return (
              <button
                key={item.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onCategoryChange(item.value)}
                className={`shrink-0 cursor-pointer border-2 border-black px-3.5 py-2 font-mono text-[11px] font-black uppercase tracking-wider transition-all duration-100 ${
                  isSelected
                    ? 'translate-x-[2px] translate-y-[2px] bg-[#FFDE59] text-black shadow-none ring-2 ring-black'
                    : 'bg-white text-black shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#FFF7D6] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* CONTROLS (SEARCH & DUE TOGGLE) */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {/* SEARCH INPUT */}
          <div className="relative min-w-0 flex-1 sm:w-64">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-black"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search stage or theme..."
              aria-label="Search vocabulary stages or themes"
              className="h-10 w-full border-2 border-black bg-white pl-10 pr-8 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] placeholder:text-neutral-400 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#70CFF8]"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-black hover:bg-neutral-200"
                aria-label="Clear search"
              >
                <Cross2Icon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* REVIEW DUE BUTTON */}
          <button
            type="button"
            onClick={onToggleDueOnly}
            className={`flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 border-2 border-black px-3.5 font-mono text-[11px] font-black uppercase tracking-wider text-black transition-all duration-100 ${
              showDueOnly
                ? 'translate-x-[2px] translate-y-[2px] bg-[#FF6B6B] shadow-none ring-2 ring-black'
                : 'bg-[#A3E636] shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-[#bbf453] hover:shadow-[4px_4px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
            }`}
          >
            <TimerIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{showDueOnly ? 'Showing Due' : 'Review Due'}</span>
            <span className="flex min-w-[20px] items-center justify-center border-2 border-black bg-black px-1.5 py-0.5 font-mono text-[10px] font-black text-[#A3E636]">
              {dueCount}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}