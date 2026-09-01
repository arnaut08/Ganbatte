import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MagnifyingGlassIcon, TrashIcon } from '@radix-ui/react-icons';
import type { Friend, FriendRequest } from '../../types';

type FriendsPanelProps = {
  friends?: Friend[];
  searchResults?: Friend[];
  friendRequests?: FriendRequest[];
  onSearchUsers?: (query: string) => void;
  onSendFriendRequest?: (userId: string) => void;
  onAcceptFriendRequest?: (requestId: string) => void;
  onRejectFriendRequest?: (requestId: string) => void;
  onRemoveFriend?: (userId: string) => void;
  onChallengeFriend?: (userId: string) => void;
  isSearching?: boolean;
  onBack: () => void;
};

type LegacyControlProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyControlProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyControlProps>;

// Cycle avatar accent colors
const AVATAR_COLORS = ['bg-[#FFDE59]', 'bg-[#70CFF8]', 'bg-[#C084FC]', 'bg-[#A3E636]'];

export default function FriendsPanel({
  friends = [],
  searchResults = [],
  friendRequests = [],
  onSearchUsers,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  onChallengeFriend,
  isSearching = false,
  onBack,
}: FriendsPanelProps) {
  const [query, setQuery] = useState('');
  const onSearchUsersRef = useRef(onSearchUsers);

  useEffect(() => {
    onSearchUsersRef.current = onSearchUsers;
  }, [onSearchUsers]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      onSearchUsersRef.current?.('');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onSearchUsersRef.current?.(trimmed);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [query]);

  const friendIds = new Set(
    friends
      .map((friend) => friend?.user_id ?? friend?.id)
      .filter(Boolean)
      .map(String),
  );

  const pendingRequestSenderIds = new Set(
    friendRequests
      .filter((request) => request?.direction === 'outgoing')
      .map((request) => request?.receiver_id ?? request?.receiver?.id)
      .filter(Boolean)
      .map(String),
  );

  const visibleResults = searchResults.filter(
    (person) => !friendIds.has(String(person?.user_id ?? person?.id ?? '')),
  );

  const hasQuery = Boolean(query.trim());
  const onlineCount = friends.filter((f) => f.online).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 px-3 py-3 sm:space-y-6 sm:px-4 sm:py-8 pb-20 sm:pb-28">
      {/* 1. Header Bar: Responsive Wrapping */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Back to previous screen"
            aria-label="Back"
          >
            <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
          </button>

          <div className="flex flex-col -mt-1 sm:-mt-1.5 text-left">
            <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#70CFF8] leading-tight">
              00 // MULTIPLAYER NETWORK
            </span>
            <h1 className="mt-0.5 text-lg sm:text-3xl font-black uppercase leading-tight tracking-tight text-white">
              Friends &amp; Rivalries
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto pl-10 sm:pl-0">
          <span className="border-2 border-black bg-[#A3E636] px-2 py-0.5 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-3 sm:py-1 sm:shadow-[2px_2px_0px_0px_#000]">
            {onlineCount} ONLINE
          </span>
          <span className="border-2 border-black bg-white px-2 py-0.5 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] sm:px-3 sm:py-1 sm:shadow-[2px_2px_0px_0px_#000]">
            {friends.length} TOTAL
          </span>
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid gap-3.5 sm:gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT COLUMN: Search & Incoming Requests */}
        <div className="space-y-3.5 sm:space-y-6">
          {/* SEARCH CARD */}
          <div className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#70CFF8] bg-[#1f2637] p-3.5 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]">
            <div className="mb-1.5 flex items-center justify-between sm:mb-3">
              <span className="border-2 border-black bg-[#70CFF8] px-1.5 py-0.2 font-mono text-[8px] sm:text-[10px] font-black uppercase tracking-wider text-black shadow-[1px_1px_0px_0px_#000]">
                DISCOVER
              </span>
              <span className="font-mono text-[9px] sm:text-xs font-bold text-[#70CFF8]">
                // SEARCH USERS
              </span>
            </div>

            <h2 className="text-base font-black uppercase tracking-tight text-white sm:text-xl">
              Add New Learners
            </h2>
            <p className="mt-0.5 font-mono text-[11px] font-medium text-neutral-300 sm:text-xs">
              Search by username to send friend requests and 1v1 battle invites.
            </p>

            {/* Search Input Box */}
            <div className="mt-2.5 space-y-2 sm:mt-4">
              <div className="relative flex items-center">
                <MagnifyingGlassIcon className="absolute left-3 h-4 w-4 text-neutral-400 select-none" />
                <LegacyInput
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="h-9 w-full border-2 border-black bg-[#151922] pl-9 pr-3 font-mono text-xs font-black text-white shadow-[2px_2px_0px_0px_#000] placeholder:font-mono placeholder:text-[11px] placeholder:font-medium placeholder:text-neutral-500 focus-visible:border-[#70CFF8] focus-visible:ring-0 focus:outline-none sm:h-11 sm:text-sm"
                />
              </div>

              {isSearching && (
                <p className="font-mono text-[10px] font-bold text-[#70CFF8] animate-pulse sm:text-xs">
                  Searching database...
                </p>
              )}

              {hasQuery && !isSearching && visibleResults.length === 0 && (
                <div className="border-2 border-dashed border-white/20 bg-[#151922] p-2.5 text-center sm:p-3">
                  <p className="font-mono text-[10px] font-bold text-neutral-400 sm:text-xs">
                    No users found matching &quot;{query}&quot;.
                  </p>
                </div>
              )}
            </div>

            {/* Search Matches List */}
            {hasQuery && visibleResults.length > 0 && (
              <div className="mt-3 space-y-2 border-t-2 border-white/10 pt-3 sm:mt-4">
                <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#70CFF8] sm:text-[10px]">
                  MATCHES FOUND ({visibleResults.length})
                </span>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {visibleResults.map((person, idx) => {
                    const personId = String(person?.user_id ?? person?.id ?? '');
                    const requestPending = pendingRequestSenderIds.has(personId);
                    const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                    return (
                      <div
                        key={person.id}
                        className="flex items-center justify-between border-2 border-black bg-[#151922] p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black font-mono text-xs font-black text-black shadow-[1px_1px_0px_0px_#000] sm:h-9 sm:w-9 ${avatarBg}`}
                          >
                            {person.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="truncate font-mono text-xs font-black uppercase tracking-tight text-white sm:text-sm">
                              {person.display_name}
                            </p>
                            <span className="font-mono text-[8px] font-bold text-neutral-400 sm:text-[10px]">
                              LEARNER
                            </span>
                          </div>
                        </div>

                        <div className="ml-2 shrink-0">
                          {requestPending ? (
                            <span className="inline-flex items-center border-2 border-black bg-[#1f2637] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-neutral-400 sm:px-2.5 sm:py-1 sm:text-xs">
                              Pending
                            </span>
                          ) : (
                            <LegacyButton
                              size="sm"
                              onClick={() => personId && onSendFriendRequest?.(personId)}
                              className="h-7 sm:h-9 cursor-pointer border-2 border-black bg-[#A3E636] px-2.5 sm:px-4 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                              + Add
                            </LegacyButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* INCOMING REQUESTS PANEL */}
          {friendRequests.filter((r) => r?.direction !== 'outgoing').length > 0 && (
            <div className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#FFDE59] bg-[#1f2637] p-3.5 text-white shadow-[3px_3px_0px_0px_#000] sm:p-5 sm:shadow-[4px_4px_0px_0px_#000]">
              <div className="mb-2 flex items-center justify-between border-b-2 border-white/10 pb-2 sm:mb-3">
                <span className="font-mono text-[9px] sm:text-xs font-black uppercase tracking-wider text-[#FFDE59]">
                  // INCOMING CHALLENGES
                </span>
                <span className="border-2 border-black bg-[#FFDE59] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[8px] sm:text-[10px] font-black uppercase text-black shadow-[1px_1px_0px_0px_#000]">
                  {friendRequests.filter((r) => r?.direction !== 'outgoing').length} NEW
                </span>
              </div>

              <div className="space-y-2">
                {friendRequests
                  .filter((r) => r?.direction !== 'outgoing')
                  .map((request, idx) => {
                    const avatarBg = AVATAR_COLORS[(idx + 1) % AVATAR_COLORS.length];
                    return (
                      <div
                        key={request.id}
                        className="flex items-center justify-between gap-2 border-2 border-black bg-[#151922] p-2 sm:p-2.5 shadow-[2px_2px_0px_0px_#000]"
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center border-2 border-black font-mono text-xs font-black text-black shadow-[1px_1px_0px_0px_#000] sm:h-9 sm:w-9 ${avatarBg}`}
                          >
                            {request.sender?.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="truncate font-mono text-xs font-black uppercase text-white sm:text-sm">
                              {request.sender?.display_name || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span
                                className={`h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black ${request.sender?.online ? 'bg-[#A3E636]' : 'bg-neutral-600'
                                  }`}
                              />
                              <span className="font-mono text-[8px] sm:text-[10px] font-bold text-neutral-400">
                                {request.sender?.online ? 'ONLINE' : 'OFFLINE'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <LegacyButton
                            size="sm"
                            onClick={() => onAcceptFriendRequest?.(request.id)}
                            className="h-7 sm:h-8 cursor-pointer border-2 border-black bg-[#A3E636] px-2 sm:px-3 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Accept
                          </LegacyButton>
                          <LegacyButton
                            size="sm"
                            onClick={() => onRejectFriendRequest?.(request.id)}
                            className="h-7 sm:h-8 cursor-pointer border-2 border-black bg-white px-2 sm:px-3 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            Decline
                          </LegacyButton>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Friends List */}
        <div className="border-2 border-black border-l-6 sm:border-l-8 border-l-[#A3E636] bg-[#1f2637] p-3.5 text-white shadow-[3.5px_3.5px_0px_0px_#000] sm:p-5 sm:shadow-[6px_6px_0px_0px_#000]">
          <div className="mb-2.5 flex items-center justify-between border-b-2 border-white/10 pb-2 sm:mb-4 sm:pb-3">
            <div>
              <span className="font-mono text-[9px] font-black uppercase tracking-wider text-[#A3E636] sm:text-[10px]">
                // BATTLE ROSTER
              </span>
              <h2 className="text-base font-black uppercase tracking-tight text-white sm:text-xl">
                Active Friends
              </h2>
            </div>
            <span className="border-2 border-black bg-[#151922] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[9px] sm:text-xs font-black text-white shadow-[1px_1px_0px_0px_#000]">
              {friends.length} CONNECTED
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 bg-[#151922] p-5 text-center sm:p-8">
              <p className="font-mono text-[11px] font-bold uppercase text-neutral-400 sm:text-xs">
                No friends added yet.
              </p>
              <p className="mt-1 font-mono text-[10px] text-neutral-500 sm:text-xs">
                Use the search box on the left to connect with opponents.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {friends.map((friend, idx) => {
                const avatarBg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                const friendId = String(friend.user_id ?? friend.id ?? '');

                return (
                  <div
                    key={friend.id || friend.user_id}
                    className={`flex items-center justify-between border-2 border-black p-2 sm:p-3 shadow-[2px_2px_0px_0px_#000] transition-all sm:shadow-[3px_3px_0px_0px_#000] ${friend.online ? 'bg-[#151922]' : 'bg-[#151922]/60'
                      }`}
                  >
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black font-mono text-xs font-black text-black shadow-[1px_1px_0px_0px_#000] sm:h-10 sm:w-10 sm:text-sm ${avatarBg}`}
                      >
                        {friend.display_name?.charAt(0)?.toUpperCase() || 'F'}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="truncate font-mono text-xs font-black uppercase text-white sm:text-sm">
                          {friend.display_name}
                        </p>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <span
                            className={`h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black ${friend.online ? 'bg-[#A3E636] animate-pulse' : 'bg-neutral-600'
                              }`}
                          />
                          <span
                            className={`font-mono text-[8px] sm:text-[10px] font-bold uppercase ${friend.online ? 'text-[#A3E636]' : 'text-neutral-500'
                              }`}
                          >
                            {friend.online ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2">
                      {friend.online && onChallengeFriend && (
                        <button
                          type="button"
                          onClick={() => onChallengeFriend(friendId)}
                          className="cursor-pointer border-2 border-black bg-[#A3E636] px-2 py-1 font-mono text-[9px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#b5eb5b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          title="Invite to 1v1 Match"
                        >
                          1v1 ⚔
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (friendId) onRemoveFriend?.(friendId);
                        }}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 cursor-pointer items-center justify-center border-2 border-black bg-white text-black shadow-[1.5px_1.5px_0px_0px_#000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:bg-[#FF6B6B] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                        title="Remove friend"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}