import React from 'react';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">登入</h1>
      </header>

      <div className="card login-card">
        <p className="login-desc">
          請使用已加入白名單的 Google 帳號登入個人記帳系統。
        </p>

        <button type="button" className="primary-button" disabled>
          使用 Google 帳號登入（M1 實作）
        </button>

        <div className="login-footer">
          <Link to="/" className="link-btn">
            返回首頁
          </Link>
        </div>
      </div>

      <div className="note-box">
        <p>Supabase Auth 與 PKCE 登入流程將於 Milestone M1 驗證與實作。</p>
      </div>
    </div>
  );
};
