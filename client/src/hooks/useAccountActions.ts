import { useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { deleteAccount as deleteAccountRequest } from '../services/api';
import type { ToastType } from '../types';
import { clearRoomSession } from '../utils/roomSession';

type AccountActionsOptions = {
  isMatchLocked: boolean;
  socket: Socket | null;
  clearRoomState: () => void;
  clearSocialDataCache: () => void;
  onNavigateHome: () => void;
  signOut: () => Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
};

export default function useAccountActions({
  isMatchLocked,
  socket,
  clearRoomState,
  clearSocialDataCache,
  onNavigateHome,
  signOut,
  showToast,
}: AccountActionsOptions) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const clearClientSession = useCallback(() => {
    onNavigateHome();
    socket?.disconnect();
    clearRoomSession();
    localStorage.removeItem('ganbatte-session-key');
    clearSocialDataCache();
    clearRoomState();
  }, [clearRoomState, clearSocialDataCache, onNavigateHome, socket]);

  const handleLogout = useCallback(async () => {
    if (isMatchLocked) {
      showToast('Cannot sign out during an active match. Finish or forfeit first.', 'error');
      return;
    }

    setIsLoggingOut(true);
    clearClientSession();
    try {
      await signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearClientSession, isMatchLocked, showToast, signOut]);

  const handleDeleteAccount = useCallback(async () => {
    if (isMatchLocked) {
      showToast('Cannot delete your account during an active match. Finish or forfeit first.', 'error');
      return;
    }

    setIsLoggingOut(true);
    try {
      await deleteAccountRequest();
      clearClientSession();
      await signOut();
    } catch (error) {
      console.error('Account deletion failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [clearClientSession, isMatchLocked, showToast, signOut]);

  return { isLoggingOut, handleLogout, handleDeleteAccount };
}