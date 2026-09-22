import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AvatarPickerModal } from './AvatarPickerModal';
import { AVATAR_OPTIONS } from '@/data/avatars';
import { supabase } from '@/config/supabase';
import type { UserProfileRecord } from '@/types';
import GlobalPageHeader from '@/components/common/GlobalPageHeader';

type EditProfilePageProps = {
    user: User;
    initialProfile?: UserProfileRecord;
    onBack?: () => void;
    onSave?: (updated: {
        displayName: string;
        location: string;
        learningGoal: string;
        bio: string;
        avatarUrl: string;
    }) => Promise<void> | void;
    onProfileSaved?: (profile: UserProfileRecord) => void;
    onDeleteAccount?: () => Promise<void>;
};

export default function EditProfilePage({
    user,
    initialProfile,
    onBack,
    onSave,
    onProfileSaved,
    onDeleteAccount,
}: EditProfilePageProps) {
    const [saveMessage, setSaveMessage] = useState('');
    const [displayName, setDisplayName] = useState(
        initialProfile?.displayName ?? user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? ''
    );
    const [location, setLocation] = useState(initialProfile?.location ?? '');
    const [learningGoal, setLearningGoal] = useState(initialProfile?.learningGoal ?? '');
    const [bio, setBio] = useState(initialProfile?.bio ?? '');
    const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatarUrl ?? '');
    const [accountTier, setAccountTier] = useState(initialProfile?.accountTier ?? 'N5 NOVICE');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');

    const userEmail = initialProfile?.email ?? user.email ?? 'NO EMAIL';

    useEffect(() => {
        if (!initialProfile) return;
        setDisplayName(initialProfile.displayName ?? '');
        setLocation(initialProfile.location ?? '');
        setLearningGoal(initialProfile.learningGoal ?? '');
        setBio(initialProfile.bio ?? '');
        setAvatarUrl(initialProfile.avatarUrl ?? '');
        setAccountTier(initialProfile.accountTier ?? 'N5 NOVICE');
    }, [initialProfile]);

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        setIsSaving(true);
        setSaveMessage('');
        try {
            if (onSave) {
                await onSave({
                    displayName: displayName.trim(),
                    location: location.trim(),
                    learningGoal: learningGoal.trim(),
                    bio: bio.trim(),
                    avatarUrl,
                });
            } else if (supabase) {
                const { error } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.id,
                        display_name: displayName.trim(),
                        location: location.trim() || null,
                        learning_goal: learningGoal.trim() || null,
                        bio: bio.trim() || null,
                        avatar_url: avatarUrl,
                        updated_at: new Date().toISOString(),
                    });
                if (error) {
                    setSaveMessage('SAVE FAILED. TRY AGAIN.');
                } else {
                    const { error: authError } = await supabase.auth.updateUser({
                        data: {
                            ...user.user_metadata,
                            full_name: displayName.trim(),
                            avatar_url: avatarUrl || null,
                        },
                    });
                    onProfileSaved?.({
                        id: user.id,
                        email: user.email,
                        displayName: displayName.trim(),
                        location: location.trim(),
                        learningGoal: learningGoal.trim(),
                        bio: bio.trim(),
                        avatarUrl,
                        accountTier,
                    });
                    setSaveMessage(authError ? 'SAVED (AUTH SYNC PENDING)' : 'PROFILE SAVED ✓');
                }
            } else {
                setSaveMessage('PROFILE STORAGE UNAVAILABLE');
            }
        } catch {
            setSaveMessage('SAVE FAILED. TRY AGAIN.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!onDeleteAccount || isDeleting) return;

        setIsDeleting(true);
        setDeleteMessage('');
        try {
            await onDeleteAccount();
        } catch {
            setDeleteMessage('ACCOUNT DELETION FAILED. TRY AGAIN.');
            setIsDeleting(false);
        }
    };

    return (
        <main className="container mx-auto max-w-5xl space-y-4 px-3 py-3 sm:space-y-6 sm:px-4 sm:py-8 pb-20 sm:pb-28">
            <GlobalPageHeader
                onBack={handleBack}
                punchline="// IDENTITY MODULE"
                title="EDIT PROFILE"
                accentClass="text-[#FFDE59]"
            />

            {/* 2. Unified Master Identity Form Arena */}
            <form onSubmit={handleFormSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 items-stretch">

                    {/* LEFT: Tactile Learner Pass (Passport / Arcade Badge Metaphor) */}
                    <div className="md:col-span-5 flex flex-col justify-between border-2 border-black border-l-6 sm:border-l-8 border-l-[#FFDE59] bg-[#1f2637] shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] overflow-hidden">

                        {/* Top Pass Strip Header */}
                        <div className="bg-[#151922] p-3 border-b-2 border-black flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="h-2 w-2 bg-[#FFDE59] border border-black inline-block" />
                                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FFDE59]">
                                    PASSPORT ID // OPERATOR
                                </span>
                            </div>
                            <span className="border border-black bg-[#FFDE59] px-1.5 py-0.2 font-mono text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-black">
                                ACTIVE
                            </span>
                        </div>

                        {/* Middle Badge Interactive Stage */}
                        <div className="p-4 sm:p-6 flex flex-col items-center justify-center space-y-4 flex-1">
                            <div className="relative group">
                                <div className="h-28 w-28 sm:h-36 sm:w-36 overflow-hidden border-2 sm:border-3 border-black bg-[#151922] shadow-[3px_3px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] transition-transform">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Learner Avatar"
                                            className="h-full w-full object-cover select-none pointer-events-none"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-[#FFDE59] font-mono text-4xl sm:text-5xl font-black text-black">
                                            {(displayName || 'U').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                <div className="absolute -top-1.5 -right-1.5 border border-black bg-black px-1.5 py-0.5 font-mono text-[8px] font-black text-[#FFDE59]">
                                    CHIP://01
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="cursor-pointer border-2 border-black bg-[#FFDE59] px-4 py-1.5 font-mono text-xs font-black uppercase text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-center"
                            >
                                Change Avatar ↺
                            </button>
                        </div>

                        {/* Bottom Diagnostic Spec Grid */}
                        <div className="border-t-2 border-black bg-[#151922] p-3 sm:p-4 grid grid-cols-2 gap-2">
                            <div className="border border-black/40 bg-[#1f2637] p-2">
                                <span className="block font-mono text-[8px] font-black uppercase text-neutral-400">IDENTIFIER</span>
                                <p className="font-mono text-xs font-black uppercase text-white truncate">
                                    {displayName.trim() || 'CADET'}
                                </p>
                            </div>
                            <div className="border border-black/40 bg-[#1f2637] p-2">
                                <span className="block font-mono text-[8px] font-black uppercase text-neutral-400">STATUS RANK</span>
                                <p className="font-mono text-xs font-black uppercase text-[#FFDE59] truncate">
                                    {accountTier}
                                </p>
                            </div>
                            <div className="col-span-2 border border-black/40 bg-[#1f2637] p-2">
                                <span className="block font-mono text-[8px] font-black uppercase text-neutral-400">SYSTEM EMAIL</span>
                                <p className="font-mono text-[10px] sm:text-xs font-bold text-neutral-300 truncate">
                                    {userEmail}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: High-Density Neo-Brutalist Form Console */}
                    <div className="md:col-span-7 flex flex-col justify-between border-2 border-black bg-[#1f2637] p-4 sm:p-6 shadow-[3.5px_3.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] space-y-4 sm:space-y-5">

                        <div className="border-b border-white/10 pb-2.5 flex items-center justify-between">
                            <span className="font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                // LEARNER CREDENTIAL DATA
                            </span>
                            <span className="font-mono text-[9px] font-bold text-[#FFDE59]">
                                * REQUIRED
                            </span>
                        </div>

                        {/* Display Name Input */}
                        <div className="space-y-1">
                            <label className="block font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                                DISPLAY NAME <span className="text-[#FFDE59]">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 sm:top-3 font-mono text-xs font-black text-neutral-500 select-none">
                                    &gt;
                                </span>
                                <input
                                    type="text"
                                    required
                                    value={displayName}
                                    placeholder="Enter operator callsign..."
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="h-10 sm:h-11 w-full border-2 border-black bg-[#151922] pl-8 pr-3 font-mono text-xs sm:text-sm font-bold text-white shadow-[2px_2px_0px_0px_#000] focus:border-[#FFDE59] focus:outline-none placeholder:text-neutral-600"
                                />
                            </div>
                        </div>

                        {/* Location & Goal 2-Col Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-1">
                                <label className="block font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                                    BASE LOCATION
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 sm:top-3 font-mono text-xs font-black text-neutral-500 select-none">
                                        &gt;
                                    </span>
                                    <input
                                        type="text"
                                        value={location}
                                        placeholder="e.g. Tokyo, NY"
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="h-10 sm:h-11 w-full border-2 border-black bg-[#151922] pl-8 pr-3 font-mono text-xs sm:text-sm font-bold text-white shadow-[2px_2px_0px_0px_#000] focus:border-[#FFDE59] focus:outline-none placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                                    PRIMARY TARGET
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 sm:top-3 font-mono text-xs font-black text-neutral-500 select-none">
                                        &gt;
                                    </span>
                                    <input
                                        type="text"
                                        value={learningGoal}
                                        placeholder="e.g. Pass N5, read manga"
                                        onChange={(e) => setLearningGoal(e.target.value)}
                                        className="h-10 sm:h-11 w-full border-2 border-black bg-[#151922] pl-8 pr-3 font-mono text-xs sm:text-sm font-bold text-white shadow-[2px_2px_0px_0px_#000] focus:border-[#FFDE59] focus:outline-none placeholder:text-neutral-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bio Field */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="block font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-neutral-300">
                                    OPERATOR TRANSMISSION (BIO)
                                </label>
                                <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-400">
                                    {bio.length} / 160
                                </span>
                            </div>
                            <textarea
                                rows={3}
                                maxLength={160}
                                value={bio}
                                placeholder="Tell the dojo a little about yourself..."
                                onChange={(e) => setBio(e.target.value)}
                                className="w-full border-2 border-black bg-[#151922] p-3 font-mono text-xs sm:text-sm font-medium text-white shadow-[2px_2px_0px_0px_#000] focus:border-[#FFDE59] focus:outline-none placeholder:text-neutral-600 resize-none"
                            />
                        </div>

                        {/* Status Feedback & Submit Action Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t-2 border-white/10 mt-auto">
                            <div className="min-h-[1.25rem] flex items-center">
                                {saveMessage && (
                                    <span
                                        className={`font-mono text-[10px] font-black uppercase tracking-wider border border-black px-2 py-0.5 ${saveMessage.includes('FAILED')
                                            ? 'bg-[#FF6B6B] text-black'
                                            : 'bg-[#FFDE59] text-black'
                                            }`}
                                        role="status"
                                    >
                                        {saveMessage}
                                    </span>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isSaving || !displayName.trim()}
                                className="w-full sm:w-auto cursor-pointer border-2 border-black bg-[#FFDE59] px-6 py-2.5 font-mono text-xs sm:text-sm font-black uppercase tracking-wider text-black shadow-[2.5px_2.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 text-center"
                            >
                                {isSaving ? 'UPDATING...' : 'SAVE CHANGES →'}
                            </button>
                        </div>

                    </div>
                </div>
            </form>

            {/* 3. Neo-Brutalist Danger Zone Block */}
            <section
                className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#FF6B6B] bg-[#1f2637] shadow-[2.5px_2.5px_0px_0px_#000] sm:shadow-[4px_4px_0px_0px_#000] overflow-hidden"
                aria-labelledby="danger-zone-title"
            >
                {/* Header Bar */}
                <div className="bg-[#151922] px-3.5 py-2.5 sm:px-4 sm:py-3 border-b-2 border-black flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-[#FF6B6B] border border-black inline-block" />
                        <span
                            id="danger-zone-title"
                            className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#FF6B6B]"
                        >
                    // DANGER ZONE
                        </span>
                    </div>
                    <span className="border border-black bg-[#FF6B6B] px-1.5 py-0.2 font-mono text-[7px] sm:text-[8px] font-black uppercase tracking-wider text-black">
                        CRITICAL
                    </span>
                </div>

                {/* Main Content Area */}
                <div className="p-3.5 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <h3 className="font-mono text-xs sm:text-sm font-black uppercase text-white leading-none">
                                Permanent Account Termination
                            </h3>
                            <p className="font-mono text-[10px] sm:text-xs font-bold text-neutral-400">
                                Permanently erase your identity chip, stats, and learning progress.
                            </p>
                        </div>

                        {!isDeleteConfirmationOpen && (
                            <button
                                type="button"
                                onClick={() => setIsDeleteConfirmationOpen(true)}
                                className="w-full sm:w-auto cursor-pointer border-2 border-black bg-[#FF6B6B] px-4 py-2 sm:px-5 sm:py-2.5 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[2.5px_2.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-center"
                            >
                                Delete Account →
                            </button>
                        )}
                    </div>

                    {/* Tactile In-Card Confirmation Drawer */}
                    {isDeleteConfirmationOpen && (
                        <div className="mt-4 border-2 border-black bg-[#151922] p-3 sm:p-4 shadow-[2px_2px_0px_0px_#000] space-y-3">
                            <div className="flex items-start gap-2.5">
                                <span className="border border-black bg-[#FF6B6B] px-1.5 font-mono text-[9px] font-black text-black shrink-0">
                                    WARNING
                                </span>
                                <p className="font-mono text-[10px] sm:text-xs font-black uppercase text-white leading-relaxed">
                                    This action is irreversible. All Kana/Kanji progress and match records will be wiped immediately.
                                </p>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-2.5 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setIsDeleteConfirmationOpen(false)}
                                    disabled={isDeleting}
                                    className="w-full sm:w-auto cursor-pointer border-2 border-black bg-white px-4 py-1.5 sm:py-2 font-mono text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 text-center"
                                >
                                    Keep Account
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="w-full sm:w-auto cursor-pointer border-2 border-black bg-[#FF6B6B] px-4 py-1.5 sm:py-2 font-mono text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 text-center"
                                >
                                    {isDeleting ? 'Terminating...' : 'Yes, Delete Permanently'}
                                </button>
                            </div>

                            {deleteMessage && (
                                <div className="border border-black bg-[#FF6B6B]/20 p-2 text-center">
                                    <span className="font-mono text-[10px] font-black uppercase text-[#FF6B6B]" role="alert">
                                        {deleteMessage}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Avatar Modal */}
            <AvatarPickerModal
                isOpen={isModalOpen}
                selectedAvatarUrl={avatarUrl}
                onSelect={(url) => setAvatarUrl(url)}
                onClose={() => setIsModalOpen(false)}
            />
        </main>
    );
}