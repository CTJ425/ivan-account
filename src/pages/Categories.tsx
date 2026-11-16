import React from 'react';
import { Slip } from '../components/Slip';

export const Categories: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">分類管理</h1>

      <Slip title="支出分類" emptyText="尚無支出分類" />

      <div style={{ height: '16px' }} />

      <Slip title="收入分類" emptyText="尚無收入分類" />
    </div>
  );
};

export default Categories;
