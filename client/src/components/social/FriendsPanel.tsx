import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  isSearching?: boolean;
  onBack: () => void;
};

type LegacyControlProps = {
  children?: ReactNode;
  [key: string]: unknown;
};

const LegacyButton = Button as unknown as ComponentType<LegacyControlProps>;
const LegacyInput = Input as unknown as ComponentType<LegacyControlProps>;

function FriendsPanel({
  friends = [],
  searchResults = [],
  friendRequests = [],
  onSearchUsers,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRejectFriendRequest,
  onRemoveFriend,
  isSearching = false,
  onBack
}: FriendsPanelProps) {
  const [query, setQuery] = useState('');
  const onSearchUsersRef = useRef(onSearchUsers);

  // Keep the ref in sync with the latest callback without re-triggering the debounce effect.
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

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3.5 sm:space-y-6 px-3 py-3 sm:px-4 sm:py-6 pb-20 sm:pb-28">
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 sm:h-11 sm:w-11 shrink-0 items-center justify-center border-2 border-black bg-white text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            title="Back to previous screen"
          >
            <span className="font-mono text-sm sm:text-lg font-black">&lt;</span>
          </button>

          <div className="flex flex-col justify-center">
            <span className="font-mono text-[9px] sm:text-xs font-bold uppercase tracking-wider text-[#FFDE59]">
          // SOCIAL: NETWORK
            </span>
            <h1 className="text-base sm:text-2xl font-black uppercase tracking-tight text-white leading-tight">
              Friends &amp; Requests
            </h1>
          </div>
        </div>

        <div className="border-2 border-black bg-[#A3E636] px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]">
          {friends.length} FRIEND{friends.length === 1 ? '' : 'S'}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="grid gap-3.5 sm:gap-6 md:grid-cols-2 md:items-start">
        {/* LEFT COLUMN: Search & Pending Incoming Requests */}
        <div className="space-y-3.5 sm:space-y-6">
          {/* 1. SEARCH HERO CARD */}
          <div className="relative border-2 border-black bg-[#70CFF8] p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
            <div className="mb-2 sm:mb-3 flex items-center justify-between">
              <span className="border-2 border-black bg-black px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#70CFF8]">
                LOOKUP
              </span>
              <span className="font-mono text-[10px] sm:text-xs font-bold text-black/70">
                [ADD USERS]
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-black">
              Find Friends
            </h2>
            <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-black/80">
              Search learners by username to send battle invites.
            </p>

            {/* Search Input */}
            <div className="mt-2.5 sm:mt-4 space-y-1.5 sm:space-y-2">
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs sm:text-sm font-black text-neutral-400 select-none">
                  &gt;
                </span>
                <LegacyInput
                  value={query}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                  placeholder="Type a username..."
                  className="h-10 sm:h-12 w-full border-2 border-black bg-white pl-7 pr-3 sm:pl-8 sm:pr-4 font-mono text-xs sm:text-sm font-black text-black shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] placeholder:font-sans placeholder:text-[11px] sm:placeholder:text-xs placeholder:font-medium placeholder:text-neutral-400 focus-visible:bg-[#f3f9ff] focus-visible:ring-0 focus:outline-none"
                />
              </div>

              {isSearching && (
                <p className="font-mono text-[10px] sm:text-xs font-bold text-black animate-pulse">
                  Searching database...
                </p>
              )}

              {hasQuery && !isSearching && visibleResults.length === 0 && (
                <div className="mt-1.5 sm:mt-2 border-2 border-dashed border-black/40 bg-black/5 p-2 sm:p-3 text-center">
                  <p className="font-mono text-[10px] sm:text-xs font-bold text-black">
                    No users found matching &quot;{query}&quot;.
                  </p>
                </div>
              )}
            </div>

            {/* Search Results */}
            {hasQuery && visibleResults.length > 0 && (
              <div className="mt-3 sm:mt-5 space-y-1.5 sm:space-y-2 border-t-2 border-black/20 pt-2.5 sm:pt-3">
                <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-black">
                  MATCHES FOUND ({visibleResults.length})
                </span>

                <div className="space-y-1.5 sm:space-y-2">
                  {visibleResults.map((person) => {
                    const personId = String(person?.user_id ?? person?.id ?? '');
                    const requestPending = pendingRequestSenderIds.has(personId);

                    return (
                      <div
                        key={person.id}
                        className="flex items-center justify-between border-2 border-black bg-white p-2 sm:p-3 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000]"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center border-2 border-black bg-[#FFDE59] font-mono text-xs sm:text-sm font-black text-black shadow-[1px_1px_0px_0px_#000000]">
                            {person.display_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="truncate">
                            <p className="truncate text-[11px] sm:text-xs font-black uppercase tracking-tight text-black">
                              {person.display_name}
                            </p>
                            <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-500">
                              LEARNER
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2 sm:ml-3">
                          {requestPending ? (
                            <span className="inline-flex items-center border-2 border-black bg-neutral-200 px-2 py-0.5 sm:px-3 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-neutral-600">
                              Pending
                            </span>
                          ) : (
                            <LegacyButton
                              size="sm"
                              onClick={() => personId && onSendFriendRequest?.(personId)}
                              className="h-7 sm:h-9 border-2 border-black bg-[#A3E636] px-2.5 sm:px-4 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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

          {/* 2. INCOMING REQUESTS PANEL */}
          {friendRequests.filter((r) => r?.direction !== 'outgoing').length > 0 && (
            <div className="border-2 border-black bg-[#1a1f2c] p-3.5 sm:p-5 shadow-[2.5px_2.5px_0px_0px_#000000] sm:shadow-[4px_4px_0px_0px_#000000]">
              <div className="mb-2 sm:mb-3 flex items-center justify-between border-b-2 border-black/40 pb-1.5 sm:pb-2">
                <span className="font-mono text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#FFDE59]">
              // INCOMING REQUESTS
                </span>
                <span className="border border-black bg-[#FFDE59] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase text-black">
                  {friendRequests.filter((r) => r?.direction !== 'outgoing').length} NEW
                </span>
              </div>

              <div className="space-y-1.5 sm:space-y-2.5">
                {friendRequests
                  .filter((r) => r?.direction !== 'outgoing')
                  .map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between gap-2 sm:gap-3 border-2 border-black bg-[#252c3d] p-2 sm:p-3 shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000]"
                    >
                      <div className="min-w-0 flex items-center gap-2 sm:gap-3">
                        <div className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center border-2 border-black bg-[#70CFF8] font-mono text-xs sm:text-sm font-black text-black">
                          {request.sender?.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="truncate">
                          <p className="truncate text-[11px] sm:text-xs font-black uppercase text-white">
                            {request.sender?.display_name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5">
                            <span
                              className={`h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black ${request.sender?.online ? 'bg-[#A3E636]' : 'bg-neutral-500'
                                }`}
                            />
                            <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-400">
                              {request.sender?.online ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <LegacyButton
                          size="sm"
                          onClick={() => onAcceptFriendRequest?.(request.id)}
                          className="h-7 sm:h-8 border-2 border-black bg-[#A3E636] px-2 sm:px-3 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] hover:bg-[#b5eb5b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                          Accept
                        </LegacyButton>
                        <LegacyButton
                          size="sm"
                          onClick={() => onRejectFriendRequest?.(request.id)}
                          className="h-7 sm:h-8 border-2 border-black bg-[#FF6B6B] px-2 sm:px-3 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] hover:bg-[#ff8585] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        >
                          Decline
                        </LegacyButton>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Active Friends List */}
        <div className="border-2 border-black bg-[#1a1f2c] p-3.5 sm:p-5 shadow-[3px_3px_0px_0px_#000000] sm:shadow-[6px_6px_0px_0px_#000000]">
          <div className="mb-2.5 sm:mb-4 flex items-center justify-between border-b-2 border-black/40 pb-2 sm:pb-3">
            <div>
              <span className="font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#A3E636]">
            // ROSTER
              </span>
              <h2 className="text-base sm:text-xl font-black uppercase tracking-tight text-white leading-tight">
                Friends List
              </h2>
            </div>
            <span className="border-2 border-black bg-[#252c3d] px-1.5 py-0.2 sm:px-2 sm:py-0.5 font-mono text-[10px] sm:text-xs font-black text-neutral-300">
              {friends.length} TOTAL
            </span>
          </div>

          {friends.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-700 p-6 sm:p-8 text-center">
              <p className="font-mono text-[11px] sm:text-xs font-bold uppercase text-neutral-400">
                No friends added yet.
              </p>
              <p className="mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-neutral-500">
                Use the search box on the left to connect with opponents.
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id || friend.user_id}
                  className="flex items-center justify-between border-2 border-black bg-[#252c3d] p-2.5 sm:p-3 shadow-[2px_2px_0px_0px_#000000] sm:shadow-[3px_3px_0px_0px_#000000] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center border-2 border-black bg-[#FFDE59] font-mono text-xs sm:text-sm font-black text-black shadow-[1px_1px_0px_0px_#000000] sm:shadow-[1.5px_1.5px_0px_0px_#000000]">
                      {friend.display_name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-black uppercase text-white">
                        {friend.display_name}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-1.5 pt-0.5">
                        <span
                          className={`h-1.5 w-1.5 sm:h-2 sm:w-2 border border-black ${friend.online ? 'bg-[#A3E636]' : 'bg-neutral-500'
                            }`}
                        />
                        <span className="font-mono text-[9px] sm:text-[10px] font-bold text-neutral-400">
                          {friend.online ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 ml-2 sm:ml-0 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const friendId = friend.user_id ?? friend.id;
                        if (friendId) onRemoveFriend?.(friendId);
                      }}
                      className="border-2 border-black bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[10px] sm:text-xs font-black uppercase text-black shadow-[1.5px_1.5px_0px_0px_#000000] sm:shadow-[2px_2px_0px_0px_#000000] transition-all hover:bg-[#FF6B6B] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      title="Remove friend"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FriendsPanel;