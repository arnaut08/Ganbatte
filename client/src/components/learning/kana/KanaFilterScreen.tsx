import { useEffect, useMemo, useState } from 'react';
import { getCharacterAttempts, getKanaCards } from '../../../services/api';
import type { ApiRecord } from '../../../types';
import KanaFilterSkeleton from './KanaFilterSkeleton';

const MATRIX_TYPE_LABELS = {
  basic: 'BASIC',
  dakuten: 'DAKUTEN',
  handakuten: 'HANDAKUTEN',
  combined: 'COMBINED',
};

type KanaRow = {
  id: string;
  label?: string;
  cells: string[];
};

type KanaExtra = {
  id: string;
  cells: string[];
};

type KanaMatrixData = {
  id: string;
  name: string;
  script: string;
  type: string;
  columns: string[];
  rows: KanaRow[];
  extras: KanaExtra[];
};

type KanaData = {
  cards: ApiRecord[];
  groups: ApiRecord[];
  matrices: KanaMatrixData[];
};

type KanaMastery = {
  correct_streak: number;
  total_attempts: number;
};

type KanaFilterTab = 'basic' | 'dakuten' | 'combined';

const KANA_TABS: Array<{ id: KanaFilterTab; label: string; count: number }> = [
  { id: 'basic', label: 'Basic', count: 46 },
  { id: 'dakuten', label: 'Dakuten / Handakuten', count: 25 },
  { id: 'combined', label: 'Combos / Yōon', count: 33 },
];

function matrixMatchesTab(matrix: KanaMatrixData, tab: KanaFilterTab): boolean {
  if (tab === 'basic') return matrix.type === 'basic';
  if (tab === 'dakuten') return matrix.type === 'dakuten' || matrix.type === 'handakuten';
  return matrix.type === 'combined';
}

/** Compact corner badge reflecting streak-based mastery for one tile. */
function MasteryCornerBadge({ streak, isKatakana }: { streak: number; isKatakana?: boolean }) {
  if (streak >= 3) {
    return (
      <span
        className="pointer-events-none absolute right-0.5 top-0.5 flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center border border-black bg-[#A3E636] font-mono text-[7px] sm:text-[8px] font-black leading-none text-black shadow-[0.5px_0.5px_0px_0px_#000]"
        title="Mastered (3+ streak)"
      >
        ✓
      </span>
    );
  }
  if (streak >= 1) {
    return (
      <span
        className={`pointer-events-none absolute right-1 top-1 h-1.5 w-1.5 rounded-full border border-black shadow-[0.5px_0.5px_0px_0px_#000] ${isKatakana ? 'bg-[#FB923C]' : 'bg-[#FFDE59]'
          }`}
        title={`Practicing (streak ${streak})`}
      />
    );
  }
  return null;
}

type KanaMatrixProps = {
  matrix: KanaMatrixData;
  selectedCells: Set<string>;
  masteryByCell: Record<string, KanaMastery>;
  onToggleCell: (matrixId: string, cell: string) => void;
  onToggleRow: (matrixId: string, rowId: string) => void;
  onToggleColumn: (matrixId: string, columnIndex: number) => void;
  onToggleGroup: (matrixId: string) => void;
};

