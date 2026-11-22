import React from 'react';
import { Link } from 'react-router-dom';
import { Slip } from '../components/Slip';

export const NotFound: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">找不到頁面</h1>
      <Slip title="404">
        <div className="not-found-body">
          <p className="not-found-desc">此路徑不存在或已被移除。</p>
          <Link to="/" className="view-all-link">
            返回首頁
          </Link>
        </div>
      </Slip>
    </div>
  );
};

export default NotFound;
