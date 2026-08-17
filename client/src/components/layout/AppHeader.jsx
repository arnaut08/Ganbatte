import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PersonIcon } from '@radix-ui/react-icons';
import logo from '../../assets/logo.svg';

function UserAvatarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 14.5c0-2.5 4-4 7-4s7 1.5 7 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppHeader({
  onHome,
  onOpenFriends,
  onLogout,
  onOpenHistory,
  isAuthenticated,
  user = null,
  pendingFriendRequestCount = 0,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const userInitial = (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase();

  return (
    <header className="gradient-heading border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Button
          variant="link"
          className="flex items-center gap-3 p-0 text-foreground hover:text-primary"
          onClick={onHome}
          aria-label="Go to home"
        >
          <img src={logo} alt="Ganbatte logo" className="h-12 w-12 object-contain" />
          <div className="flex flex-col items-start">
            <h1 className="font-sora font-bold text-foreground">
              <span className="text-foreground text-xl">GANBATTE</span>
              <span className="text-primary text-l" lang="ja">
                頑張って
              </span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Stop saying 'Nani?' to everything.
            </p>
          </div>
        </Button>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border bg-background/60"
                aria-label="Open friends"
                title="Friends"
                onClick={onOpenFriends}
              >
                <PersonIcon className="h-4 w-4" />
              </Button>
              {pendingFriendRequestCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {pendingFriendRequestCount > 99 ? '99+' : pendingFriendRequestCount}
                </span>
              )}
            </div>

            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-13 w-13 rounded-full border border-border"
                  aria-label="Open user menu"
                  aria-expanded={isMenuOpen}
                  title="User menu"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 bg-popover border-border"
              >
                <div className="flex items-center gap-3 border-b border-border px-3 py-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {userInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner'}
                    </p>
                  </div>
                </div>
                <DropdownMenuItem onSelect={onOpenHistory}>
                  Assessment history
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onSelect={onLogout}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;