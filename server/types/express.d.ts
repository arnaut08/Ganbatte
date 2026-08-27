import type { User } from '@supabase/supabase-js';

declare module 'socket.io' {
  interface SocketData {
    user?: User | null;
    connectionRefresh?: ReturnType<typeof setInterval>;
    intentionalLeave?: boolean;
    intentionalLeaveRoomCode?: string;
    [key: string]: unknown;
  }
}

declare global {
  namespace Express {
    interface Request {
      user: User | null;
    }
  }
}

export {};
