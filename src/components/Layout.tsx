import React, { Suspense, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const LoadingFallback: React.FC = () => (
  <div className="phone-container">
    <div className="slip-empty">載入中...</div>
  </div>
);

export const Layout: React.FC = () => {
  const [currentLedger, setCurrentLedger] = useState<'個人帳本' | '家庭'>('個人帳本');
  const [ledgerPopoverOpen, setLedgerPopoverOpen] = useState(false);
  const ledgerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        ledgerContainerRef.current &&
        !ledgerContainerRef.current.contains(e.target as Node)
      ) {
        setLedgerPopoverOpen(false);
      }
    };
    if (ledgerPopoverOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [ledgerPopoverOpen]);

  return (
    <div className="app-shell">
      {/* Top Bar (Phone 56px, Desktop 64px) */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <div className="top-bar-left">
            <span className="brand-wordmark">個人記帳</span>

            {/* Ledger Switcher */}
            <div className="ledger-switcher-container" ref={ledgerContainerRef}>
              <button
                type="button"
                className="ledger-btn"
                onClick={() => setLedgerPopoverOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={ledgerPopoverOpen}
                aria-label={`目前帳本：${currentLedger}，點擊切換`}
              >
                <span>{currentLedger}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`ledger-chevron ${ledgerPopoverOpen ? 'open' : ''}`}
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {ledgerPopoverOpen && (
                <div className="ledger-popover" role="listbox" aria-label="帳本列表">
                  <button
                    type="button"
                    className={`ledger-option ${currentLedger === '個人帳本' ? 'selected' : ''}`}
                    onClick={() => {
                      setCurrentLedger('個人帳本');
                      setLedgerPopoverOpen(false);
                    }}
                    role="option"
                    aria-selected={currentLedger === '個人帳本'}
                  >
                    <span>個人帳本</span>
                    {currentLedger === '個人帳本' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`ledger-option ${currentLedger === '家庭' ? 'selected' : ''}`}
                    onClick={() => {
                      setCurrentLedger('家庭');
                      setLedgerPopoverOpen(false);
                    }}
                    role="option"
                    aria-selected={currentLedger === '家庭'}
                  >
                    <span>家庭</span>
                    {currentLedger === '家庭' && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Nav Links (5 tabs) */}
          <nav className="desktop-nav" aria-label="桌面主要導覽">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              記帳
            </NavLink>
            <NavLink
              to="/transactions"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              明細
            </NavLink>
            <NavLink
              to="/charts"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              圖表
            </NavLink>
            <NavLink
              to="/budgets"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              預算
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => `desktop-nav-link ${isActive ? 'active' : ''}`}
            >
              設定
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-content">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Bottom Navigation Bar (Phone Only) */}
      <nav className="bottom-nav" aria-label="主要導覽">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-icon"
            aria-hidden="true"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <span className="nav-label">記帳</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-icon"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <span className="nav-label">明細</span>
        </NavLink>

        <NavLink
          to="/charts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-icon"
            aria-hidden="true"
          >
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="nav-label">圖表</span>
        </NavLink>

        <NavLink
          to="/budgets"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-icon"
            aria-hidden="true"
          >
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="nav-label">預算</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="nav-icon"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="nav-label">設定</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
