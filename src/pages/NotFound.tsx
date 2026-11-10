import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">找不到頁面</h1>
      </header>

      <div className="card">
        <p className="placeholder-text">此路徑不存在或已被移除。</p>
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link to="/" className="link-btn">
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  );
};
