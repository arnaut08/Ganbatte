import useMinefieldSocket from '../../hooks/useMinefieldSocket';
import type { MinefieldState } from '../../types/room';
import type { RoomSocket } from '../../types/socket-events';
import MinefieldGrid from './MinefieldGrid';

type MinefieldArenaProps = {
  roomCode: string;
  socket: RoomSocket | null;
  currentUserId: string;
  isHost: boolean;
  initialMinefield?: MinefieldState;
  onForfeit: () => void;
};

export function MinefieldArena({ roomCode, socket, currentUserId, isHost, initialMinefield, onForfeit }: MinefieldArenaProps) {
  const { localMinefield, claimTile, matchResult } = useMinefieldSocket(socket, roomCode, currentUserId, isHost, initialMinefield);

  if (!localMinefield) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xl font-black uppercase text-white animate-pulse">
        Generating Board...
      </div>
    );
  }

  const isWinner = matchResult?.winnerSocketId === socket?.id
    || (Boolean(matchResult?.winnerUserId) && matchResult?.winnerUserId === currentUserId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#A3E636] sm:text-sm">
            // MINEFIELD RUSH
          </span>
          <button
            type="button"
            disabled={!socket || Boolean(matchResult)}
            onClick={onForfeit}
            className="cursor-pointer border-2 border-black bg-[#FF6B6B] px-3 py-2 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none"
          >
            // FORFEIT
          </button>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] items-stretch gap-2 sm:gap-4">
        <div className="flex min-w-0 flex-col items-center justify-center border-2 border-black bg-[#70CFF8] px-3 py-2 text-center text-black shadow-[4px_4px_0px_0px_#000] sm:px-5 sm:py-3">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">Host Score</span>
          <span className="font-mono text-2xl font-black sm:text-4xl">{localMinefield.hostScore}</span>
        </div>

        <div className="flex min-w-0 items-center justify-center border-2 border-black bg-[#151922] p-4 text-center shadow-[4px_4px_0px_0px_#000] sm:p-6">
          <div className="text-2xl font-black uppercase text-[#FFDE59] sm:text-4xl">
            {localMinefield.currentPrompt}
          </div>
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center border-2 border-black bg-[#A3E636] px-3 py-2 text-center text-black shadow-[4px_4px_0px_0px_#000] sm:px-5 sm:py-3">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider sm:text-xs">Guest Score</span>
          <span className="font-mono text-2xl font-black sm:text-4xl">{localMinefield.guestScore}</span>
        </div>
        </div>
      </div>

      <MinefieldGrid tiles={localMinefield.tiles} onTileClick={claimTile} disabled={!socket || Boolean(matchResult)} />

      {matchResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md border-4 border-black bg-[#1f2637] p-5 text-center text-white shadow-[8px_8px_0px_0px_#000] sm:p-8">
            <p className={`font-mono text-xs font-black uppercase tracking-[0.2em] ${isWinner ? 'text-[#A3E636]' : 'text-[#FF6B6B]'}`}>
              // MATCH COMPLETE
            </p>
            <h2 className={`mt-3 font-mono text-4xl font-black uppercase sm:text-6xl ${isWinner ? 'text-[#A3E636]' : 'text-[#FF6B6B]'}`}>
              {isWinner ? 'Victory' : 'Defeat'}
            </h2>
            <p className="mt-2 font-mono text-xs font-bold uppercase text-neutral-300 sm:text-sm">
              {matchResult.forfeitedByUserId ? 'The match ended by surrender.' : 'A player reached the winning score.'}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="border-2 border-black bg-[#70CFF8] p-3 text-black shadow-[3px_3px_0px_0px_#000]">
                <span className="font-mono text-[10px] font-black uppercase">Host</span>
                <div className="font-mono text-3xl font-black">{localMinefield.hostScore}</div>
              </div>
              <div className="border-2 border-black bg-[#A3E636] p-3 text-black shadow-[3px_3px_0px_0px_#000]">
                <span className="font-mono text-[10px] font-black uppercase">Guest</span>
                <div className="font-mono text-3xl font-black">{localMinefield.guestScore}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MinefieldArena;
