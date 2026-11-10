import React from 'react';
import { Link } from 'react-router-dom';
import { Slip } from '../components/Slip';

export const NotFound: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">找不到頁面</h1>
      <Slip title="404">
        <div style={{ padding: '24px 16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 16px', color: 'var(--ink-2)', fontSize: '14px' }}>
            此路徑不存在或已被移除。
          </p>
          <Link to="/" className="view-all-link">
            返回首頁
          </Link>
        </div>
      </Slip>
    </div>
  );
};

export default NotFound;
