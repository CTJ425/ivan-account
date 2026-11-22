import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import { checkIsAdmin, fetchAllLedgerTransactions } from '../lib/api';
import { buildTransactionsCsv, downloadCsvFile } from '../lib/csv';
import { toLocalDateStr } from '../lib/format';
import { useTheme, type ThemePreference } from '../lib/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: '淺色' },
  { value: 'dark', label: '深色' },
  { value: 'auto', label: '自動' },
];

const ChevronIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="settings-chevron"
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const { currentLedger, isOffline } = useLedger();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const { preference, setPreference, systemTheme } = useTheme();

  const { data: isAdmin = false } = useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: checkIsAdmin,
    enabled: Boolean(user?.id),
  });

  const handleExportCsv = async () => {
    if (!currentLedger) return;
    try {
      setExporting(true);
      setExportMsg(null);
      const rows = await fetchAllLedgerTransactions(currentLedger.id);
      const csv = buildTransactionsCsv(rows);
      const safeName = currentLedger.name.replace(/[/\\?%*:|"<>]/g, '_');
      downloadCsvFile(`${safeName}-${toLocalDateStr(new Date())}.csv`, csv);
      setExportMsg(`已匯出「${currentLedger.name}」共 ${rows.length} 筆交易。`);
    } catch (err) {
      setExportMsg(err instanceof Error ? err.message : '匯出 CSV 失敗');
    } finally {
      setExporting(false);
    }
  };

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
    <div className="page-centered-container">
      <h1 className="page-title">設定</h1>

      <Slip
        title="外觀主題"
        headerRight={
          <span className="slip-note">
            {preference === 'auto'
              ? `跟隨系統（目前${systemTheme === 'dark' ? '深色' : '淺色'}）`
              : preference === 'dark'
                ? '固定深色'
                : '固定淺色'}
          </span>
        }
      >
        <div className="settings-theme-row" role="group" aria-label="切換外觀主題">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`settings-theme-btn ${preference === opt.value ? 'active' : ''}`}
              aria-pressed={preference === opt.value}
              onClick={() => setPreference(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Slip>

      <Slip
        title="功能設定"
        headerRight={
          <span className="slip-total">{user?.email || '已登入'}</span>
        }
      >
        <Link to="/settings/categories" className="settings-item-row">
          <span>分類管理</span>
          <ChevronIcon />
        </Link>

        <Link to="/settings/recurring" className="settings-item-row">
          <span>週期性項目</span>
          <ChevronIcon />
        </Link>

        <Link to="/settings/ledgers" className="settings-item-row">
          <span>帳本與成員</span>
          <ChevronIcon />
        </Link>

        {isAdmin && (
          <Link to="/settings/whitelist" className="settings-item-row">
            <span>白名單管理</span>
            <ChevronIcon />
          </Link>
        )}

        <button
          type="button"
          className="settings-item-row"
          onClick={handleExportCsv}
          disabled={!currentLedger || exporting || isOffline}
        >
          <span>{exporting ? '匯出中...' : '匯出 CSV'}</span>
          <span className="slip-note">
            {currentLedger ? `${currentLedger.name} · UTF-8` : '載入中'}
          </span>
        </button>

        <button
          type="button"
          className="settings-item-row danger"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          <span>{signingOut ? '登出中...' : '登出'}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="settings-chevron"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </Slip>

      {exportMsg && (
        <div className="workspace-status-bar" role="status">
          <span className="status-dot" aria-hidden="true" />
          <p className="demo-banner">{exportMsg}</p>
        </div>
      )}

      <p className="settings-version-line">版本 v{__APP_VERSION__}</p>
    </div>
  );
};

export default Settings;
