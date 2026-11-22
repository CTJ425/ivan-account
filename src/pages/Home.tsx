import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLedger } from '../components/ledgerContext';
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
  const { currentLedger } = useLedger();
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="desktop-container">
      <h1 className="visually-hidden">快速記帳</h1>

      <div className="workspace-status-bar" role="status">
        <span className="status-dot" aria-hidden="true" />
        <p className="demo-banner">尚未連接帳本，記帳功能將在下一版開放</p>
      </div>

      <div className="desktop-home-grid">
        {/* Left Column: Quick-Entry Drafting Sheet */}
        <div className="desktop-left-column">
          <form
            className={`entry-panel entry-ledger-${currentLedger.id}`}
            onSubmit={handleSubmit}
          >
            {/* Active Ledger Identity Strip */}
            <header className="entry-ledger-strip">
              <span className="entry-ledger-id">
                <span
                  className={`ledger-mark ledger-mark-${currentLedger.id} ledger-mark-surface`}
                  aria-hidden="true"
                />
                <span className="entry-ledger-name">
                  記入：{currentLedger.name}
                </span>
              </span>
              <span className="entry-ledger-scope">
                {currentLedger.scopeLabel}
              </span>
            </header>

            <div className="entry-panel-body">
              {/* Expense / Income Segmented Control */}
              <div className="segmented-control" role="group" aria-label="收支類型">
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
                  <span className="visually-hidden">金額</span>
                  NT$
                </label>
                <input
                  id="amount-input"
                  name="amount"
                  type="text"
                  inputMode="numeric"
                  enterKeyHint="next"
                  pattern="[0-9]*"
                  autoComplete="off"
                  className="amount-input"
                  placeholder="0"
                  value={amountStr}
                  onChange={handleAmountChange}
                />
              </div>

              {/* Category Area: architectural empty state until M2 connects categories */}
              <div className="category-empty-frame">
                <span className="category-empty-title">尚無分類</span>
                <span className="category-empty-sub">
                  連接帳本後即可點選常用分類
                </span>
              </div>

              {/* Date and Note Row */}
              <div className="date-note-row">
                <div className="date-trigger-btn">
                  <label htmlFor="date-input" className="visually-hidden">
                    交易日期
                  </label>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="15"
                    height="15"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{formatDisplayDate(date)}</span>
                  <input
                    id="date-input"
                    name="date"
                    type="date"
                    className="native-date-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <label htmlFor="note-input" className="visually-hidden">
                  備註（選填）
                </label>
                <input
                  id="note-input"
                  name="note"
                  type="text"
                  enterKeyHint="done"
                  autoComplete="off"
                  className="note-input-field"
                  placeholder="備註（選填）"
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* Primary Save Action */}
              <button type="submit" className="save-action-btn" disabled>
                記一筆
              </button>
            </div>
          </form>

          {/* Phone-only: Minimal Today Feedback */}
          <div className="phone-only-section">
            <Slip
              title={`今日紀錄 · ${todayTitle}`}
              emptyText="今天還沒有記錄"
              headerRight={
                <Link to="/transactions" className="sheet-header-link">
                  看全部明細
                </Link>
              }
            />
          </div>
        </div>

        {/* Right Column (Desktop >=1024px): Simplified Essentials Overview */}
        <div className="desktop-right-column">
          <Slip
            title={`${monthLabel}預算`}
            emptyText="尚未設定本月預算"
            headerRight={
              <Link to="/budgets" className="sheet-header-link">
                管理預算
              </Link>
            }
          />

          <Slip
            title={`最近交易 · ${todayTitle}`}
            emptyText="今天還沒有記錄"
            headerRight={
              <Link to="/transactions" className="sheet-header-link">
                看全部明細
              </Link>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
