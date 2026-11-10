import React from 'react';
import { Slip } from '../components/Slip';

export const Transactions: React.FC = () => {
  return (
    <div className="page-centered-container">
      <h1 className="page-title">明細</h1>
      <Slip title="明細記錄" emptyText="目前尚無歷史明細資料" />
    </div>
  );
};

export default Transactions;
