import useTugOfWarSocket from '../../hooks/useTugOfWarSocket';
import type { TugOfWarState } from '../../types/room';
import type { RoomSocket } from '../../types/socket-events';
import TugOfWarArenaSkeleton from './TugOfWarArenaSkeleton';

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
        return <TugOfWarArenaSkeleton />;
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
        <div className="mx-auto max-w-7xl px-3 py-4 space-y-5 sm:px-4 sm:py-6 relative min-h-[calc(100dvh-5rem)]">

            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b-2 border-black/20 pb-3">
                <div>
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FFDE59] sm:text-sm">
            // TUG OF WAR PROTOCOL
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        N5 GRAMMAR // ROOM {roomCode}
                    </p>
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

            {/* Symmetric 3-Column Layout: Stacks on Mobile, completely balanced on Desktop */}
            <div className="flex flex-col lg:grid lg:grid-cols-[240px_minmax(0,500px)_240px] xl:grid-cols-[280px_minmax(0,560px)_280px] justify-center items-start gap-5 sm:gap-6">

                {/* LEFT COLUMN: Protocol (Order 3 on mobile, Order 1 on Desktop) */}
                <aside className="order-3 lg:order-1 w-full border-2 border-black bg-[#151922] p-4 text-white shadow-[4px_4px_0px_0px_#000]">
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FFDE59]">// PROTOCOL</span>
                    <div className="mt-4 space-y-3 font-mono text-[11px] font-bold uppercase text-neutral-300">
                        <div className="flex gap-2">
                            <span className="text-[#A3E636]">01.</span>
                            <p>Read the Japanese prompt.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[#FFDE59]">02.</span>
                            <p>Select the correct missing particle.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[#FF6B6B]">03.</span>
                            <p>Wrong answers trigger a 3-second lockout penalty.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-[#70CFF8]">04.</span>
                            <p>Pull the momentum gauge to {threshold} to win.</p>
                        </div>
                    </div>
                </aside>

                {/* CENTER COLUMN: Main Arena (Order 1 on mobile, Order 2 on Desktop) */}
                <main className="order-1 lg:order-2 w-full space-y-4">

                    <div className="flex items-end justify-between font-mono text-[10px] font-black uppercase">
                        <span className="text-[#70CFF8]">{hostPlayerName} // HOST</span>
                        <span className="text-neutral-500">MOMENTUM {momentum > 0 ? '+' : ''}{momentum}</span>
                        <span className="text-[#A3E636]">GUEST // {guestPlayerName}</span>
                    </div>

                    <div className="relative h-12 w-full border-2 border-black bg-[#151922] shadow-[4px_4px_0px_0px_#000] overflow-hidden">
                        <div className="absolute inset-y-0 right-1/2 bg-[#70CFF8] transition-[width] duration-300" style={{ width: hostWidth }} />
                        <div className="absolute inset-y-0 left-1/2 bg-[#A3E636] transition-[width] duration-300" style={{ width: guestWidth }} />
                        <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-[#FFDE59] shadow-[2px_0_0_#000] z-20" />
                        <div className="absolute inset-0 flex items-center justify-between px-3 font-mono text-xs font-black text-white mix-blend-difference z-10">
                            <span>-{threshold}</span>
                            <span>0</span>
                            <span>+{threshold}</span>
                        </div>
                    </div>

                    <section className="flex w-full min-h-[180px] sm:min-h-[220px] flex-col items-center justify-center border-2 border-black bg-[#151922] px-4 py-6 text-center shadow-[6px_6px_0px_0px_#000] sm:px-8">
                        <p className="mb-4 sm:mb-6 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">// COMPLETE THE SENTENCE</p>
                        <h1 className="w-full break-words font-black text-2xl uppercase leading-tight text-white sm:text-4xl">
                            {renderSentence()}
                        </h1>
                    </section>

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1">
                        {localTugOfWar.options.map((option, index) => (
                            <button
                                key={`${option}-${index}`}
                                type="button"
                                disabled={!socket || isLockedOut || Boolean(matchResult)}
                                onClick={() => submitAnswer(option)}
                                className="flex w-full min-h-[80px] sm:min-h-[110px] items-center justify-center cursor-pointer border-2 border-b-[6px] border-black bg-white px-3 py-4 font-mono text-xl font-black text-black transition-all hover:bg-[#FFDE59] active:translate-y-[4px] active:border-b-2 active:shadow-none disabled:cursor-not-allowed disabled:bg-[#283248] disabled:text-neutral-500 disabled:border-b-2 disabled:translate-y-[4px] disabled:shadow-none sm:text-3xl"
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </main>

                {/* RIGHT COLUMN: Radar (Order 2 on mobile, Order 3 on Desktop) */}
                <aside className="order-2 lg:order-3 w-full border-2 border-black bg-[#151922] p-4 text-white shadow-[4px_4px_0px_0px_#000]">
                    <div className="flex items-center justify-between border-b border-white/20 pb-3">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FFDE59]">// TENSION RADAR</span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#A3E636]" aria-label="Live sync" />
                    </div>
                    <div className="mt-4 space-y-4 font-mono text-[11px] font-bold uppercase">
                        <div className="flex justify-between text-[#70CFF8]">
                            <span>HOST PULL</span>
                            <span>{momentum < 0 ? Math.abs(momentum) : 0}</span>
                        </div>
                        <div className="flex justify-between text-[#A3E636]">
                            <span>GUEST PULL</span>
                            <span>{momentum > 0 ? momentum : 0}</span>
                        </div>
                        <div className="flex justify-between text-neutral-400">
                            <span>WIN THRESHOLD</span>
                            <span>{threshold}</span>
                        </div>
                        <div className="border-t border-white/20 pt-4 mt-2 flex justify-between items-center text-[10px]">
                            <span className="text-neutral-400">LOCAL SYSTEM</span>
                            {isLockedOut ? (
                                <span className="text-[#FF6B6B] animate-pulse">LOCKED</span>
                            ) : (
                                <span className="text-[#A3E636]">ACTIVE</span>
                            )}
                        </div>
                    </div>
                </aside>

            </div>

            {/* Penalty Visual Lockout */}
            {isLockedOut && !matchResult && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#FF6B6B]/20 p-4 text-center">
                    <div className="-rotate-2 border-4 border-black bg-[#FF6B6B] px-4 py-3 text-black shadow-[7px_7px_0px_0px_#000] animate-pulse sm:px-8 sm:py-5">
                        <span className="font-mono text-3xl font-black uppercase sm:text-6xl">SYSTEM LOCKED</span>
                        <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-widest">PENALTY WINDOW // 03 SEC</p>
                    </div>
                </div>
            )}

            {/* Match Completion Overlay */}
            {matchResult && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 text-center backdrop-blur-xs">
                    <span className="border border-black bg-[#151922] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#FFDE59]">
            // TENSION RELEASED
                    </span>
                    <h2 className={`mt-2 font-mono text-4xl font-black uppercase tracking-tight sm:text-6xl ${isWinner ? 'text-[#A3E636]' : 'text-[#FF6B6B]'}`}>
                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] font-black uppercase text-neutral-300">{completionMessage}</p>
                    <button
                        type="button"
                        onClick={onReturnToLobby}
                        className="mt-6 border-2 border-black bg-[#FFDE59] px-6 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
                    >
                        Return to Lobby →
                    </button>
                </div>
            )}
        </div>
    );
}

export default TugOfWarArena;