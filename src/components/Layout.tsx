import React, { Suspense, useState, useRef, useEffect, useId } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LEDGERS, type LedgerId, type LedgerInfo } from './ledgerContext';
import { useAuth } from '../auth/useAuth';
import { useTheme, type ThemePreference } from '../lib/theme';

const LoadingFallback: React.FC = () => (
  <div className="phone-container">
    <div className="sheet-empty">載入中...</div>
  </div>
);

interface NavItemDef {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItemDef[] = [
  {
    to: '/',
    label: '記帳',
    end: true,
    icon: (
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
    ),
  },
  {
    to: '/transactions',
    label: '明細',
    icon: (
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
    ),
  },
  {
    to: '/charts',
    label: '圖表',
    icon: (
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
    ),
  },
  {
    to: '/budgets',
    label: '預算',
    icon: (
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
    ),
  },
  {
    to: '/settings',
    label: '設定',
    icon: (
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
    ),
  },
];

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '自動' },
];

interface LedgerSwitcherProps {
  currentLedger: LedgerInfo;
  onSelect: (id: LedgerId) => void;
  variant: 'rail' | 'topbar';
}

const LedgerSwitcher: React.FC<LedgerSwitcherProps> = ({
  currentLedger,
  onSelect,
  variant,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      className={`ledger-switcher-container ledger-switcher-${variant}`}
      ref={containerRef}
    >
      <button
        ref={triggerRef}
        type="button"
        className={`ledger-btn ledger-btn-${variant}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`目前帳本：${currentLedger.name}（${currentLedger.scopeLabel}），點擊切換`}
      >
        <span className="ledger-btn-main">
          <span
            className={`ledger-mark ledger-mark-${currentLedger.id}`}
            aria-hidden="true"
          />
          <span className="ledger-btn-name">{currentLedger.name}</span>
          {variant === 'rail' && (
            <span className="ledger-btn-scope">{currentLedger.scopeLabel}</span>
          )}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ledger-chevron ${open ? 'open' : ''}`}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          className={`ledger-popover ledger-popover-${variant}`}
          aria-label="切換帳本"
        >
          {Object.values(LEDGERS).map((ledger) => {
            const isSelected = ledger.id === currentLedger.id;
            return (
              <button
                key={ledger.id}
                type="button"
                className={`ledger-option ${isSelected ? 'selected' : ''}`}
                aria-pressed={isSelected}
                onClick={() => {
                  onSelect(ledger.id);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                <span className="ledger-option-left">
                  <span
                    className={`ledger-mark ledger-mark-${ledger.id} ledger-mark-surface`}
                    aria-hidden="true"
                  />
                  <span className="ledger-option-text">
                    <span className="ledger-option-name">{ledger.name}</span>
                    <span className="ledger-option-scope">{ledger.scopeLabel}</span>
                  </span>
                </span>
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="15"
                    height="15"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Layout: React.FC = () => {
  const [ledgerId, setLedgerId] = useState<LedgerId>('personal');
  const [signingOut, setSigningOut] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const currentLedger = LEDGERS[ledgerId];

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={`app-shell ledger-state-${ledgerId}`}>
      <a href="#main-content" className="skip-link visually-hidden">
        跳至主要內容
      </a>

      {/* Desktop Fixed Left Navigation Rail (>=1024px) */}
      <aside className="side-rail">
        <div className="side-rail-head">
          <div className="brand-block">
            <span className="brand-wordmark">個人記帳</span>
          </div>
          <LedgerSwitcher
            currentLedger={currentLedger}
            onSelect={setLedgerId}
            variant="rail"
          />
        </div>

        <nav className="side-rail-nav" aria-label="桌面主選單">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `side-nav-link ${isActive ? 'active' : ''}`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <footer className="side-rail-footer">
          <div className="rail-theme-group" role="group" aria-label="外觀主題">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`rail-theme-btn ${preference === opt.value ? 'active' : ''}`}
                aria-pressed={preference === opt.value}
                onClick={() => setPreference(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="rail-account-row">
            <span className="rail-account-email" title={user?.email || '已登入'}>
              {user?.email || '已登入'}
            </span>
            <button
              type="button"
              className="rail-logout-btn"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? '登出中...' : '登出'}
            </button>
          </div>

          <div className="rail-version">v{__APP_VERSION__}</div>
        </footer>
      </aside>

      {/* Mobile Sticky Top Bar (<1024px) */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <span className="brand-wordmark">個人記帳</span>
          <LedgerSwitcher
            currentLedger={currentLedger}
            onSelect={setLedgerId}
            variant="topbar"
          />
        </div>
      </header>

      {/* Main Workspace */}
      <main id="main-content" className="app-content" tabIndex={-1}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet context={{ currentLedger, setLedgerId }} />
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation Bar (<1024px) */}
      <nav className="bottom-nav" aria-label="底部主選單">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
