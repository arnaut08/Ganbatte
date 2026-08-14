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

function AppHeader({ onHome, onLogout, onOpenHistory, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="gradient-heading border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Button
          variant="link"
          className="flex items-center gap-3 p-0 text-foreground hover:text-primary"
          onClick={onHome}
          aria-label="Go to home"
        >
          <img src={logo} alt="Ganbatte logo" className="h-10 w-10 object-contain" />
          <div className="flex flex-col items-start">
            <h1 className="font-sora text-xl font-bold text-foreground">
              <span className="text-foreground">GANBATTE</span>
              <span className="text-primary kana-font" lang="ja">
                頑張って
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Stop saying 'Nani?' to everything.
            </p>
          </div>
        </Button>

        {isAuthenticated && (
          <div>
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border"
                  aria-label="Open user menu"
                  aria-expanded={isMenuOpen}
                  title="User menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                      <UserAvatarIcon />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-popover border-border"
              >
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
