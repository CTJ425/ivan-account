import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import { NumericKeypad } from '../components/NumericKeypad';

const DAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];
const MAX_DIGITS = 9;
const MAX_AMOUNT = 999_999_999;

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

const evaluateExpression = (raw: string): string => {
  const cleaned = raw.replace(/[+-]+$/, '');
  if (!cleaned) return '';
  const match = cleaned.match(/^(\d+)([+-])(\d+)$/);
  if (!match) {
    const n = Number(cleaned);
    return Number.isFinite(n)
      ? String(Math.min(MAX_AMOUNT, Math.max(0, Math.trunc(n))))
      : '';
  }
  const left = Number(match[1]);
  const op = match[2];
  const right = Number(match[3]);
  const result = op === '+' ? left + right : left - right;
  const clamped = Math.min(MAX_AMOUNT, Math.max(0, Math.trunc(result)));
  return String(clamped);
};

const appendDigitToExpr = (prev: string, digit: string): string => {
  const opIdx = Math.max(prev.lastIndexOf('+'), prev.lastIndexOf('-'));
  const prefix = opIdx >= 0 ? prev.slice(0, opIdx + 1) : '';
  const current = opIdx >= 0 ? prev.slice(opIdx + 1) : prev;

  if (current.length >= MAX_DIGITS) return prev;

  let nextSegment: string;
  if (current === '' || current === '0') {
    nextSegment = digit === '0' || digit === '00' ? '0' : digit;
  } else {
    nextSegment = (current + digit).slice(0, MAX_DIGITS);
  }

  return prefix + nextSegment;
};

const appendOperatorToExpr = (prev: string, op: '+' | '-'): string => {
  if (!prev) return prev;
  if (prev.endsWith('+') || prev.endsWith('-')) {
    return prev.slice(0, -1) + op;
  }
  const evaluated = evaluateExpression(prev);
  return evaluated ? evaluated + op : '';
};

const formatExprDisplay = (raw: string): string => {
  if (!raw) return '';
  return raw
    .replace(/\d+/g, (num) => Number(num).toLocaleString('en-US'))
    .replace(/([+-])/g, ' $1 ');
};

export const Home: React.FC = () => {
  const { currentLedger } = useLedger();
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [amountExpr, setAmountExpr] = useState('');
  const [date, setDate] = useState(() => toLocalDateStr(new Date()));
  const [note, setNote] = useState('');
  const [isTouchPointer, setIsTouchPointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouchPointer(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouchPointer(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const now = new Date();
  const todayTitle = `${now.getMonth() + 1}/${now.getDate()}（${DAY_NAMES[now.getDay()]}）`;
  const monthLabel = `${now.getMonth() + 1} 月`;

  const hasOperator = /[+-]/.test(amountExpr);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9+-]/g, '');
    if (!raw) {
      setAmountExpr('');
      return;
    }
    const match = raw.match(/^(\d{0,9})([+-])?(\d{0,9})?/);
    if (!match) return;
    const left = match[1] || '';
    const op = left && match[2] ? match[2] : '';
    const right = op && match[3] ? match[3] : '';
    setAmountExpr(left + op + right);
  };

  const handleAmountKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
    if ((e.key === 'Enter' || e.key === '=') && hasOperator) {
      e.preventDefault();
      setAmountExpr((prev) => evaluateExpression(prev));
    } else if (e.key === 'Escape' && amountExpr) {
      e.preventDefault();
      setAmountExpr('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (hasOperator) {
      setAmountExpr((prev) => evaluateExpression(prev));
    }
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
                  inputMode={isTouchPointer ? 'none' : 'numeric'}
                  enterKeyHint="next"
                  autoComplete="off"
                  className="amount-input"
                  placeholder="0"
                  value={formatExprDisplay(amountExpr)}
                  onChange={handleAmountChange}
                  onKeyDown={handleAmountKeyDown}
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

              {/* Built-in Drafting Grid Numeric Keypad */}
              <NumericKeypad
                hasOperator={hasOperator}
                hasValue={amountExpr.length > 0}
                onDigit={(d) => setAmountExpr((prev) => appendDigitToExpr(prev, d))}
                onOperator={(op) =>
                  setAmountExpr((prev) => appendOperatorToExpr(prev, op))
                }
                onBackspace={() => setAmountExpr((prev) => prev.slice(0, -1))}
                onClear={() => setAmountExpr('')}
                onEvaluate={() => setAmountExpr((prev) => evaluateExpression(prev))}
              />

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
