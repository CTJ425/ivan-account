import React from 'react';
import { Slip } from '../components/Slip';

export const Charts: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">圖表</h1>
      <Slip title="本月支出分布" emptyText="本月還沒有支出" />
    </div>
  );
};

export default Charts;
