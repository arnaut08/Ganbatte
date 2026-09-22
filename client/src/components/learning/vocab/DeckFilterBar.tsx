import { MagnifyingGlassIcon, TimerIcon, Cross2Icon } from '@radix-ui/react-icons';

export type DeckCategory = 'all' | 'verbs' | 'adjectives' | 'nouns' | 'expressions';

type DeckFilterBarProps = {
  accent: 'vocab' | 'kanji';
  category?: DeckCategory;
  search: string;
  dueCount: number;
  showDueOnly: boolean;
  placeholder: string;
  searchAriaLabel: string;
  onCategoryChange?: (category: DeckCategory) => void;
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
  accent,
  category,
  search,
  dueCount,
  showDueOnly,
  placeholder,
  searchAriaLabel,
  onCategoryChange,
  onSearchChange,
  onToggleDueOnly,
}: DeckFilterBarProps) {
  const showCategories = accent === 'vocab';
  const tabs = showCategories ? (
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
            onClick={() => onCategoryChange?.(item.value)}
            className={`shrink-0 cursor-pointer border-2 border-black px-2.5 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all sm:px-3.5 sm:py-2 sm:text-[11px] ${isSelected
                ? 'translate-x-[1px] translate-y-[1px] bg-[#A3E636] text-black shadow-none ring-1 ring-black'
                : 'bg-[#1f2637] text-neutral-300 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#283248] hover:text-white'
              } active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  ) : null;

  const searchControl = (
    <div className="relative min-w-0 flex-1 sm:flex-none sm:w-1/2">
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 sm:left-3.5 sm:h-4 sm:w-4"
        aria-hidden="true"
      />
      <input
        type="text"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        aria-label={searchAriaLabel}
        className={`h-9 w-full flex-1 border-2 border-black bg-[#1f2637] pl-8 pr-7 font-mono text-[11px] font-black uppercase text-white shadow-[2px_2px_0px_0px_#000] placeholder:text-neutral-500 placeholder:normal-case focus:outline-none sm:h-10 sm:pl-10 sm:pr-8 sm:text-xs ${showCategories ? 'focus:border-[#A3E636]' : 'focus:border-[#70CFF8]'
          }`}
      />
      {search.length > 0 && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white"
          aria-label="Clear search"
        >
          <Cross2Icon className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const reviewButton = (
    <button
      type="button"
      onClick={onToggleDueOnly}
      className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 border-2 border-black px-2.5 font-mono text-[10px] font-black uppercase tracking-wider transition-all sm:h-10 sm:gap-2 sm:px-3.5 sm:text-[11px] ${showDueOnly
          ? showCategories
            ? 'translate-x-[1px] translate-y-[1px] bg-[#FF6B6B] text-black shadow-none ring-1 ring-black'
            : 'bg-[#FF6B6B] text-black shadow-[1px_1px_0px_0px_#000] translate-x-[1px] translate-y-[1px]'
          : showCategories
            ? 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[1px_1px_0px_0px_#000]'
            : 'bg-white text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#70CFF8] hover:shadow-[1px_1px_0px_0px_#000]'
        } active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`}
    >
      <TimerIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true" />
      <span className="hidden xs:inline sm:inline">{showDueOnly ? 'Due' : 'Review'}</span>
      <span className="flex min-w-[18px] items-center justify-center border-2 border-black bg-black px-1 py-0.5 font-mono text-[9px] font-black text-white sm:min-w-[20px] sm:text-[10px]">
        {dueCount}
      </span>
    </button>
  );

  return (
    <section className="border-2 border-black bg-[#151922] p-2.5 shadow-[3px_3px_0px_0px_#000] sm:p-3 sm:shadow-[4px_4px_0px_0px_#000]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {tabs}
        <div className="flex w-full min-w-0 items-center gap-4 md:w-auto">
          {searchControl}
          {reviewButton}
        </div>
      </div>
    </section>
  );
}