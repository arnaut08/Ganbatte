import React from 'react';
import { AVATAR_OPTIONS, AvatarOption } from '@/data/avatars';

interface AvatarModalProps {
    isOpen: boolean;
    selectedAvatarUrl: string;
    onSelect: (url: string) => void;
    onClose: () => void;
}

export const AvatarPickerModal: React.FC<AvatarModalProps> = ({
    isOpen,
    selectedAvatarUrl,
    onSelect,
    onClose,
}) => {
    if (!isOpen) return null;

    const handleSelect = (avatar: AvatarOption) => {
        onSelect(avatar.url);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-3 sm:px-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-md border-2 border-black bg-[#1f2637] shadow-[6px_6px_0px_0px_#000] sm:shadow-[8px_8px_0px_0px_#000] overflow-hidden">

                {/* 1. Header Banner matching Kana/Study Cards */}
                <div className="bg-[#FFDE59] px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-black flex items-center justify-between">
                    <div className="flex flex-col text-left">
                        <span className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-black leading-none">
              // IDENTITY MODULE
                        </span>
                        <h2 className="mt-0.5 font-mono text-sm sm:text-base font-black uppercase tracking-tight text-black leading-none">
                            CHOOSE LEARNER AVATAR
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black font-mono text-xs font-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
                    >
                        ✕
                    </button>
                </div>

                {/* 2. Inner Well Content */}
                <div className="p-3 sm:p-4 space-y-3">
                    {/* Sunken Arcade Tray */}
                    <div className="border-2 border-black bg-[#151922] p-2.5 sm:p-3 shadow-[2.5px_2.5px_0px_0px_#000]">
                        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                            {AVATAR_OPTIONS.map((item: AvatarOption) => {
                                const isEquipped = selectedAvatarUrl === item.url;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => handleSelect(item)}
                                        className={`group relative aspect-square border-2 border-black p-0.5 transition-all cursor-pointer flex items-center justify-center ${isEquipped
                                                ? 'border-[#FFDE59] bg-[#FFDE59] shadow-[2.5px_2.5px_0px_0px_#FFDE59]'
                                                : 'bg-[#1f2637] hover:border-white hover:translate-x-[1px] hover:translate-y-[1px] shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                                            }`}
                                        title={item.name}
                                    >
                                        <div className="h-full w-full overflow-hidden border border-black bg-black">
                                            <img
                                                src={item.url}
                                                alt={item.name}
                                                className="h-full w-full object-cover select-none pointer-events-none"
                                            />
                                        </div>

                                        {/* Physical Badge on Equipped Item */}
                                        {isEquipped && (
                                            <span className="absolute -top-1.5 -right-1.5 border border-black bg-[#FFDE59] px-1 font-mono text-[7px] font-black text-black shadow-[1px_1px_0px_0px_#000] leading-tight">
                                                EQUIPPED
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Bottom HUD Strip */}
                    <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] uppercase font-bold text-neutral-400 px-0.5">
                        <span>&gt; TAP TO SELECT IDENTITY</span>
                        <span className="text-white font-black">{AVATAR_OPTIONS.length} TOTAL</span>
                    </div>
                </div>

            </div>
        </div>
    );
};