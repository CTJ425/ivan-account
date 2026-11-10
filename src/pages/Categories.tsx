import React, { useState } from 'react';

export const Categories: React.FC = () => {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">分類管理</h1>
      </header>

      <div className="tab-header">
        <button
          type="button"
          className={`tab-btn ${kind === 'expense' ? 'active' : ''}`}
          aria-pressed={kind === 'expense'}
          onClick={() => setKind('expense')}
        >
          支出分類
        </button>
        <button
          type="button"
          className={`tab-btn ${kind === 'income' ? 'active' : ''}`}
          aria-pressed={kind === 'income'}
          onClick={() => setKind('income')}
        >
          收入分類
        </button>
      </div>

      <div className="card">
        <div className="category-group">
          <div className="group-title">餐食</div>
          <ul className="item-list">
            <li className="item-row">早餐</li>
            <li className="item-row">午餐</li>
            <li className="item-row">晚餐</li>
          </ul>
        </div>

        <div className="category-group">
          <div className="group-title">交通</div>
          <ul className="item-list">
            <li className="item-row">大眾運輸</li>
            <li className="item-row">加油 / 停車</li>
          </ul>
        </div>

        <div className="category-group">
          <div className="group-title">居住</div>
          <ul className="item-list">
            <li className="item-row">房租</li>
            <li className="item-row">水電瓦斯</li>
          </ul>
        </div>
      </div>

      <div className="note-box">
        <p>兩層分類架構（群組 → 分類）與封存功能將於 M3 實作。</p>
      </div>
    </div>
  );
};
