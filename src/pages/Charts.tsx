import React, { useState } from 'react';

export const Charts: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-title">圖表分析</h1>
      </header>

      <div className="tab-header">
        <button
          type="button"
          className={`tab-btn ${period === 'week' ? 'active' : ''}`}
          aria-pressed={period === 'week'}
          onClick={() => setPeriod('week')}
        >
          週
        </button>
        <button
          type="button"
          className={`tab-btn ${period === 'month' ? 'active' : ''}`}
          aria-pressed={period === 'month'}
          onClick={() => setPeriod('month')}
        >
          月
        </button>
        <button
          type="button"
          className={`tab-btn ${period === 'year' ? 'active' : ''}`}
          aria-pressed={period === 'year'}
          onClick={() => setPeriod('year')}
        >
          年
        </button>
      </div>

      <div className="card">
        <div className="chart-header">
          <span className="chart-title">支出分布</span>
        </div>
        <div className="chart-canvas-placeholder">
          <svg viewBox="0 0 100 100" className="placeholder-svg" aria-label="圓餅圖佔位">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="16" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#2563eb"
              strokeWidth="16"
              strokeDasharray="60 190"
              strokeDashoffset="0"
            />
          </svg>
          <p className="placeholder-text">自繪 SVG 圓餅圖與折線圖將於 M4 實作</p>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">支出明細排行</h2>
        <div className="empty-placeholder">
          <p className="placeholder-text">尚無統計數據</p>
        </div>
      </section>
    </div>
  );
};

export default Charts;
