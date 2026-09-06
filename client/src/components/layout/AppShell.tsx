import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
  header?: ReactNode;
  showHeader?: boolean;
};

export default function AppShell({ children, header, showHeader = true }: AppShellProps) {
  return (
    <div className="app-shell flex min-h-[100dvh] flex-1 flex-col">
      {showHeader ? header : <div className="app-shell-header-placeholder" aria-hidden="true" />}
      <div className="app-shell-content flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
