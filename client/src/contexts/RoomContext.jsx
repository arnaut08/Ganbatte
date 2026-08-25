import { createContext, useContext } from 'react';

const RoomContext = createContext(null);

export function RoomProvider({ value, children }) {
  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoomContext must be used within RoomProvider');
  return context;
}
