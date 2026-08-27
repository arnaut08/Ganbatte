import { useEffect, useState } from 'react';
import { getKanaCards } from '../../services/api';
import type { ApiRecord } from '../../types';

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

type KanaMatrixProps = {
  matrix: KanaMatrixData;
  selectedCells: Set<string>;
  onToggleCell: (matrixId: string, cell: string) => void;
  onToggleRow: (matrixId: string, rowId: string) => void;
  onToggleColumn: (matrixId: string, columnIndex: number) => void;
  onToggleGroup: (matrixId: string) => void;
};

function KanaMatrix({
  matrix,
  selectedCells,
  onToggleCell,
  onToggleRow,
  onToggleColumn,
  onToggleGroup,
}: KanaMatrixProps) {
  const { id, name, script, type, columns, rows, extras } = matrix;
  const isHiragana = script === 'hiragana';
  const themeColor = isHiragana ? '#FFDE59' : '#70CFF8';

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

  return (
    <div className="flex flex-col border-2 border-black bg-[#1a1f2c] p-2.5 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
      {/* Matrix Top Header */}
      <div className="mb-2 sm:mb-4 flex items-center justify-between gap-2 sm:gap-3 border-b-2 border-black/40 pb-2 sm:pb-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <span
            className="shrink-0 border border-black bg-black px-1.5 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider"
            style={{ color: themeColor }}
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
          className={`shrink-0 whitespace-nowrap border-2 border-black px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[9px] sm:text-[10px] font-black uppercase transition-all shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${isGroupSelected
            ? 'bg-[#FF6B6B] text-black hover:bg-[#ff8585]'
            : 'bg-[#FFDE59] text-black hover:bg-[#ffe77f]'
            }`}
        >
          {isGroupSelected ? 'Clear' : 'Select'}
        </button>
      </div>

      {/* Matrix Grid */}
      <div className="w-full overflow-x-auto pb-0.5">
        <div
          className="grid gap-1 sm:gap-1.5 min-w-[200px]"
          style={{
            gridTemplateColumns: `24px repeat(${columns.length + (extras.length > 0 ? 1 : 0)}, minmax(0, 1fr))`,
          }}
        >
          {/* Top Left Blank Corner */}
          <div className="flex h-6 sm:h-8 items-center justify-center border-2 border-transparent" />

          {/* Vowel Column Triggers */}
          {columns.map((col, colIndex) => {
            const isColActive = isColumnSelected(colIndex);
            return (
              <button
                key={col}
                type="button"
                onClick={() => onToggleColumn(id, colIndex)}
                className={`flex h-6 sm:h-8 items-center justify-center border-2 border-black font-mono text-[9px] sm:text-xs font-black uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] ${isColActive
                  ? 'bg-[#A3E636] text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]'
                  : 'bg-[#252c3d] text-neutral-300 hover:bg-[#323b52] hover:text-white'
                  }`}
                title={`Toggle entire '${col}' column`}
              >
                {col}
              </button>
            );
          })}

          {extras.length > 0 && (
            <div className="flex h-6 sm:h-8 items-center justify-center border-2 border-dashed border-neutral-600 font-mono text-[9px] sm:text-xs font-bold text-neutral-500">
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
                  className={`flex h-7 sm:h-11 items-center justify-center border-2 border-black font-mono text-[9px] sm:text-xs font-black uppercase transition-all active:translate-x-[1px] active:translate-y-[1px] ${isRowActive
                    ? 'bg-[#A3E636] text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]'
                    : 'bg-[#252c3d] text-neutral-300 hover:bg-[#323b52] hover:text-white'
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
                        className="h-7 sm:h-11 border border-dashed border-neutral-700/40 bg-[#121620]"
                      />
                    );
                  }
                  const isSelected = selectedCells.has(cell);
                  return (
                    <button
                      key={`${row.id}-${colIndex}`}
                      type="button"
                      onClick={() => onToggleCell(id, cell)}
                      className={`kana-font flex h-7 sm:h-11 items-center justify-center border-2 border-black text-sm sm:text-xl font-black transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${isSelected
                        ? 'bg-[#A3E636] text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]'
                        : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                    >
                      {cell}
                    </button>
                  );
                })}

                {/* Extras Cell */}
                {extras.length > 0 && (
                  <div className="flex items-center justify-center">
                    {extras.map((extra) => {
                      const extraCell = extra.cells[0];
                      const isSelected = selectedCells.has(extraCell);
                      return (
                        <button
                          key={extra.id}
                          type="button"
                          onClick={() => onToggleCell(id, extraCell)}
                          className={`flex h-7 sm:h-11 w-full items-center justify-center border-2 border-black text-sm sm:text-xl font-black transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${isSelected
                            ? 'bg-[#A3E636] text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]'
                            : 'bg-white text-black hover:bg-neutral-100'
                            }`}
                        >
                          {extraCell}
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
  initialSelectedKana?: Iterable<string>;
};

function KanaFilterScreen({ onBack, onApplyFilters, initialSelectedKana }: KanaFilterScreenProps) {
  const [kanaData, setKanaData] = useState<KanaData>({ cards: [], groups: [], matrices: [] });
  const [selectedCells, setSelectedCells] = useState<Set<string>>(() => new Set(initialSelectedKana ?? []));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanaCards()
      .then((data) => {
        setKanaData({
          cards: Array.isArray(data?.cards) ? data.cards : [],
          groups: Array.isArray(data?.groups) ? data.groups : [],
          matrices: Array.isArray(data?.matrices) ? data.matrices as KanaMatrixData[] : [],
        });
      })
      .catch(() => setError('Unable to load Kana cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

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
    kanaData.matrices.forEach((matrix) => {
      matrix.rows.forEach((row) => row.cells.filter(Boolean).forEach((c) => allCells.add(c)));
      matrix.extras.forEach((extra) => extra.cells.filter(Boolean).forEach((c) => allCells.add(c)));
    });
    setSelectedCells(allCells);
  };

  return (
    <>
      <main className="container mx-auto max-w-6xl space-y-2.5 sm:space-y-4 px-3 py-3 pb-24 sm:px-4 sm:py-6 sm:pb-28">
        {/* Top Header Lockup & Controls */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              title="Back to Setup"
            >
              <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
            </button>
            <div>
              <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
            // STUDY SETUP: CHARACTER SELECTION
              </span>
              <h1 className="text-base sm:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Select Kana to Study
              </h1>
            </div>
          </div>

          {/* Compact Global Select/Clear Buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleSelectAll}
              className="border-2 border-black bg-[#A3E636] px-2.5 py-1 sm:px-4 sm:py-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="border-2 border-black bg-white px-2.5 py-1 sm:px-4 sm:py-2 font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-neutral-100 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Instructions / Tip Box */}
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 border-2 border-black bg-[#1a1f2c] p-2 sm:p-3 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
          <span className="font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFDE59] shrink-0">
        // TIP:
          </span>
          <p className="text-[10px] sm:text-sm font-semibold text-neutral-300 leading-snug sm:leading-relaxed">
            Click any <span className="font-bold text-white">Consonant (Row)</span> or{' '}
            <span className="font-bold text-white">Vowel (Column)</span> header to toggle whole lines, or click individual tiles.
          </p>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid gap-3.5 sm:gap-6 lg:grid-cols-2">
            <div className="h-64 sm:h-96 border-2 border-black bg-[#1a1f2c] animate-pulse" />
            <div className="h-64 sm:h-96 border-2 border-black bg-[#1a1f2c] animate-pulse" />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="border-2 border-black bg-[#FF6B6B] p-2.5 sm:p-4 font-mono text-xs sm:text-sm font-black uppercase text-black shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
            {error}
          </div>
        )}

        {/* 2-Column Matrix Grid */}
        {!isLoading && !error && (
          <div className="grid gap-3 sm:gap-6 lg:grid-cols-2">
            {kanaData.matrices.map((matrix) => (
              <KanaMatrix
                key={matrix.id}
                matrix={matrix}
                selectedCells={selectedCells}
                onToggleCell={toggleCell}
                onToggleRow={toggleRow}
                onToggleColumn={toggleColumn}
                onToggleGroup={toggleGroup}
              />
            ))}
          </div>
        )}
      </main>

      {/* Pinned Sticky Bottom Status & Action Bar */}
      <footer className="fixed -bottom-2 inset-x-0 z-50 border-t-2 border-black bg-[#1a1f2c] px-3 pt-2.5 pb-[calc(0.5rem+8px+env(safe-area-inset-bottom,0px))] shadow-[0px_-3px_0px_0px_#000000] sm:px-4 sm:pt-3 sm:pb-3 sm:bottom-0">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 sm:gap-4">
          <span className="border-2 border-black bg-[#FFDE59] px-2 py-1 sm:px-3.5 sm:py-1.5 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
            {selectedCells.size} SELECTED
          </span>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedCells.size === 0}
            className="border-2 border-black bg-[#A3E636] px-4 py-1.5 sm:px-7 sm:py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:bg-neutral-600 disabled:opacity-50 disabled:shadow-none"
          >
            Start Practice →
          </button>
        </div>
      </footer>
    </>
  );
}

export default KanaFilterScreen;