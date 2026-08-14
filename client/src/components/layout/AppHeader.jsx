import { useEffect, useRef, useState } from 'react';
import logo from '../../assets/logo.svg';

function AppHeader({ onHome, onLogout, onOpenHistory, isAuthenticated }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className="app-header">
      <button type="button" className="brand-lockup" onClick={onHome} aria-label="Go to home">
        <img className="app-logo" src={logo} alt="Ganbatte logo" />
        <div>
          <h1>
            <span className="brand-name">GANBATTE</span>
            <span className="brand-kana" lang="ja">頑張って</span>
          </h1>
          <p>Stop saying 'Nani?' to everything.</p>
        </div>
      </button>
      {isAuthenticated && <div className="user-menu" ref={menuRef}>
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
            <button type="button" onClick={onOpenHistory}>Assessment history</button>
            <button type="button" onClick={onLogout}>Log out</button>
          </div>
        )}
      </div>}
    </header>
  );
}

export default AppHeader;
