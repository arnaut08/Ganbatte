import React from 'react';

interface OnboardingScreenProps {
    displayName?: string;
    email?: string;
    onComplete: () => void;
}

export default function OnboardingScreen({
    displayName = 'Learner',
    email = '',
    onComplete,
}: OnboardingScreenProps) {
    return (
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
            {/* Section Breadcrumb */}
            <div className="w-full max-w-xl mb-3">
                <p className="text-xs font-mono font-bold tracking-wider text-[#a3e635] uppercase">
          // PROTOCOL: AUTHENTICATION
                </p>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                    PASSPORT ACTIVATED
                </h1>
            </div>

            {/* Primary Passport Card */}
            <div className="relative w-full max-w-xl bg-[#1c233a] border-4 border-black shadow-[8px_8px_0px_#000000] overflow-hidden">
                {/* Left yellow highlight accent line */}
                <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-[#fde047]" />

                <div className="p-6 sm:p-8 pl-8 sm:pl-10">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                        <div className="inline-flex items-center gap-2">
                            <span className="bg-[#fde047] text-black font-mono font-black text-xs px-2.5 py-1 uppercase tracking-wider border-2 border-black">
                                CLEARANCE // 01
                            </span>
                            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest hidden sm:inline">
                                [VERIFIED OPERATOR]
                            </span>
                        </div>
                        <span className="inline-block bg-[#a3e635] text-black font-mono font-black text-xs px-2 py-0.5 uppercase tracking-wide border-2 border-black">
                            STATUS: ONLINE
                        </span>
                    </div>

                    {/* User ID Section */}
                    <div className="border-2 border-black bg-[#121626] p-4 mb-6">
                        <div className="flex items-center justify-between border-b border-[#28314e] pb-2.5 mb-2.5">
                            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                                IDENTIFIER:
                            </span>
                            <span className="text-sm font-mono font-black text-[#fde047] uppercase tracking-wider">
                                {displayName}
                            </span>
                        </div>
                        {email && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                                    COMM LINK:
                                </span>
                                <span className="text-xs font-mono font-semibold text-gray-200">
                                    {email}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Directives Section */}
                    <div className="mb-8">
                        <p className="text-xs font-mono font-bold text-[#fde047] tracking-wider uppercase mb-2">
              // ACTIVE OPERATIONAL DIRECTIVES:
                        </p>
                        <ul className="space-y-2 text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                            <li className="flex items-start gap-2">
                                <span className="text-[#38bdf8] font-black font-mono">01.</span>
                                <span>Master Kana, Kanji, and Genki Grammar through active recall flashcards.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#a3e635] font-black font-mono">02.</span>
                                <span>Create live 1v1 rooms and challenge friends to speed-accuracy battles.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-[#c084fc] font-black font-mono">03.</span>
                                <span>Maintain your study streak to rank up your Mastery Passport.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Enter Arena CTA */}
                    <button
                        type="button"
                        onClick={onComplete}
                        className="w-full bg-white text-black font-black text-sm uppercase py-3.5 px-6 border-2 border-black shadow-[4px_4px_0px_#000000] hover:bg-[#fde047] hover:shadow-[6px_6px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000000] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <span>ENTER ARENA DASHBOARD</span>
                        <span className="font-mono text-base font-black">&rarr;</span>
                    </button>
                </div>
            </div>
        </main>
    );
}