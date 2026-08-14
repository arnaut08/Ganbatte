import { useState } from 'react';
import logo from '../../assets/logo.svg';

function AppHeader({ onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="brand-lockup">
        <img className="app-logo" src={logo} alt="Ganbatte logo" />
        <div>
          <h1>
            <span className="brand-name">GANBATTE</span>
            <span className="brand-kana" lang="ja">頑張って</span>
          </h1>
          <p>Stop saying 'Nani?' to everything.</p>
        </div>
      </div>
      <div className="user-menu">
        <button
          type="button"
          className="user-menu-trigger"
          aria-label="Open user menu"
          aria-expanded={isMenuOpen}
          title="User menu"
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          <span className="user-avatar" aria-hidden="true">
            <span className="user-avatar-head" />
            <span className="user-avatar-body" />
          </span>
        </button>
        {isMenuOpen && (
          <div className="user-menu-dropdown">
            <button type="button" onClick={onLogout}>Log out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
