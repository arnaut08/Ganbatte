import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
  header?: ReactNode;
  showHeader?: boolean;
};

export default function AppShell({ children, header, showHeader = true }: AppShellProps) {
  return (
    <div className="app-shell">
      {showHeader ? header : <div className="app-shell-header-placeholder" aria-hidden="true" />}
      <div className="app-shell-content">{children}</div>
    </div>
  );
}