function KanaMatrix({
  matrix,
  selectedCells,
  masteryByCell,
  onToggleCell,
  onToggleRow,
  onToggleColumn,
  onToggleGroup,
}: KanaMatrixProps) {
  const { id, name, script, type, columns, rows, extras } = matrix;
  const isHiragana = script === 'hiragana';
  // Katakana updated to Amber Orange #FB923C to prevent clashing with Kanji #70CFF8
  const themeColor = isHiragana ? '#FFDE59' : '#FB923C';

  const allCells = [
    ...rows.flatMap((row) => row.cells.filter(Boolean)),
    ...extras.flatMap((extra) => extra.cells.filter(Boolean)),
  ];

  const selectedCount = allCells.filter((cell) => selectedCells.has(cell)).length;
  const isGroupSelected = allCells.length > 0 && selectedCount === allCells.length;

  const isRowSelected = (row: KanaRow) =>
    row.cells.some(Boolean) &&
    row.cells.every((cell: string) => !cell || selectedCells.has(cell));

  const isColumnSelected = (colIndex: number) => {
    const activeColCells = rows
      .map((row) => row.cells[colIndex])
      .filter(Boolean);
    return (
      activeColCells.length > 0 &&
      activeColCells.every((cell) => selectedCells.has(cell))
    );
  };

  const tileClasses = (isSelected: boolean) =>
    `kana-font relative flex h-9 sm:h-12 items-center justify-center border-2 border-black font-black transition-all cursor-pointer select-none text-sm sm:text-xl ${isSelected
      ? isHiragana
        ? 'bg-[#FFDE59] text-black shadow-[2px_2px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
        : 'bg-[#FB923C] text-black shadow-[2px_2px_0px_0px_#000] translate-x-[-1px] translate-y-[-1px]'
      : 'bg-[#1f2637] text-white hover:bg-[#2a3449]'
    } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`;

  return (
    <div
      className="flex flex-col border-2 border-black bg-[#151922] p-2.5 sm:p-5 shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] border-l-8"
      style={{ borderLeftColor: themeColor }}
    >
      {/* Matrix Header */}
      <div className="mb-2 sm:mb-4 flex items-center justify-between gap-2 border-b-2 border-white/10 pb-2 sm:pb-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span
            className="shrink-0 border-2 border-black px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]"
            style={{ backgroundColor: themeColor }}
          >
            {MATRIX_TYPE_LABELS[type as keyof typeof MATRIX_TYPE_LABELS] || type}
          </span>
          <h3 className="truncate text-xs sm:text-base font-black uppercase tracking-tight text-white">
            {name}
          </h3>
          <span className="shrink-0 font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
            ({selectedCount}/{allCells.length})
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggleGroup(id)}
          className={`shrink-0 cursor-pointer border-2 border-black px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${isGroupSelected
              ? 'bg-[#FF6B6B] text-black'
              : 'bg-white text-black hover:bg-[#FFDE59]'
            }`}
        >
          {isGroupSelected ? 'Clear' : 'Select'}
        </button>
      </div>

      {/* Grid */}
      <div className="w-full overflow-x-auto pb-1">
        <div
          className="grid gap-1 sm:gap-1.5 min-w-[200px]"
          style={{
            gridTemplateColumns: `26px repeat(${columns.length + (extras.length > 0 ? 1 : 0)}, minmax(0, 1fr))`,
          }}
        >
          {/* Top Left Blank Corner */}
          <div className="flex h-7 sm:h-9 items-center justify-center" />

          {/* Vowel Column Triggers */}
          {columns.map((col, colIndex) => {
            const isColActive = isColumnSelected(colIndex);
            return (
              <button
                key={col}
                type="button"
                onClick={() => onToggleColumn(id, colIndex)}
                className={`flex h-7 sm:h-9 cursor-pointer items-center justify-center border-2 border-black font-mono text-[9px] sm:text-xs font-black uppercase transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] ${isColActive
                    ? 'bg-[#A3E636] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                    : 'bg-[#1f2637] text-neutral-400 hover:bg-[#283248] hover:text-white'
                  }`}
                title={`Toggle entire '${col}' column`}
              >
                {col}
              </button>
            );
          })}

          {extras.length > 0 && (
            <div className="flex h-7 sm:h-9 items-center justify-center border-2 border-dashed border-neutral-700 font-mono text-[9px] sm:text-xs font-bold text-neutral-500">
              +
            </div>
          )}

          {/* Rows & Character Buttons */}
          {rows.map((row) => {
            const isRowActive = isRowSelected(row);
            return (
              <div key={row.id} className="contents">
                {/* Consonant Row Trigger */}
                <button
                  type="button"
                  onClick={() => onToggleRow(id, row.id)}
                  className={`flex h-9 sm:h-12 cursor-pointer items-center justify-center border-2 border-black font-mono text-[9px] sm:text-xs font-black uppercase transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] ${isRowActive
                      ? 'bg-[#A3E636] text-black shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'bg-[#1f2637] text-neutral-400 hover:bg-[#283248] hover:text-white'
                    }`}
                  title={`Toggle entire '${row.label || 'V'}' row`}
                >
                  {row.label || 'V'}
                </button>

                {/* Character Cells */}
                {row.cells.map((cell, colIndex) => {
                  if (!cell) {
                    return (
                      <div
                        key={`${row.id}-${colIndex}`}
                        className="h-9 sm:h-12 border border-dashed border-neutral-800 bg-[#0d1117]/60"
                      />
                    );
                  }
                  const isSelected = selectedCells.has(cell);
                  const streak = Number(masteryByCell[cell]?.correct_streak ?? 0);
                  return (
                    <button
                      key={`${row.id}-${colIndex}`}
                      type="button"
                      onClick={() => onToggleCell(id, cell)}
                      className={tileClasses(isSelected)}
                      title={streak >= 3 ? `${cell} – mastered` : `${cell} – streak ${streak}`}
                    >
                      {cell}
                      <MasteryCornerBadge streak={streak} isKatakana={!isHiragana} />
                    </button>
                  );
                })}

                {/* Extras Cell */}
                {extras.length > 0 && (
                  <div className="flex items-center justify-center">
                    {extras.map((extra) => {
                      const extraCell = extra.cells[0];
                      const isSelected = selectedCells.has(extraCell);
                      const streak = Number(masteryByCell[extraCell]?.correct_streak ?? 0);
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() => onToggleCell(id, extraCell)}
                          className={`w-full ${tileClasses(isSelected)}`}
                          title={streak >= 3 ? `${extraCell} – mastered` : `${extraCell} – streak ${streak}`}
                        >
                          {extraCell}
                          <MasteryCornerBadge streak={streak} isKatakana={!isHiragana} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type KanaFilterScreenProps = {
  onBack: () => void;
  onApplyFilters: (selectedCells: Set<string>) => void;
  onSelectionChange?: (selectedCells: Set<string>) => void;
  initialSelectedKana?: Iterable<string>;
};

const EMPTY_MASTERY: Record<string, KanaMastery> = {};

function KanaFilterScreen({ onBack, onApplyFilters, onSelectionChange, initialSelectedKana }: KanaFilterScreenProps) {
  const [kanaData, setKanaData] = useState<KanaData>({ cards: [], groups: [], matrices: [] });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(() => new Set(initialSelectedKana ?? []));
  const [masteryByCell, setMasteryByCell] = useState<Record<string, KanaMastery>>(EMPTY_MASTERY);
  const [activeTab, setActiveTab] = useState<KanaFilterTab>('basic');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!onSelectionChange) return;
    const initial = new Set(initialSelectedKana ?? []);
    const hasChanged =
      selectedCells.size !== initial.size ||
      [...selectedCells].some((cell) => !initial.has(cell));
    if (hasChanged) onSelectionChange(new Set(selectedCells));
  }, [selectedCells, onSelectionChange, initialSelectedKana]);

  useEffect(() => {
    Promise.all([getKanaCards(), getCharacterAttempts('kana')])
      .then(([cardsData, attemptsData]) => {
        setKanaData({
          cards: Array.isArray(cardsData?.cards) ? cardsData.cards : [],
          groups: Array.isArray(cardsData?.groups) ? cardsData.groups : [],
          matrices: Array.isArray(cardsData?.matrices) ? (cardsData.matrices as KanaMatrixData[]) : [],
        });
        const mastery: Record<string, KanaMastery> = {};
        ((attemptsData?.attempts as unknown[]) || []).forEach((item) => {
          const attempt = item as { character?: string; correct_streak?: number; total_attempts?: number };
          if (!attempt.character) return;
          mastery[attempt.character] = {
            correct_streak: Number(attempt.correct_streak ?? 0),
            total_attempts: Number(attempt.total_attempts ?? 0),
          };
        });
        setMasteryByCell(mastery);
      })
      .catch(() => setError('Unable to load Kana cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleMatrices = useMemo(
    () => kanaData.matrices.filter((matrix) => matrixMatchesTab(matrix, activeTab)),
    [activeTab, kanaData.matrices]
  );

  const basicCellsByScript = useMemo(() => {
    const map: Record<string, Set<string>> = { hiragana: new Set(), katakana: new Set() };
    kanaData.matrices
      .filter((matrix) => matrix.type === 'basic')
      .forEach((matrix) =>
        matrix.rows.forEach((row) =>
          row.cells.forEach((cell) => {
            if (cell) map[matrix.script]?.add(cell);
          })
        )
      );
    return map;
  }, [kanaData.matrices]);

  const masteredCounts = useMemo(() => {
    const count = (script: 'hiragana' | 'katakana') =>
      [...(basicCellsByScript[script] ?? [])].filter(
        (cell) => Number(masteryByCell[cell]?.correct_streak ?? 0) >= 3
      ).length;
    return { hiragana: count('hiragana'), katakana: count('katakana') };
  }, [basicCellsByScript, masteryByCell]);

  const toggleCell = (_matrixId: string, cell: string) => {
    setSelectedCells((current) => {
      const next = new Set(current);
      if (next.has(cell)) next.delete(cell);
      else next.add(cell);
      return next;
    });
  };

  const toggleRow = (matrixId: string, rowId: string) => {
    const matrix = kanaData.matrices.find((m) => m.id === matrixId);
    if (!matrix) return;
    const row = matrix.rows.find((r) => r.id === rowId);
    if (!row) return;

    const rowCells = row.cells.filter(Boolean);
    const allSelected = rowCells.every((cell) => selectedCells.has(cell));

    setSelectedCells((current) => {
      const next = new Set(current);
      rowCells.forEach((cell) => (allSelected ? next.delete(cell) : next.add(cell)));
      return next;
    });
  };

  const toggleColumn = (matrixId: string, colIndex: number) => {
    const matrix = kanaData.matrices.find((m) => m.id === matrixId);
    if (!matrix) return;

    const colCells = matrix.rows.map((row) => row.cells[colIndex]).filter(Boolean);
    const allSelected = colCells.every((cell) => selectedCells.has(cell));

    setSelectedCells((current) => {
      const next = new Set(current);
      colCells.forEach((cell) => (allSelected ? next.delete(cell) : next.add(cell)));
      return next;
    });
  };

  const toggleGroup = (matrixId: string) => {
    const matrix = kanaData.matrices.find((m) => m.id === matrixId);
    if (!matrix) return;

    const groupCells = [
      ...matrix.rows.flatMap((row) => row.cells.filter(Boolean)),
      ...matrix.extras.flatMap((extra) => extra.cells.filter(Boolean)),
    ];
    const allSelected = groupCells.length > 0 && groupCells.every((cell) => selectedCells.has(cell));

    setSelectedCells((current) => {
      const next = new Set(current);
      groupCells.forEach((cell) => (allSelected ? next.delete(cell) : next.add(cell)));
      return next;
    });
  };

  const handleApply = () => {
    if (onApplyFilters) onApplyFilters(selectedCells);
  };

  const handleClearAll = () => setSelectedCells(new Set());

  const handleSelectAll = () => {
    const allCells = new Set<string>();
    visibleMatrices.forEach((matrix) => {
      matrix.rows.forEach((row) => row.cells.filter(Boolean).forEach((c) => allCells.add(c)));
      matrix.extras.forEach((extra) => extra.cells.filter(Boolean).forEach((c) => allCells.add(c)));
    });
    setSelectedCells(allCells);
  };

  return (
    <>
      <main className="mx-auto w-full max-w-6xl space-y-3 px-3 py-4 pb-24 sm:space-y-4 sm:px-4 sm:py-6 sm:pb-28">
        {/* Top Header */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5 sm:gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000]"
              title="Back to Setup"
            >
              <span className="font-mono text-base font-black sm:text-lg">&lt;</span>
            </button>
            <div className="min-w-0">
              <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#FFDE59] sm:text-xs">
                // STUDY SETUP: CHARACTER SELECTION
              </span>
              <h1 className="text-lg font-black uppercase leading-tight tracking-tight text-white sm:text-3xl">
                Select Kana to Study
              </h1>
            </div>
          </div>

          {/* Action & Mastery Bar */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="border-2 border-black bg-[#151922] border-l-4 border-l-[#FFDE59] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[10px]">
              Hiragana <strong className="text-[#FFDE59]">{masteredCounts.hiragana}</strong>/{basicCellsByScript.hiragana?.size ?? 0}
            </span>
            <span className="border-2 border-black bg-[#151922] border-l-4 border-l-[#FB923C] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white shadow-[1.5px_1.5px_0px_0px_#000] sm:px-2.5 sm:py-1 sm:text-[10px]">
              Katakana <strong className="text-[#FB923C]">{masteredCounts.katakana}</strong>/{basicCellsByScript.katakana?.size ?? 0}
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="cursor-pointer border-2 border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-3 sm:py-1 sm:text-xs"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="cursor-pointer border-2 border-black bg-white px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#FF6B6B] hover:shadow-[0.5px_0.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-3 sm:py-1 sm:text-xs"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {KANA_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-wider transition-all sm:px-3.5 sm:py-1.5 sm:text-xs hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${isActive
                    ? 'bg-[#FFDE59] text-black shadow-[2px_2px_0px_0px_#000]'
                    : 'bg-[#151922] text-neutral-300 shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#1f2637] hover:text-white'
                  }`}
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Instructions / Tip Box */}
        <div className="flex items-start sm:items-center gap-2 border-2 border-black bg-[#151922] p-2.5 shadow-[2.5px_2.5px_0px_0px_#000] sm:p-3 sm:shadow-[3px_3px_0px_0px_#000]">
          <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#FFDE59] shrink-0 sm:text-xs">
            // TIP:
          </span>
          <p className="text-[10px] font-semibold leading-tight text-neutral-300 sm:text-xs sm:leading-relaxed">
            Click any <span className="font-bold text-white">Consonant (Row)</span> or{' '}
            <span className="font-bold text-white">Vowel (Column)</span> header to toggle whole lines, or click individual tiles.
          </p>
        </div>

        {/* Loading Skeleton */}
        {isLoading && <KanaFilterSkeleton />}

        {/* Error Banner */}
        {error && (
          <div className="border-2 border-black bg-[#FF6B6B] p-3 font-mono text-xs font-black uppercase text-black shadow-[3px_3px_0px_0px_#000] sm:text-sm">
            {error}
          </div>
        )}

        {/* 2-Column Matrix Grid */}
        {!isLoading && !error && (
          <div className="grid gap-3.5 sm:gap-6 lg:grid-cols-2">
            {visibleMatrices.map((matrix) => (
              <KanaMatrix
                key={matrix.id}
                matrix={matrix}
                selectedCells={selectedCells}
                masteryByCell={masteryByCell}
                onToggleCell={toggleCell}
                onToggleRow={toggleRow}
                onToggleColumn={toggleColumn}
                onToggleGroup={toggleGroup}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Bottom Status & Action Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-50 border-t-2 border-black bg-[#151922] px-3 py-2.5 shadow-[0px_-3px_0px_0px_#000000] sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <span className="border-2 border-black bg-[#FFDE59] px-2.5 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-3.5 sm:py-1.5 sm:text-xs">
            {selectedCells.size} SELECTED
          </span>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedCells.size === 0}
            className="cursor-pointer border-2 border-black bg-white px-4 py-1.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#A3E636] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-500 disabled:opacity-50 disabled:shadow-none sm:px-6 sm:py-2 sm:text-sm sm:shadow-[3px_3px_0px_0px_#000]"
          >
            Start Practice →
          </button>
        </div>
      </footer>
    </>
  );
}

export default KanaFilterScreen;