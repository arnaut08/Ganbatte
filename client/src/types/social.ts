import type { ApiRecord } from './base';

/** A friend / user summary returned by the social endpoints. */
export type Friend = ApiRecord & {
  id?: string;
  user_id?: string;
  display_name?: string | null;
  online?: boolean;
};

/** A friend request (with optional embedded sender/receiver summaries). */
export type FriendRequest = ApiRecord & {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  status?: string;
  direction?: 'incoming' | 'outgoing';
  sender?: Friend;
  receiver?: Friend;
};