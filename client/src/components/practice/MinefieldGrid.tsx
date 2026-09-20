import type { MinefieldTile } from '../../types/room';

export type MinefieldGridProps = {
  tiles: MinefieldTile[];
  onTileClick: (id: string) => void;
  disabled: boolean;
};

// Converted generic flat buttons into 3D tactile arcade keys
function getTileStatusClasses(status: MinefieldTile['status']): string {
  switch (status) {
    case 'verifying':
      return 'bg-[#FFDE59] text-black border-b-2 translate-y-[4px] animate-pulse pointer-events-none';
    case 'claimed-host':
      return 'bg-[#70CFF8] text-black border-b-2 translate-y-[4px] pointer-events-none';
    case 'claimed-guest':
      return 'bg-[#A3E636] text-black border-b-2 translate-y-[4px] pointer-events-none';
    case 'exploded':
      return 'bg-[#FF6B6B] text-black border-b-2 translate-y-[4px] pointer-events-none';
    case 'idle':
      return 'bg-[#151922] text-white border-b-[6px] hover:bg-[#283248] hover:border-b-[4px] hover:translate-y-[2px] active:border-b-2 active:translate-y-[4px] cursor-pointer';
  }
}

export function MinefieldGrid({ tiles, onTileClick, disabled }: MinefieldGridProps) {
  return (
    <div className="w-full max-w-[440px] mx-auto grid grid-cols-4 gap-2 sm:gap-3">
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
            className={`aspect-square flex items-center justify-center border-2 border-black font-mono text-[10px] sm:text-sm font-black uppercase tracking-wider transition-all break-words px-1 text-center ${getTileStatusClasses(tile.status)}`}
          >
            {tile.text}
          </button>
        );
      })}
    </div>
  );
}

export default MinefieldGrid;