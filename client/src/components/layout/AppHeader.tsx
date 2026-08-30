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

const TypedButton = Button as ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>;
const TypedDropdownMenuContent = DropdownMenuContent as ComponentType<HTMLAttributes<HTMLDivElement> & { align?: string; sideOffset?: number }>;
const TypedDropdownMenuItem = DropdownMenuItem as ComponentType<HTMLAttributes<HTMLDivElement> & { onSelect?: () => void }>;

type AppHeaderProps = {
  onHome: () => void;
  onOpenFriends: () => void;
  onLogout: () => void;
  onOpenHistory: () => void;
  onOpenPassport: () => void;
  isAuthenticated: boolean;
  user?: User | null;
  pendingFriendRequestCount?: number;
};

function AppHeader({
  onHome,
  onOpenFriends,
  onLogout,
  onOpenHistory,
  onOpenPassport,
  isAuthenticated,
  user = null,
  pendingFriendRequestCount = 0,
}: AppHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userInitial = (
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'U'
  )
    .charAt(0)
    .toUpperCase();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full px-3 transition-all duration-300 sm:px-6 ${isScrolled
          ? 'border-b border-white/10 bg-[#131722]/80 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
          : 'border-b border-transparent bg-transparent shadow-none'
        }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 sm:h-20 sm:gap-4">
        <button
          type="button"
          onClick={onHome}
          aria-label="Go to home"
          className="group flex min-w-0 items-center gap-2 rounded-none border-0 bg-transparent p-0 text-left shadow-none transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] sm:gap-3.5"
        >
          <div className="-rotate-3 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border-2 border-black bg-[#FFDE59] shadow-[2px_2px_0px_0px_#000000] transition-transform duration-150 group-hover:rotate-0 sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000000]">
            <img src={logo} alt="Ganbatte Logo" className="h-7 w-7 object-contain brightness-0 scale-110 sm:h-9 sm:w-9" />
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="font-black text-base tracking-tight text-white uppercase leading-none sm:text-2xl">GANBATTE</span>
              <span className="shrink-0 border-2 border-black bg-[#A3E636] px-1 py-0.5 text-[9px] font-black text-black shadow-[1.5px_1.5px_0px_0px_#000000] leading-none sm:px-1.5 sm:text-xs sm:shadow-[2px_2px_0px_0px_#000000]">頑張って</span>
            </div>
            <span className="mt-0.5 block truncate font-mono text-[10px] font-bold text-[#FF6B6B] tracking-tight sm:mt-1 sm:text-xs sm:tracking-wide">
              // Stop saying &apos;Nani?&apos; to everything.
            </span>
          </div>
        </button>

        {isAuthenticated && (
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative">
              <TypedButton variant="neutral" size="icon" className="h-8 w-8 rounded-none border-2 border-black bg-[#252c3d] text-white shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-[#343d52] hover:text-[#FFDE59] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:h-10 sm:w-10 sm:shadow-[2.5px_2.5px_0px_0px_#000000]" aria-label="Open friends" title="Friends" onClick={onOpenFriends}>
                <PersonIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </TypedButton>
              {pendingFriendRequestCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center border-2 border-black bg-[#FF6B6B] px-1 text-[9px] font-black text-black sm:h-5 sm:min-w-5 sm:text-[10px]">
                  {pendingFriendRequestCount > 99 ? '99+' : pendingFriendRequestCount}
                </span>
              )}
            </div>

            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <TypedButton variant="neutral" size="icon" className="h-9 w-9 border-2 border-black bg-[#A3E636] p-0 text-black shadow-[2px_2px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1.5px_1.5px_0px_0px_#000000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none sm:h-11 sm:w-11 sm:shadow-[3px_3px_0px_0px_#000000]" aria-label="Open user menu" aria-expanded={isMenuOpen} title="User menu">
                  <span className="font-mono text-sm font-black uppercase sm:text-lg">{userInitial}</span>
                </TypedButton>
              </DropdownMenuTrigger>

              <TypedDropdownMenuContent align="end" sideOffset={8} className="w-60 border-2 border-black bg-[#1a1f2c] p-1.5 shadow-[5px_5px_0px_0px_#000000] sm:w-64 sm:shadow-[6px_6px_0px_0px_#000000]">
                <div className="mb-1.5 flex items-center gap-2.5 border-2 border-black bg-[#252c3d] p-2 sm:p-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black bg-[#A3E636] font-mono text-xs font-black text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:h-9 sm:w-9 sm:text-sm">{userInitial}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black uppercase tracking-tight text-white leading-tight">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'}</p>
                    <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-[#A3E636]"><span className="h-1.5 w-1.5 bg-[#A3E636]" /> ONLINE</span>
                  </div>
                </div>

                <TypedDropdownMenuItem onSelect={onOpenPassport} className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 font-mono text-xs font-black uppercase text-white transition-all hover:border-black hover:bg-[#252c3d] hover:text-white focus:border-black focus:bg-[#252c3d] focus:text-white sm:px-3 sm:py-2">
                  <span>Mastery Passport</span><span className="text-sm font-bold">&rarr;</span>
                </TypedDropdownMenuItem>

                <TypedDropdownMenuItem onSelect={onOpenHistory} className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 font-mono text-xs font-black uppercase text-white transition-all hover:border-black hover:bg-[#FFDE59] hover:text-black focus:border-black focus:bg-[#FFDE59] focus:text-black sm:px-3 sm:py-2">
                  <span>Assessment History</span><span className="text-sm font-bold">&rarr;</span>
                </TypedDropdownMenuItem>
                <div className="my-1 border-t-2 border-black/40" />
                <TypedDropdownMenuItem onSelect={onLogout} className="flex cursor-pointer items-center justify-between border-2 border-transparent px-2.5 py-1.5 font-mono text-xs font-black uppercase text-[#FF6B6B] transition-all hover:border-black hover:bg-[#FF6B6B] hover:text-black focus:border-black focus:bg-[#FF6B6B] focus:text-black sm:px-3 sm:py-2">
                  <span>Log Out</span><span className="font-mono text-xs font-bold">[ESC]</span>
                </TypedDropdownMenuItem>
              </TypedDropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;