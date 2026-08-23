import { useEffect, useState } from 'react';
import { getKanaCards } from '../../services/api';
import { ChevronLeftIcon } from '@radix-ui/react-icons';

const MATRIX_TYPE_LABELS = {
  basic: 'BASIC',
  dakuten: 'DAKUTEN',
  handakuten: 'HANDAKUTEN',
  combined: 'COMBINED',
};

function KanaMatrix({
  matrix,
  selectedCells,
  onToggleCell,
  onToggleRow,
  onToggleColumn,
  onToggleGroup,
}) {
  const { id, name, script, type, columns, rows, extras } = matrix;
  const isHiragana = script === 'hiragana';
  const themeColor = isHiragana ? '#FFDE59' : '#70CFF8';

  const allCells = [
    ...rows.flatMap((row) => row.cells.filter(Boolean)),
    ...extras.flatMap((extra) => extra.cells.filter(Boolean)),
  ];
  const isGroupSelected =
    allCells.length > 0 && allCells.every((cell) => selectedCells.has(cell));

  const isRowSelected = (row) =>
    row.cells.some(Boolean) &&
    row.cells.every((cell) => !cell || selectedCells.has(cell));

  const isColumnSelected = (colIndex) => {
    const activeColCells = rows
      .map((row) => row.cells[colIndex])
      .filter(Boolean);
    return (
      activeColCells.length > 0 &&
      activeColCells.every((cell) => selectedCells.has(cell))
    );
  };

  return (
    <div className="flex flex-col border-2 border-black bg-[#1a1f2c] p-4 sm:p-5 shadow-[6px_6px_0px_0px_#000000]">
      {/* Matrix Top Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-black/40 pb-3">
        <div className="flex items-center gap-2">
          <span
            className="border-2 border-black bg-black px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider"
            style={{ color: themeColor }}
          >
            {MATRIX_TYPE_LABELS[type] || type}
          </span>
          <h3 className="text-lg font-black uppercase tracking-tight text-white">
            {name}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => onToggleGroup(id)}
          className={`border-2 border-black px-2.5 py-1 font-mono text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
            isGroupSelected
              ? 'bg-[#A3E636] text-black'
              : 'bg-white text-black hover:bg-neutral-100'
          }`}
        >
          {isGroupSelected ? '✓ Selected' : 'Select All'}
        </button>
      </div>

      {/* Matrix Grid */}
      <div className="w-full overflow-x-auto pb-1">
        <div
          className="grid gap-1.5 min-w-[280px]"
          style={{
            gridTemplateColumns: `36px repeat(${columns.length + (extras.length > 0 ? 1 : 0)}, minmax(0, 1fr))`,
          }}
        >
          {/* Top Left Corner */}
          <div className="flex h-8 items-center justify-center border-2 border-transparent" />

          {/* Vowel Column Triggers */}
          {columns.map((col, colIndex) => {
            const isColActive = isColumnSelected(colIndex);
            return (
              <button
                key={col}
                type="button"
                onClick={() => onToggleColumn(id, colIndex)}
                className={`flex h-8 items-center justify-center border-2 border-black font-mono text-xs font-black uppercase transition-all ${
                  isColActive
                    ? 'bg-[#A3E636] text-black shadow-[2px_2px_0px_0px_#000000]'
                    : 'bg-[#252c3d] text-neutral-300 hover:bg-[#323b52] hover:text-white'
                }`}
                title={`Select entire '${col}' column`}
              >
                {col}
              </button>
            );
          })}

          {extras.length > 0 && (
            <div className="flex h-8 items-center justify-center border-2 border-dashed border-black/30 font-mono text-xs font-bold text-neutral-500">
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
                  className={`flex h-11 items-center justify-center border-2 border-black font-mono text-xs font-black uppercase transition-all ${
                    isRowActive
                      ? 'bg-[#A3E636] text-black shadow-[2px_2px_0px_0px_#000000]'
                      : 'bg-[#252c3d] text-neutral-300 hover:bg-[#323b52] hover:text-white'
                  }`}
                  title={`Select entire '${row.label || 'V'}' row`}
                >
                  {row.label || 'V'}
                </button>

                {/* Character Cells */}
                {row.cells.map((cell, colIndex) => {
                  if (!cell) {
                    return (
                      <div
                        key={`${row.id}-${colIndex}`}
                        className="h-11 rounded-none border border-dashed border-black/20 bg-[#121620]"
                      />
                    );
                  }
                  const isSelected = selectedCells.has(cell);
                  return (
                    <button
                      key={`${row.id}-${colIndex}`}
                      type="button"
                      onClick={() => onToggleCell(id, cell)}
                      className={`kana-font flex h-11 items-center justify-center border-2 border-black text-xl font-black transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                        isSelected
                          ? 'bg-[#A3E636] text-black shadow-[2px_2px_0px_0px_#000000]'
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
                          className={`kana-font flex h-11 w-full items-center justify-center border-2 border-black text-xl font-black transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none ${
                            isSelected
                              ? 'bg-[#A3E636] text-black shadow-[2px_2px_0px_0px_#000000]'
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

function KanaFilterScreen({ onBack, onApplyFilters, initialSelectedKana }) {
  const [kanaData, setKanaData] = useState({ cards: [], groups: [], matrices: [] });
  const [selectedCells, setSelectedCells] = useState(() => new Set(initialSelectedKana || []));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getKanaCards()
      .then((data) => {
        setKanaData({
          cards: Array.isArray(data?.cards) ? data.cards : [],
          groups: Array.isArray(data?.groups) ? data.groups : [],
          matrices: Array.isArray(data?.matrices) ? data.matrices : [],
        });
      })
      .catch(() => setError('Unable to load Kana cards. Please try again.'))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleCell = (_matrixId, cell) => {
    setSelectedCells((current) => {
      const next = new Set(current);
      if (next.has(cell)) next.delete(cell);
      else next.add(cell);
      return next;
    });
  };

  const toggleRow = (matrixId, rowId) => {
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

  const toggleColumn = (matrixId, colIndex) => {
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

  const toggleGroup = (matrixId) => {
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
    const allCells = new Set();
    kanaData.matrices.forEach((matrix) => {
      matrix.rows.forEach((row) => row.cells.filter(Boolean).forEach((c) => allCells.add(c)));
      matrix.extras.forEach((extra) => extra.cells.filter(Boolean).forEach((c) => allCells.add(c)));
    });
    setSelectedCells(allCells);
  };

  return (
    <main className="container mx-auto max-w-6xl space-y-6 px-4 py-6 pb-28">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Back"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
              // SECTION: KANA MATRICES
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Select Kana to Study
            </h1>
          </div>
        </div>

        {/* Global Select/Clear Bar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="border-2 border-black bg-[#A3E636] px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="border-2 border-black bg-white px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000] transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-neutral-100"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* How it Works / Instructions Box */}
      <div className="border-2 border-black bg-[#1a1f2c] p-4 shadow-[4px_4px_0px_0px_#000000]">
        <div className="flex items-start gap-2.5">
          <span className="mt-1 h-2.5 w-2.5 shrink-0 bg-[#FFDE59]" />
          <p className="text-xs font-semibold text-neutral-300 leading-relaxed sm:text-sm">
            Click any <span className="font-bold text-white">Consonant</span> or <span className="font-bold text-white">Vowel</span> header to toggle whole lines, or click individual tiles to pick specific characters.
          </p>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 border-2 border-black bg-[#1a1f2c] animate-pulse" />
          <div className="h-96 border-2 border-black bg-[#1a1f2c] animate-pulse" />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="border-2 border-black bg-[#FF6B6B] p-4 font-mono text-sm font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000]">
          {error}
        </div>
      )}

      {/* 2-Column Matrix Grid */}
      {!isLoading && !error && (
        <div className="grid gap-6 lg:grid-cols-2">
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

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-black bg-[#1a1f2c]/95 p-4 backdrop-blur-sm">
        <div className="container mx-auto flex max-w-6xl items-center justify-between gap-4">
          <span className="border-2 border-black bg-[#FFDE59] px-3 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000000]">
            {selectedCells.size} KANA SELECTED
          </span>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedCells.size === 0}
            className="border-2 border-black bg-[#A3E636] px-6 py-2.5 font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000000] transition-all hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm"
          >
            Start Studying →
          </button>
        </div>
      </div>
    </main>
  );
}

export default KanaFilterScreen;