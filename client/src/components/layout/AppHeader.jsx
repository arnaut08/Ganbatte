import logo from '../../assets/logo.svg';

function AppHeader() {
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
    </header>
  );
}

export default AppHeader;
