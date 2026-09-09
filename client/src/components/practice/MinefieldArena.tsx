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
};

export function MinefieldArena({ roomCode, socket, currentUserId, isHost, initialMinefield }: MinefieldArenaProps) {
  const { localMinefield, claimTile } = useMinefieldSocket(socket, roomCode, currentUserId, isHost, initialMinefield);

  if (!localMinefield) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-xl font-black uppercase text-white animate-pulse">
        Generating Board...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
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

      <MinefieldGrid tiles={localMinefield.tiles} onTileClick={claimTile} disabled={!socket} />
    </div>
  );
}

export default MinefieldArena;
