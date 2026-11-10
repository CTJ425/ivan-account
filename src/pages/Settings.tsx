import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { Slip } from '../components/Slip';

export const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

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
        title="設定"
        headerRight={
          <span className="slip-total">{user?.email || '已登入'}</span>
        }
      >
        <Link to="/settings/categories" className="settings-item-row">
          <span>分類管理</span>
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
        </Link>

        <button type="button" className="settings-item-row" disabled>
          <span>週期性項目</span>
          <span className="slip-note">即將推出</span>
        </button>

        <button type="button" className="settings-item-row" disabled>
          <span>帳本與成員</span>
          <span className="slip-note">即將推出</span>
        </button>

        <button type="button" className="settings-item-row" disabled>
          <span>白名單</span>
          <span className="slip-note">即將推出</span>
        </button>

        <button type="button" className="settings-item-row" disabled>
          <span>匯出 CSV</span>
          <span className="slip-note">即將推出</span>
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
    </div>
  );
};

export default Settings;
