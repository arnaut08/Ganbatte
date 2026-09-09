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
    onReturnToLobby: () => void;
    hostPlayerName?: string;
    guestPlayerName?: string;
    hostSocketId?: string;
    guestSocketId?: string;
};

export function MinefieldArena({
    roomCode,
    socket,
    currentUserId,
    isHost,
    initialMinefield,
    onForfeit,
    onReturnToLobby,
    hostPlayerName = 'HOST',
    guestPlayerName = 'GUEST',
    hostSocketId,
    guestSocketId,
}: MinefieldArenaProps) {
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

    const hostScore = Number.isFinite(Number(localMinefield.hostScore)) ? Number(localMinefield.hostScore) : 0;
    const guestScore = Number.isFinite(Number(localMinefield.guestScore)) ? Number(localMinefield.guestScore) : 0;
    const winningScore = Number.isFinite(Number(localMinefield.winningScore)) && Number(localMinefield.winningScore) > 0
        ? Number(localMinefield.winningScore)
        : 5;

    const roundNumber = Number.isFinite(Number(localMinefield.roundNumber)) ? Number(localMinefield.roundNumber) : 1;
    const roundLimit = Number.isFinite(Number(localMinefield.roundLimit)) && Number(localMinefield.roundLimit) > 0
        ? Number(localMinefield.roundLimit)
        : 10;

    const maxScore = Math.max(hostScore, guestScore);
    const targetPressureScore = Number.isFinite(maxScore) ? maxScore : 0;
    const roundProgress = Math.min(100, Math.max(0, (roundNumber / roundLimit) * 100));
    const scoreProgress = Math.min(100, Math.max(0, (targetPressureScore / winningScore) * 100));

    const winnerIsHost = matchResult?.winnerSocketId === hostSocketId || (!matchResult?.winnerSocketId && isWinner && isHost);
    const winnerIsGuest = matchResult?.winnerSocketId === guestSocketId || (!matchResult?.winnerSocketId && isWinner && !isHost);

    const completionMessage = matchResult?.completionReason === 'forfeit'
        ? 'MATCH ENDED BY SURRENDER'
        : matchResult?.completionReason === 'round-limit'
            ? 'ROUND LIMIT REACHED'
            : 'TARGET SCORE REACHED';

    return (
        <div className="mx-auto max-w-5xl px-3 py-4 space-y-4 sm:px-4 sm:py-6 relative">
            <header className="flex items-center justify-between gap-3 border-b-2 border-black/20 pb-3">
                <div>
                    <span className="font-mono text-xs font-black uppercase tracking-widest text-[#A3E636] sm:text-sm">
            // MINEFIELD RUSH
                    </span>
                    <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        N5 TRANSLATION PROTOCOL // ROOM {roomCode}
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

            {/* Balanced Grid Layout preventing left offset or awkward side shifts */}
            <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">

                {/* Main Arena Column (Centered Grid & HUD) */}
                <main className="relative w-full space-y-4">
                    <div className="flex items-center justify-between gap-3 px-1">
                        <span className="font-mono text-[10px] font-black uppercase tracking-widest text-neutral-400">LIVE TARGET</span>
                        <span className="font-mono text-[10px] font-black uppercase text-[#FFDE59]">GET TO {winningScore}</span>
                    </div>

                    {/* Stable HUD Row with locked badge widths */}
                    <div className="grid grid-cols-[80px_minmax(0,1fr)_80px] items-stretch gap-2 sm:grid-cols-[110px_minmax(0,1fr)_110px] sm:gap-4">
                        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#70CFF8] px-2 py-2 text-center text-black shadow-[3px_3px_0px_0px_#000]">
                            <span className="font-mono text-[9px] font-black uppercase tracking-wider sm:text-[10px]">Host</span>
                            <span className="font-mono text-xl font-black sm:text-3xl">{hostScore}</span>
                        </div>

                        {/* Fixed clipping issue by allowing text wrapping and flexible padding */}
                        <div className="flex items-center justify-center border-2 border-black bg-[#151922] px-3 py-2 text-center shadow-[3px_3px_0px_0px_#000]">
                            <div className="w-full text-base font-black uppercase leading-tight text-[#FFDE59] sm:text-2xl line-clamp-2">
                                {localMinefield.currentPrompt}
                            </div>
                        </div>

                        <div className="flex flex-col items-center justify-center border-2 border-black bg-[#A3E636] px-2 py-2 text-center text-black shadow-[3px_3px_0px_0px_#000]">
                            <span className="font-mono text-[9px] font-black uppercase tracking-wider sm:text-[10px]">Guest</span>
                            <span className="font-mono text-xl font-black sm:text-3xl">{guestScore}</span>
                        </div>
                    </div>

                    {/* Playing Grid */}
                    <div className="pt-1">
                        <MinefieldGrid tiles={localMinefield.tiles} onTileClick={claimTile} disabled={!socket || Boolean(matchResult)} />
                    </div>
                </main>

                {/* Compact Sidebar Radar */}
                <aside className="w-full border-2 border-black bg-[#151922] p-4 text-white shadow-[4px_4px_0px_0px_#000]">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                        <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FFDE59]">// OPPONENT RADAR</span>
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#A3E636]" aria-label="Live sync" />
                    </div>
                    <div className="mt-3 space-y-3 font-mono text-[11px] font-bold uppercase">
                        <div>
                            <div className="flex justify-between text-neutral-400 text-[10px]">
                                <span>Round Progress</span>
                                <span className="text-white">{roundNumber}/{roundLimit}</span>
                            </div>
                            <div className="mt-1.5 h-2 border border-black bg-[#283248]">
                                <div className="h-full bg-[#70CFF8]" style={{ width: `${roundProgress}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-neutral-400 text-[10px]">
                                <span>Target Pressure</span>
                                <span className="text-[#A3E636]">{targetPressureScore}/{winningScore}</span>
                            </div>
                            <div className="mt-1.5 h-2 border border-black bg-[#283248]">
                                <div className="h-full bg-[#A3E636]" style={{ width: `${scoreProgress}%` }} />
                            </div>
                        </div>
                        <div className="border-y border-white/20 py-2 text-[10px] text-[#A3E636]">● LIVE SYNC // LINKED</div>
                        <div className="space-y-0.5 text-[10px] text-neutral-400 font-normal">
                            <p className="font-bold text-[#FFDE59]">QUICK PROTOCOL</p>
                            <p>Find the tile matching the English prompt.</p>
                            <p>Red tiles are personal mine penalties.</p>
                            <p>First to {winningScore} wins.</p>
                        </div>
                    </div>
                </aside>

            </div>

            {/* Containered Victory / Defeat Overlay (Fixed positioning within parent component bounds) */}
            {matchResult && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-xs p-4 text-center">
                    <span className="border border-black bg-[#151922] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#FFDE59]">
            // COMBAT TERMINATED
                    </span>
                    <h2 className={`mt-2 font-mono text-4xl font-black uppercase tracking-tight sm:text-6xl ${isWinner ? 'text-[#A3E636]' : 'text-[#FF6B6B]'}`}>
                        {isWinner ? 'VICTORY' : 'DEFEAT'}
                    </h2>
                    <p className="mt-1 font-mono text-[11px] font-black uppercase text-neutral-300">{completionMessage}</p>

                    <div className="mt-4 grid w-full max-w-md gap-3 sm:grid-cols-2">
                        {[
                            { label: hostPlayerName, score: hostScore, isWinner: winnerIsHost, accent: 'bg-[#70CFF8]' },
                            { label: guestPlayerName, score: guestScore, isWinner: winnerIsGuest, accent: 'bg-[#A3E636]' },
                        ].map((player) => (
                            <div key={player.label} className={`border-2 border-black p-3 text-left text-black shadow-[3px_3px_0px_0px_#000] ${player.accent}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <span className="min-w-0 truncate font-mono text-xs font-black uppercase">{player.label}</span>
                                    <span className="shrink-0 font-mono text-[9px] font-black uppercase">{player.isWinner ? 'WINNER' : 'DEFEATED'}</span>
                                </div>
                                <div className="mt-1 font-mono text-3xl font-black">{player.score}</div>
                                <div className="font-mono text-[9px] font-black uppercase">FINAL SCORE</div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={onReturnToLobby}
                        className="mt-5 cursor-pointer border-2 border-black bg-[#FFDE59] px-6 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        Return to Lobby →
                    </button>
                </div>
            )}
        </div>
    );
}

export default MinefieldArena;