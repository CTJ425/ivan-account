import React from 'react';

export const Budgets: React.FC = () => {
  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">預算管理</h1>
      </header>

      <div className="card">
        <div className="budget-header-row">
          <span className="budget-label">當月總預算</span>
          <span className="budget-amount">NT$ 30,000</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: '0%' }}></div>
        </div>
        <div className="budget-meta">
          <span>已使用 NT$ 0</span>
          <span>剩餘 NT$ 30,000</span>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">群組預算進度</h2>
        <div className="empty-placeholder">
          <p className="placeholder-text">預算設定與超支警示功能將於 M3 實作</p>
        </div>
      </section>
    </div>
  );
};
