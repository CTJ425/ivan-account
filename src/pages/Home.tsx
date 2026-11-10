import React, { useState } from 'react';

export const Home: React.FC = () => {
  const [type, setType] = useState<'expense' | 'income'>('expense');

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">記帳</h1>
        <span className="badge">個人帳本</span>
      </header>

      <div className="card">
        <div className="type-toggle">
          <button
            type="button"
            className={`type-btn ${type === 'expense' ? 'active' : ''}`}
            aria-pressed={type === 'expense'}
            onClick={() => setType('expense')}
          >
            支出
          </button>
          <button
            type="button"
            className={`type-btn ${type === 'income' ? 'active' : ''}`}
            aria-pressed={type === 'income'}
            onClick={() => setType('income')}
          >
            收入
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">金額</label>
          <div className="amount-display">
            <span className="currency-prefix">NT$</span>
            <span className="amount-val">0</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">常用分類</label>
          <div className="category-grid">
            <span className="category-chip">早餐</span>
            <span className="category-chip">午餐</span>
            <span className="category-chip">晚餐</span>
            <span className="category-chip">交通</span>
            <span className="category-chip">日用品</span>
            <span className="category-chip">娛樂</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <input
            type="text"
            className="text-input"
            placeholder="選填，最多 200 字"
            disabled
          />
        </div>

        <button type="button" className="primary-button" disabled>
          儲存交易（M2 啟用）
        </button>
      </div>

      <section className="section">
        <h2 className="section-title">今日明細</h2>
        <div className="empty-placeholder">
          <p className="placeholder-text">目前尚無交易記錄</p>
        </div>
      </section>
    </div>
  );
};
