import React from 'react';
import { Slip } from '../components/Slip';

export const Budgets: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">預算</h1>
      <Slip title="本月預算" emptyText="尚未設定預算" />
    </div>
  );
};

export default Budgets;
