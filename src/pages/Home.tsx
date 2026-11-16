import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Slip } from '../components/Slip';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

const toLocalDateStr = (d: Date): string => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

const formatDisplayDate = (dateStr: string): string => {
  if (dateStr === toLocalDateStr(new Date())) return '今天';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return `${m}/${d}（${DAY_NAMES[dateObj.getDay()]}）`;
  }
  return dateStr;
};

export const Home: React.FC = () => {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(() => toLocalDateStr(new Date()));
  const [note, setNote] = useState('');

  const now = new Date();
  const todayTitle = `${now.getMonth() + 1}/${now.getDate()}（${DAY_NAMES[now.getDay()]}）`;
  const monthLabel = `${now.getMonth() + 1} 月`;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmountStr(e.target.value.replace(/[^0-9]/g, ''));
  };

  return (
    <div className="desktop-container">
      <p className="demo-banner">尚未連接帳本，記帳功能將在下一版開放</p>

      <div className="desktop-home-grid">
        {/* Left Column (Sticky on Desktop, top on Phone) */}
        <div className="desktop-left-column">
          <div className="entry-panel">
            {/* Expense / Income Segmented Control */}
            <div className="segmented-control" role="group" aria-label="收支切換">
              <button
                type="button"
                className={`segmented-btn ${kind === 'expense' ? 'active-expense' : ''}`}
                aria-pressed={kind === 'expense'}
                onClick={() => setKind('expense')}
              >
                支出
              </button>
              <button
                type="button"
                className={`segmented-btn ${kind === 'income' ? 'active-income' : ''}`}
                aria-pressed={kind === 'income'}
                onClick={() => setKind('income')}
              >
                收入
              </button>
            </div>

            {/* Amount Input */}
            <div className="amount-field-wrapper">
              <label htmlFor="amount-input" className="currency-label">
                NT$
              </label>
              <input
                id="amount-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="amount-input"
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                aria-label="金額"
              />
            </div>

            {/* Category Grid: filled from the ledger's categories in M2 */}
            <div className="slip-empty">尚無分類</div>

            {/* Date and Note Row */}
            <div className="date-note-row">
              <div className="date-trigger-btn">
                <span>{formatDisplayDate(date)}</span>
                <input
                  type="date"
                  className="native-date-input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-label="選擇日期"
                />
              </div>

              <input
                id="note-input"
                type="text"
                className="note-input-field"
                placeholder="備註（選填）"
                maxLength={200}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                aria-label="備註"
              />
            </div>

            {/* Save Button: disabled until transactions are stored (M2) */}
            <button type="button" className="save-action-btn" disabled>
              記一筆
            </button>
          </div>

          {/* Phone-only: Today's slip + link to all transactions */}
          <div className="phone-only-section">
            <Slip title={todayTitle} />
            <div className="view-all-link-container">
              <Link to="/transactions" className="view-all-link">
                看全部明細
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Desktop >= 1024px overview slips) */}
        <div className="desktop-right-column">
          <Slip title={`${monthLabel}預算`} emptyText="尚未設定預算" />

          <div className="desktop-side-by-side">
            <Slip title={`${monthLabel}收支`} emptyText="本月還沒有記錄" />
            <Slip title={`${monthLabel}支出分布`} emptyText="本月還沒有支出" />
          </div>

          <Slip title={todayTitle} />
        </div>
      </div>
    </div>
  );
};

export default Home;
