import React from 'react';
import { Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">設定</h1>
      </header>

      <div className="card">
        <div className="settings-group">
          <div className="group-title">帳號與驗證</div>
          <div className="settings-row">
            <span>登入狀態</span>
            <Link to="/login" className="link-btn">
              前往登入頁面
            </Link>
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
