import type { MinefieldTile } from '../../types/room';

export type MinefieldGridProps = {
  tiles: MinefieldTile[];
  onTileClick: (id: string) => void;
  disabled: boolean;
};

function getTileStatusClasses(status: MinefieldTile['status']): string {
  switch (status) {
    case 'verifying':
      return 'bg-[#FFDE59] text-black animate-pulse pointer-events-none translate-x-[2px] translate-y-[2px] shadow-none';
    case 'claimed-host':
      return 'bg-[#70CFF8] text-black pointer-events-none translate-x-[2px] translate-y-[2px] shadow-none';
    case 'claimed-guest':
      return 'bg-[#A3E636] text-black pointer-events-none translate-x-[2px] translate-y-[2px] shadow-none';
    case 'exploded':
      return 'bg-[#FF6B6B] text-black pointer-events-none translate-x-[2px] translate-y-[2px] shadow-none';
    case 'idle':
      return 'bg-[#151922] text-white hover:bg-[#283248] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none';
  }
}

export function MinefieldGrid({ tiles, onTileClick, disabled }: MinefieldGridProps) {
  return (
    <div className="w-full max-w-md mx-auto grid grid-cols-4 gap-2 sm:gap-3">
      {tiles.map((tile) => {
        const tileDisabled = disabled || tile.status !== 'idle';

        return (
          <button
            key={tile.id}
            type="button"
            disabled={tileDisabled}
            onClick={() => {
              if (!tileDisabled) onTileClick(tile.id);
            }}
            className={`aspect-square flex items-center justify-center border-2 border-black font-mono text-sm sm:text-lg font-black uppercase tracking-wider transition-colors shadow-[2px_2px_0px_0px_#000] ${getTileStatusClasses(tile.status)}`}
          >
            {tile.text}
          </button>
        );
      })}
    </div>
  );
}

export default MinefieldGrid;
