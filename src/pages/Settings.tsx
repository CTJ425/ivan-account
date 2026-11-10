import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

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
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">設定</h1>
      </header>

      <div className="card">
        <div className="settings-group">
          <div className="group-title">帳號與驗證</div>
          <div className="settings-row">
            <span>登入帳號</span>
            <span className="settings-val">{user?.email || '已登入'}</span>
          </div>
          <div className="settings-row">
            <span>登入狀態</span>
            <button
              type="button"
              className="secondary-button"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? '登出中...' : '登出'}
            </button>
          </div>
        </div>

        <div className="settings-group">
          <div className="group-title">帳本管理</div>
          <div className="settings-row">
            <span>目前帳本</span>
            <span className="settings-val">個人帳本</span>
          </div>
          <div className="settings-row">
            <span>共用帳本</span>
            <span className="settings-val">尚未加入</span>
          </div>
        </div>

        <div className="settings-group">
          <div className="group-title">資料匯出</div>
          <div className="settings-row">
            <span>CSV 交易匯出</span>
            <button type="button" className="secondary-button" disabled>
              匯出 CSV
            </button>
          </div>
        </div>
      </div>

      <div className="note-box">
        <p>帳本管理、白名單與週期性項目功能將於後續里程碑實作。</p>
      </div>
    </div>
  );
};

export default Settings;
