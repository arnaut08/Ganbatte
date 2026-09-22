import { useEffect, useRef, useState } from 'react';
import { loadGauntletDeck, type GauntletCard } from '@/services/gauntletDeckService';
import { createSeededRNG } from '@/utils/gauntletRng';
import { useGauntletMatch } from '@/hooks/useGauntletMatch';
import type { Deck } from '@/types';
import GauntletSkeleton from '@/components/skeletons/GauntletSkeleton';
import { supabase } from '@/config/supabase';
import { LightningBoltIcon } from '@radix-ui/react-icons';

interface FallingCard extends GauntletCard {
    instanceId: string;
    lane: number;
    y: number;
    speed: number;
}

interface GauntletPvpScreenProps {
    roomId: string;
    userId: string;
    opponentUserId?: string;
    seed: number;
    deckType?: Deck;
    selectedGroups?: string[];
    matchWinnerUserId?: string | null;
    matchWinnerSocketId?: string;
    currentSocketId?: string;
    onForfeit?: () => void;
    onReturnToLobby?: () => void;
    onExit: () => void;
}

export default function GauntletPvpScreen({
    roomId,
    userId,
    opponentUserId = 'opponent',
    seed,
    deckType = 'kana',
    selectedGroups,
    matchWinnerUserId,
    matchWinnerSocketId,
    currentSocketId,
    onForfeit,
    onReturnToLobby,
    onExit,
}: GauntletPvpScreenProps) {
    const [deck, setDeck] = useState<GauntletCard[]>([]);
    const [isLoadingDeck, setIsLoadingDeck] = useState(true);
    const [deckError, setDeckError] = useState(false);
    const [hp, setHp] = useState(3);
    const [score, setScore] = useState(0);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [streak, setStreak] = useState(0);
    const [inputVal, setInputVal] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);
    const [matchResult, setMatchResult] = useState<'WIN' | 'DEFEAT' | null>(null);
    const [oppHp, setOppHp] = useState(3);
    const [oppScore, setOppScore] = useState(0);
    const [surgeAlert, setSurgeAlert] = useState<string | null>(null);
    const [, setFrame] = useState(0);
    const savedResultRef = useRef(false);
    const surgeTimeoutRef = useRef<number | null>(null);

    const localItemsRef = useRef<FallingCard[]>([]);
    const rngRef = useRef(createSeededRNG(seed));
    const lastSpawnRef = useRef(Date.now());
    const lastTimeRef = useRef(performance.now());
    const baseSpeedRef = useRef(0.24);
    const inputRef = useRef<HTMLInputElement>(null);

    // References used inside the physics loop to prevent teardown on state re-renders
    const scoreRef = useRef(score);
    const hpRef = useRef(hp);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        hpRef.current = hp;
    }, [hp]);

    const isKanjiDeck = deckType === 'kanji';
    const headerModeLabel = isKanjiDeck ? 'KANJI N5 SPRINT' : 'KANA SPEED GAUNTLET';
    const themeAccent = isKanjiDeck ? '#70CFF8' : '#FFDE59';

    const { sendSync, sendAttack, notifyKO } = useGauntletMatch({
        roomId,
        userId,
        onOpponentSync: (data) => {
            setOppHp(Number.isFinite(data?.hp) ? data.hp : 3);
            setOppScore(Number.isFinite(data?.score) ? data.score : 0);
        },
        onReceiveAttack: (attackType) => {
            if (attackType !== 'SPEED_SURGE') return;
            if (surgeTimeoutRef.current !== null) window.clearTimeout(surgeTimeoutRef.current);
            setSurgeAlert('SPEED SURGE INCOMING!');
            surgeTimeoutRef.current = window.setTimeout(() => {
                surgeTimeoutRef.current = null;
                setSurgeAlert(null);
            }, 2000);
            localItemsRef.current.forEach((item) => {
                item.speed *= 1.35;
            });
        },
        onOpponentKO: () => {
            setMatchResult('WIN');
            setIsGameOver(true);
        },
    });

    useEffect(() => () => {
        if (surgeTimeoutRef.current !== null) window.clearTimeout(surgeTimeoutRef.current);
    }, []);

    useEffect(() => {
        if (!matchWinnerUserId && !matchWinnerSocketId) return;
        const isWinner = (matchWinnerUserId && matchWinnerUserId === userId)
            || (matchWinnerSocketId && matchWinnerSocketId === currentSocketId);
        setMatchResult(isWinner ? 'WIN' : 'DEFEAT');
        setIsGameOver(true);
    }, [matchWinnerSocketId, matchWinnerUserId, userId]);

    useEffect(() => {
        if (!isGameOver || !matchResult || !supabase || savedResultRef.current) return;
        const database = supabase;

        const saveGauntletResult = async () => {
            const { data: { session }, error: sessionError } = await database.auth.getSession();
            if (sessionError || !session?.user?.id) return;

            savedResultRef.current = true;
            const opponent = opponentUserId && opponentUserId !== 'opponent' ? opponentUserId : null;
            const { error } = await database.from('assessment_results').insert({
                user_id: session.user.id,
                companion_user_id: opponent,
                assessment_type: 'gauntlet',
                score_percentage: matchResult === 'WIN' ? 100 : 0,
                correct_questions: answeredCount,
                total_questions: Math.max(deck.length, 1),
                details: {
                    mode: 'survival-gauntlet',
                    deck_type: deckType,
                    selected_groups: selectedGroups || [],
                    score,
                    opponent_score: oppScore,
                    result: matchResult,
                },
            });

            if (error) {
                savedResultRef.current = false;
                console.error('Unable to save gauntlet result:', error);
            }
        };

        void saveGauntletResult();
    }, [answeredCount, deck.length, deckType, isGameOver, matchResult, opponentUserId, oppScore, score, selectedGroups]);

    // Fetch Deck with active filters
    useEffect(() => {
        let mounted = true;
        loadGauntletDeck({ deckType, selectedGroups })
            .then((cards) => {
                if (!mounted) return;
                setDeck(cards);
                setDeckError(cards.length === 0);
                setIsLoadingDeck(false);
            })
            .catch(() => {
                if (!mounted) return;
                setDeckError(true);
                setIsLoadingDeck(false);
            });
        return () => {
            mounted = false;
        };
    }, [deckType, selectedGroups]);

    // Keep input focused automatically
    useEffect(() => {
        if (!isLoadingDeck && !isGameOver) {
            inputRef.current?.focus();
        }
    }, [isLoadingDeck, isGameOver]);

    // Uninterrupted Physics Engine
    useEffect(() => {
        if (isGameOver || isLoadingDeck || deck.length === 0) return undefined;

        let animationId: number;
        lastTimeRef.current = performance.now();
        lastSpawnRef.current = Date.now();

        const loop = (currentTime: number) => {
            // Delta time normalized to ~60fps (16.67ms tick)
            const dt = Math.min((currentTime - lastTimeRef.current) / 16.67, 2.5);
            lastTimeRef.current = currentTime;
            const now = Date.now();

            // 1. Spawner logic
            const currentScore = scoreRef.current;
            const spawnInterval = Math.max(900, 2300 - currentScore * 0.3);

            if (now - lastSpawnRef.current > spawnInterval) {
                const card = deck[Math.floor(rngRef.current() * deck.length)];
                localItemsRef.current.push({
                    ...card,
                    instanceId: `${now}-${Math.floor(rngRef.current() * 100000)}`,
                    lane: Math.floor(rngRef.current() * 3),
                    y: 0,
                    speed: baseSpeedRef.current,
                });
                lastSpawnRef.current = now;
            }

            // 2. Physics & Collision Steps
            let strikeHit = false;
            const nextItems: FallingCard[] = [];

            for (let i = 0; i < localItemsRef.current.length; i++) {
                const item = localItemsRef.current[i];
                const nextY = item.y + item.speed * dt;

                if (nextY >= 86) {
                    strikeHit = true;
                } else {
                    item.y = nextY;
                    nextItems.push(item);
                }
            }

            localItemsRef.current = nextItems;

            // 3. Strike evaluation
            if (strikeHit) {
                const nextHp = Math.max(0, hpRef.current - 1);
                hpRef.current = nextHp;
                setHp(nextHp);
                setStreak(0);
                sendSync(nextHp, scoreRef.current);

                if (nextHp === 0) {
                    notifyKO();
                    setMatchResult('DEFEAT');
                    setIsGameOver(true);
                    return;
                }
            }

            // Trigger frame render
            setFrame((c) => (c + 1) % 100000);
            animationId = requestAnimationFrame(loop);
        };

        animationId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationId);
    }, [deck, isGameOver, isLoadingDeck, notifyKO, sendSync]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value.toLowerCase().trim();
        setInputVal(value);

        // Destroy the closest matching card nearest the threshold
        const hitIndex = localItemsRef.current
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.romaji.includes(value))
            .sort((a, b) => b.item.y - a.item.y)[0]?.index;

        if (hitIndex === undefined) return;

        localItemsRef.current.splice(hitIndex, 1);
        const newStreak = streak + 1;
        const newScore = score + 100 + newStreak * 15;

        setInputVal('');
        setAnsweredCount((count) => count + 1);
        setScore(newScore);
        setStreak(newStreak);
        sendSync(hp, newScore);

        if (newStreak % 5 === 0) {
            sendAttack(opponentUserId, 'SPEED_SURGE');
        }

        baseSpeedRef.current = Math.min(0.65, baseSpeedRef.current + 0.005);
    };

    if (isLoadingDeck) {
        return <GauntletSkeleton />;
    }

    if (deckError) {
        return (
            <main className="container mx-auto max-w-4xl space-y-4 px-4 py-16 text-center font-mono">
                <div className="border-2 border-black border-l-8 border-l-[#FF6B6B] bg-[#1f2637] p-6 shadow-[5px_5px_0px_#000]">
                    <h2 className="text-base font-black uppercase text-[#FF6B6B]">
            // ERROR: NO CARDS IN SELECTED POOL
                    </h2>
                    <p className="mt-2 text-xs text-neutral-300">
                        The selected group or filter contains 0 valid target items.
                    </p>
                    <button
                        type="button"
                        onClick={onReturnToLobby || onExit}
                        className="mt-5 border-2 border-black bg-[#FFDE59] px-6 py-2.5 text-xs font-black uppercase text-black shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                    >
                        Return to Lobby →
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="container mx-auto max-w-5xl space-y-3 px-3 py-3 pb-24 sm:space-y-4 sm:px-4 sm:py-6">
            {/* 1. Header Bar */}
            <div className="flex w-full flex-row items-center justify-between gap-2 border-2 border-black bg-[#1f2637] px-3 py-2.5 shadow-[3px_3px_0px_0px_#000] sm:px-4 sm:py-3">
                <div className="min-w-0 flex flex-1 items-center gap-2">
                    <span
                        className="h-2.5 w-2.5 border border-black animate-pulse"
                        style={{ backgroundColor: themeAccent }}
                    />
                    <span className="truncate font-mono text-xs font-black uppercase tracking-tight text-white sm:text-sm">
                        1v1 GAUNTLET // {headerModeLabel}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onForfeit || onExit}
                    className="shrink-0 cursor-pointer border-2 border-black bg-white px-2 py-1 font-mono text-[10px] font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:bg-[#FF6B6B] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:px-3 sm:text-[11px]"
                >
                    Forfeit Match
                </button>
            </div>

            {/* 2. Main Arena Grid */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12 items-stretch">

                {/* LEFT COLUMN: Local Arena (8 Cols) */}
                <div className="space-y-2.5 lg:col-span-8 flex flex-col justify-between">

                    {/* Top Status Bar */}
                    <div className="grid grid-cols-3 gap-2 border-2 border-black border-l-6 sm:border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-2.5 sm:p-3 font-mono text-xs font-black text-white shadow-[3px_3px_0px_0px_#000]">
                        {/* Lives Indicator */}
                        <div className="flex min-w-0 flex-col items-start gap-1">
                            <span className="text-[10px] font-black uppercase text-neutral-400">LIVES:</span>
                            <div className="flex h-5 items-center gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <span
                                        key={i}
                                        className={`h-4 w-5 border-2 border-black transition-colors ${i < hp ? 'bg-[#FF6B6B] shadow-[1px_1px_0px_0px_#000]' : 'bg-[#151922] opacity-40'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Streak Counter */}
                        <div className="flex min-w-0 flex-col items-start gap-1">
                            <span className="text-[10px] font-black uppercase text-neutral-400">STREAK:</span>
                            <span className="border border-black bg-[#151922] px-2 py-0.5 text-[#FFDE59]">
                                {streak}x
                            </span>
                        </div>

                        {/* Score Counter */}
                        <div className="flex min-w-0 flex-col items-start gap-1">
                            <span className="text-[10px] font-black uppercase text-neutral-400">SCORE:</span>
                            <span className="text-sm font-black text-white">{score}</span>
                        </div>
                    </div>

                    {/* Matrix Drop Box */}
                    <div className="relative h-[390px] sm:h-[440px] w-full border-4 border-black bg-[#11141d] shadow-[4px_4px_0px_0px_#000] overflow-hidden select-none">
                        {/* Lane Tracks */}
                        <div className="absolute inset-0 grid grid-cols-3 pointer-events-none">
                            <div className="border-r-2 border-dashed border-white/10" />
                            <div className="border-r-2 border-dashed border-white/10" />
                        </div>

                        {/* Lane Track Tags */}
                        <div className="absolute top-2 inset-x-0 grid grid-cols-3 pointer-events-none text-center font-mono text-[9px] font-black text-neutral-600">
                            <span>TRK_01</span>
                            <span>TRK_02</span>
                            <span>TRK_03</span>
                        </div>

                        {/* Danger Line */}
                        <div className="absolute left-0 right-0 top-[86%] border-b-2 border-dashed border-[#FF6B6B] flex items-center justify-end pr-2 pointer-events-none">
                            <span className="bg-[#FF6B6B] px-1 py-0.2 font-mono text-[8px] font-black uppercase text-black border border-black -translate-y-1/2">
                                TERMINATION THRESHOLD
                            </span>
                        </div>

                        {/* Incoming Surge Banner */}
                        {surgeAlert && (
                            <div className="absolute inset-x-6 top-6 z-20 border-2 border-black bg-[#FF6B6B] p-2 text-center font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] animate-bounce">
                                ⚠️ {surgeAlert}
                            </div>
                        )}

                        {/* Falling Characters */}
                        {localItemsRef.current.map((item) => (
                            <div
                                key={item.instanceId}
                                style={{
                                    top: `${item.y}%`,
                                    left: `${item.lane * 33.33 + 4.5}%`,
                                }}
                                className={`absolute flex h-14 w-20 sm:h-16 sm:w-22 items-center justify-center border-2 border-black font-mono font-black shadow-[2.5px_2.5px_0px_0px_#000] will-change-[top] ${item.type === 'kanji_n5'
                                    ? 'bg-[#70CFF8] text-black text-2xl sm:text-3xl'
                                    : 'bg-[#FFDE59] text-black text-xl sm:text-2xl'
                                    }`}
                            >
                                {item.char}
                            </div>
                        ))}

                        {/* Match Conclusion Overlay */}
                        {isGameOver && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/92 p-4 text-center space-y-3">
                                <span className="border border-black bg-[#151922] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest text-[#FFDE59]">
                  // COMBAT TERMINATED
                                </span>

                                <h2
                                    className={`font-mono text-5xl font-black uppercase tracking-tight ${matchResult === 'WIN' ? 'text-[#A3E636]' : 'text-[#FF6B6B]'
                                        }`}
                                >
                                    {matchResult === 'WIN' ? 'VICTORY' : 'DEFEAT'}
                                </h2>

                                <div className="border border-white/20 bg-[#151922] p-3 font-mono text-xs text-neutral-300 space-y-1">
                                    <p>YOUR SCORE: <strong className="text-white">{score}</strong></p>
                                    <p>OPPONENT SCORE: <strong className="text-white">{oppScore}</strong></p>
                                </div>

                                <button
                                    type="button"
                                    onClick={onReturnToLobby || onExit}
                                    className="cursor-pointer border-2 border-black bg-[#FFDE59] px-6 py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
                                >
                                    Return to Lobby →
                                </button>
                            </div>
                        )}
                    </div>

                    {/* User Input Bar */}
                    <div className="relative">
                        <span className="absolute left-3.5 top-3.5 font-mono text-sm font-black text-neutral-500 select-none">
                            &gt;
                        </span>
                        <input
                            ref={inputRef}
                            type="text"
                            disabled={isGameOver}
                            value={inputVal}
                            onChange={handleInputChange}
                            placeholder="TYPE ROMAJI READING..."
                            className="h-12 w-full border-2 border-black bg-[#151922] pl-8 pr-4 font-mono text-sm font-black uppercase tracking-widest text-white shadow-[3px_3px_0px_0px_#000] focus:border-[#FFDE59] focus:outline-none placeholder:text-neutral-600 placeholder:normal-case placeholder:tracking-normal placeholder:font-bold"
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: Opponent Tactical Radar (4 Cols) */}
                <aside className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 sm:p-4 font-mono shadow-[3.5px_3.5px_0px_0px_#000] lg:col-span-4 flex flex-col justify-between space-y-3.5">

                    {/* Radar Header */}
                    <div>
                        <div className="flex items-center justify-between border-b-2 border-black bg-[#151922] p-2 mb-3">
                            <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#70CFF8]">
                // OPPONENT RADAR
                            </span>
                            <span className="border border-black bg-[#70CFF8] px-1.5 py-0.2 text-[8px] font-black uppercase text-black">
                                LIVE SYNC
                            </span>
                        </div>

                        {/* Vital Signs Panel */}
                        <div className="space-y-2 border-2 border-black bg-[#151922] p-3 text-xs text-white shadow-[2px_2px_0px_0px_#000]">
                            <div className="flex items-center justify-between">
                                <span className="text-neutral-400 font-bold uppercase text-[10px]">Opponent HP:</span>
                                <div className="flex gap-1.5">
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            className={`h-3.5 w-4 border border-black ${i < oppHp ? 'bg-[#FF6B6B]' : 'bg-[#1f2637]'
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/10 pt-1.5">
                                <span className="text-neutral-400 font-bold uppercase text-[10px]">Opponent Score:</span>
                                <span className="font-black text-[#70CFF8] text-sm">{oppScore}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attack Power Gauge (Speed Surge Battery) */}
                    <div className="border-2 border-black bg-[#11141d] p-3 space-y-2 shadow-[2px_2px_0px_0px_#000]">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-neutral-300">
                                SURGE CHARGE:
                            </span>
                            <span className="font-mono text-[9px] font-black text-[#FFDE59]">
                                {streak % 5 === 0 && streak > 0 ? '5/5 READY' : `${streak % 5}/5`}
                            </span>
                        </div>

                        {/* 5-Segment Brutalist Battery Bar */}
                        <div className="grid grid-cols-5 gap-1.5 h-7 border border-black bg-[#151922] p-1">
                            {[1, 2, 3, 4, 5].map((step) => {
                                const currentProgress = streak % 5 === 0 && streak > 0 ? 5 : streak % 5;
                                const isCharged = currentProgress >= step;
                                const isSurgeTrigger = currentProgress === 5;

                                return (
                                    <div
                                        key={step}
                                        className={`h-full border border-black transition-all ${isCharged
                                                ? isSurgeTrigger
                                                    ? 'bg-[#FF6B6B] animate-pulse shadow-[1px_1px_0px_0px_#000]'
                                                    : 'bg-[#FFDE59] shadow-[1px_1px_0px_0px_#000]'
                                                : 'bg-[#1f2637] opacity-40'
                                            }`}
                                    />
                                );
                            })}
                        </div>

                        {/* Tactical Status Banner */}
                        <div className="pt-0.5">
                            {streak % 5 === 0 && streak > 0 ? (
                                <div className="border border-black bg-[#FF6B6B] px-1.5 py-1 text-center font-mono text-[8px] font-black uppercase tracking-wider text-black animate-bounce shadow-[1px_1px_0px_0px_#000]">
                                    <><LightningBoltIcon className="mr-1 inline-block h-3 w-3" aria-hidden="true" />SPEED SURGE DEPLOYED</>
                                </div>
                            ) : (
                                <span className="font-mono text-[8px] text-neutral-500 font-bold uppercase block text-center">
                                    {5 - (streak % 5)} CORRECT READINGS TO SURGE
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Combat Protocol */}
                    <div className="border border-black/50 bg-[#151922] p-2.5 space-y-1.5 text-[9px] text-neutral-400 leading-snug">
                        <span className="font-black uppercase text-white block text-[10px]">
              // COMBAT PROTOCOL:
                        </span>
                        <p>• Every 5-streak sends a <strong>Speed Surge</strong> to the enemy.</p>
                        <p>• Characters past the red line trigger 1 strike.</p>
                        <p className="text-[#FFDE59] font-bold pt-0.5">First operator to 0 lives is eliminated.</p>
                    </div>
                </aside>

            </div>
        </main>
    );
}