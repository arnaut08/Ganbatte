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
    <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-4 sm:shadow-[4px_4px_0px_0px_#000]">
      <div className="flex flex-col gap-2.5 sm:gap-3.5 lg:flex-row lg:items-center lg:justify-between">
        {/* HORIZONTALLY SCROLLABLE TABS (No Scrollbar, Touch Friendly) */}
        <div
          className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2 sm:pb-0"
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
                className={`shrink-0 border-2 border-black px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all sm:px-3.5 sm:py-2 sm:text-[11px] ${
                  isSelected
                    ? 'translate-x-[1px] translate-y-[1px] bg-[#FFDE59] text-black shadow-none ring-1 ring-black'
                    : 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* COMPACT SEARCH & DUE CONTROLS ROW */}
        <div className="flex items-center gap-2">
          {/* SEARCH INPUT */}
          <div className="relative min-w-0 flex-1">
            <MagnifyingGlassIcon
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-black sm:left-3.5 sm:h-4 sm:w-4"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search stage..."
              aria-label="Search vocabulary stages"
              className="h-9 w-full border-2 border-black bg-white pl-8 pr-7 font-mono text-[11px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] placeholder:text-neutral-400 placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-[#70CFF8] sm:h-10 sm:pl-10 sm:pr-8 sm:text-xs"
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-black hover:bg-neutral-200"
                aria-label="Clear search"
              >
                <Cross2Icon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* DUE BUTTON (Compact Badge on Mobile) */}
          <button
            type="button"
            onClick={onToggleDueOnly}
            className={`flex h-9 shrink-0 items-center justify-center gap-1.5 border-2 border-black px-2.5 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] transition-all sm:h-10 sm:gap-2 sm:px-3.5 sm:text-[11px] ${
              showDueOnly
                ? 'translate-x-[1px] translate-y-[1px] bg-[#FF6B6B] shadow-none ring-1 ring-black'
                : 'bg-[#A3E636] hover:bg-[#8fe01a]'
            } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
          >
            <TimerIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
            <span className="hidden xs:inline sm:inline">{showDueOnly ? 'Due' : 'Review'}</span>
            <span className="flex min-w-[18px] items-center justify-center border-2 border-black bg-black px-1 py-0.5 font-mono text-[9px] font-black text-[#A3E636] sm:min-w-[20px] sm:text-[10px]">
              {dueCount}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}