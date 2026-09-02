import { useState, useEffect, type ButtonHTMLAttributes, type ComponentType, type HTMLAttributes } from 'react';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonIcon } from '@radix-ui/react-icons';
import logo from '../../assets/logo.svg';
import { supabase } from '@/config/supabase';
import type { UserProfileRecord } from '@/types';

const TypedButton = Button as ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>;
const TypedDropdownMenuContent = DropdownMenuContent as ComponentType<HTMLAttributes<HTMLDivElement> & { align?: string; sideOffset?: number }>;
const TypedDropdownMenuItem = DropdownMenuItem as ComponentType<HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }>;

type AppHeaderProps = {
  onHome: () => void;
  onOpenFriends: () => void;
  onOpenProfile: () => void;
  onProfileLoaded: (profile: UserProfileRecord) => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenPassport: () => void;
  isAuthenticated: boolean;
  user?: User | null;
  pendingFriendRequestCount?: number;
};

export default function AppHeader({
  onHome,
  onOpenFriends,
  onOpenProfile,
  onProfileLoaded,
  onLogout,
  onOpenHistory,
  onOpenPassport,
  isAuthenticated,
  user = null,
  pendingFriendRequestCount = 0,
}: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const userInitial = (
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'U'
  )
    .charAt(0)
    .toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url || profileAvatarUrl;

  useEffect(() => {
    const client = supabase;
    if (!user || !client) {
      setProfileAvatarUrl(null);
      return undefined;
    }

    let isMounted = true;
    client
      .from('profiles')
      .select('id, display_name, location, learning_goal, bio, avatar_url, account_tier')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!isMounted) return;
        setProfileAvatarUrl(data?.avatar_url ?? null);
        if (data) {
          onProfileLoaded({
            id: data.id,
            email: user.email,
            displayName: data.display_name,
            location: data.location,
            learningGoal: data.learning_goal,
            bio: data.bio,
            avatarUrl: data.avatar_url,
            accountTier: data.account_tier,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [onProfileLoaded, user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full px-4 sm:px-8 transition-colors duration-200 ${isScrolled
          ? 'bg-[#1a1f2c]/75 backdrop-blur-md border-b border-black/30'
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
        {/* Left: Brand Logo & Slogan */}
        <button
          type="button"
          onClick={onHome}
          aria-label="Go to home"
          className="group flex min-w-0 cursor-pointer items-center gap-2.5 sm:gap-3.5 border-0 bg-transparent p-0 text-left transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
        >
          <div className="-rotate-3 flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-[#FFDE59] shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-transform duration-150 group-hover:rotate-0">
            <img src={logo} alt="Ganbatte Logo" className="h-7 w-7 sm:h-9 sm:w-9 scale-110 object-contain brightness-0" />
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="font-mono text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-none">
                GANBATTE
              </span>
              <span className="shrink-0 border-2 border-black bg-[#A3E636] px-1 py-0.5 sm:px-1.5 font-mono text-[9px] sm:text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] leading-none">
                頑張って
              </span>
            </div>
            <span className="mt-0.5 sm:mt-1 block truncate font-mono text-[10px] sm:text-xs font-bold text-[#FF6B6B] tracking-tight sm:tracking-wide">
              // Stop saying &apos;Nani?&apos; to everything.
            </span>
          </div>
        </button>

        {/* Right: Social & Profile HUD Actions */}
        {isAuthenticated && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Friends Button */}
            <div className="relative">
              <TypedButton
                variant="neutral"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded-none border-2 border-black bg-[#252c3d] text-white shadow-[2px_2px_0px_0px_#000] sm:shadow-[2.5px_2.5px_0px_0px_#000] transition-all hover:bg-[#343d52] hover:text-[#FFDE59] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                aria-label="Open friends"
                title="Friends"
                onClick={onOpenFriends}
              >
                <PersonIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </TypedButton>
              {pendingFriendRequestCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 sm:h-5 sm:min-w-5 items-center justify-center border-2 border-black bg-[#FF6B6B] px-1 font-mono text-[9px] sm:text-[10px] font-black text-black shadow-[1px_1px_0px_0px_#000]">
                  {pendingFriendRequestCount > 99 ? '99+' : pendingFriendRequestCount}
                </span>
              )}
            </div>

            {/* User Dropdown */}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <TypedButton
                  variant="neutral"
                  size="icon"
                  className="h-9 w-9 sm:h-11 sm:w-11 cursor-pointer border-2 border-black bg-[#A3E636] p-0 text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  aria-label="Open user menu"
                  aria-expanded={isMenuOpen}
                  title="User menu"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-mono text-sm sm:text-lg font-black uppercase">{userInitial}</span>
                  )}
                </TypedButton>
              </DropdownMenuTrigger>

              <TypedDropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-60 sm:w-64 border-2 border-black bg-[#1f2637] p-1.5 shadow-[5px_5px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000]"
              >
                {/* User Info Header */}
                <div className="mb-1.5 flex items-center gap-2.5 border-2 border-black bg-[#151922] p-2 sm:p-2.5">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center border-2 border-black bg-[#A3E636] font-mono text-xs sm:text-sm font-black text-black shadow-[1.5px_1.5px_0px_0px_#000]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs font-black uppercase tracking-tight text-white leading-tight">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'}
                    </p>
                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#A3E636]">
                      <span className="h-1.5 w-1.5 bg-[#A3E636]" /> ONLINE
                    </span>
                  </div>
                </div>

                <TypedDropdownMenuItem
                  onSelect={onOpenProfile}
                  className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-xs font-black uppercase text-white transition-all hover:border-black hover:bg-[#A3E636] hover:text-black focus:border-black focus:bg-[#A3E636] focus:text-black"
                >
                  <span>Edit Profile</span>
                  <span className="text-sm font-bold">&rarr;</span>
                </TypedDropdownMenuItem>

                <TypedDropdownMenuItem
                  onSelect={onOpenPassport}
                  className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-xs font-black uppercase text-white transition-all hover:border-black hover:bg-[#252c3d] focus:border-black focus:bg-[#252c3d]"
                >
                  <span>Mastery Passport</span>
                  <span className="text-sm font-bold">&rarr;</span>
                </TypedDropdownMenuItem>

                <TypedDropdownMenuItem
                  onSelect={onOpenHistory}
                  className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-xs font-black uppercase text-white transition-all hover:border-black hover:bg-[#FFDE59] hover:text-black focus:border-black focus:bg-[#FFDE59] focus:text-black"
                >
                  <span>Assessment History</span>
                  <span className="text-sm font-bold">&rarr;</span>
                </TypedDropdownMenuItem>

                <div className="my-1 border-t-2 border-black/40" />

                <TypedDropdownMenuItem
                  onSelect={onLogout}
                  className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 sm:px-3 sm:py-2 font-mono text-xs font-black uppercase text-[#FF6B6B] transition-all hover:border-black hover:bg-[#FF6B6B] hover:text-black focus:border-black focus:bg-[#FF6B6B] focus:text-black"
                >
                  <span>Log Out</span>
                  <span className="font-mono text-xs font-bold">[ESC]</span>
                </TypedDropdownMenuItem>
              </TypedDropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}