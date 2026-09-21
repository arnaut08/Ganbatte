import useTugOfWarSocket from '../../hooks/useTugOfWarSocket';
import type { TugOfWarState } from '../../types/room';
import type { RoomSocket } from '../../types/socket-events';

type TugOfWarArenaProps = {
  roomCode: string;
  socket: RoomSocket | null;
  currentUserId: string;
  isHost: boolean;
  initialTugOfWar?: TugOfWarState;
  onForfeit: () => void;
  onReturnToLobby: () => void;
  hostPlayerName?: string;
  guestPlayerName?: string;
};

export function TugOfWarArena({
  roomCode,
  socket,
  currentUserId,
  isHost,
  initialTugOfWar,
  onForfeit,
  onReturnToLobby,
  hostPlayerName = 'HOST',
  guestPlayerName = 'GUEST',
}: TugOfWarArenaProps) {
  const { localTugOfWar, isLockedOut, submitAnswer, matchResult } = useTugOfWarSocket(
    socket,
    roomCode,
    currentUserId,
    isHost,
    initialTugOfWar,
  );

  if (!localTugOfWar) {
    return <div className="flex h-64 items-center justify-center font-mono text-xl font-black uppercase text-white animate-pulse">Generating Protocol...</div>;
  }

  const threshold = Math.max(1, localTugOfWar.winningThreshold || 5);
  const momentum = Math.max(-threshold, Math.min(threshold, localTugOfWar.momentum));
  const hostWidth = `${Math.max(0, (-momentum / threshold) * 50)}%`;
  const guestWidth = `${Math.max(0, (momentum / threshold) * 50)}%`;
  const isWinner = matchResult?.winnerSocketId === socket?.id
    || (Boolean(matchResult?.winnerUserId) && matchResult.winnerUserId === currentUserId);
  const completionMessage = matchResult?.completionReason === 'forfeit'
    ? 'MATCH ENDED BY SURRENDER'
    : 'MOMENTUM THRESHOLD REACHED';

  const renderSentence = () => {
    const [before, after] = localTugOfWar.currentSentence.split('___');
    if (after === undefined) return localTugOfWar.currentSentence;
    return <>{before}<span className="mx-1 text-[#FFDE59]">[ ? ]</span>{after}</>;
  };

  return (
    <div className="relative mx-auto min-h-[calc(100dvh-5rem)] max-w-6xl space-y-5 px-3 py-4 sm:px-5 sm:py-6">
      <header className="flex items-center justify-between gap-3 border-b-2 border-black/20 pb-3">
        <div>
          <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FFDE59] sm:text-sm">// TUG OF WAR PROTOCOL</span>
          <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">N5 GRAMMAR // ROOM {roomCode}</p>
        </div>
        <button
          type="button"
          disabled={!socket || Boolean(matchResult)}
          onClick={onForfeit}
          className="cursor-pointer border-2 border-black bg-[#FF6B6B] px-3 py-1.5 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] disabled:cursor-not-allowed disabled:bg-[#151922] disabled:text-neutral-500 disabled:shadow-none"
        >
          // FORFEIT
        </button>
      </header>

      <main className="mx-auto w-full max-w-4xl space-y-5">
        <div className="flex items-end justify-between font-mono text-[10px] font-black uppercase">
          <span className="text-[#70CFF8]">{hostPlayerName} // HOST</span>
          <span className="text-neutral-500">MOMENTUM {momentum > 0 ? '+' : ''}{momentum}</span>
          <span className="text-[#A3E636]">GUEST // {guestPlayerName}</span>
        </div>

        <div className="relative h-12 border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000]">
          <div className="absolute inset-y-0 right-1/2 bg-[#70CFF8] transition-[width] duration-300" style={{ width: hostWidth }} />
          <div className="absolute inset-y-0 left-1/2 bg-[#A3E636] transition-[width] duration-300" style={{ width: guestWidth }} />
          <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#FFDE59] shadow-[2px_0_0_#000]" />
          <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-xs font-black text-black mix-blend-multiply">
            <span>-{threshold}</span><span>0</span><span>+{threshold}</span>
          </div>
        </div>

        <section className="border-2 border-black bg-[#151922] px-4 py-10 text-center shadow-[6px_6px_0px_0px_#000] sm:px-8 sm:py-16">
          <p className="mb-4 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">// COMPLETE THE SENTENCE</p>
          <h1 className="break-words font-black text-xl uppercase leading-tight text-white sm:text-4xl">{renderSentence()}</h1>
        </section>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {localTugOfWar.options.map((option, index) => (
            <button
              key={`${option}-${index}`}
              type="button"
              disabled={!socket || isLockedOut || Boolean(matchResult)}
              onClick={() => submitAnswer(option)}
              className="min-h-20 cursor-pointer border-2 border-b-[6px] border-black bg-white px-3 py-4 font-mono text-lg font-black text-black shadow-[0_2px_0_0_#000] transition-all hover:bg-[#FFDE59] active:translate-y-[4px] active:border-b-2 active:shadow-none disabled:cursor-not-allowed disabled:bg-[#283248] disabled:text-neutral-500 disabled:shadow-none sm:min-h-28 sm:text-2xl"
            >
              {option}
            </button>
          ))}
        </div>
      </main>

      {isLockedOut && !matchResult && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#FF6B6B]/20 p-4 text-center">
          <div className="-rotate-2 border-4 border-black bg-[#FF6B6B] px-4 py-3 text-black shadow-[7px_7px_0px_0px_#000] animate-pulse sm:px-8 sm:py-5">
            <span className="font-mono text-3xl font-black uppercase sm:text-6xl">SYSTEM LOCKED</span>
            <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest">PENALTY WINDOW // 03 SEC</p>
          </div>
        </div>
      )}

      {matchResult && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 text-center backdrop-blur-xs">
          <span className="border border-black bg-[#151922] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#FFDE59]">// TENSION RELEASED</span>
          <h2 className={`mt-2 font-mono text-4xl font-black uppercase tracking-tight sm:text-6xl ${isWinner ? 'text-[#A3E636]' : 'text-[#FF6B6B]'}`}>{isWinner ? 'VICTORY' : 'DEFEAT'}</h2>
          <p className="mt-1 font-mono text-[11px] font-black uppercase text-neutral-300">{completionMessage}</p>
          <button
            type="button"
            onClick={onReturnToLobby}
            className="mt-6 border-2 border-black bg-[#FFDE59] px-5 py-3 font-mono text-xs font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
          >
            Return to Lobby
          </button>
        </div>
      )}
    </div>
  );
}

export default TugOfWarArena;
