import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useLedger } from '../components/ledgerContext';
import { Slip, SlipRow } from '../components/Slip';
import { NumericKeypad } from '../components/NumericKeypad';
import { TransactionDialog } from '../components/TransactionDialog';
import {
  createTransaction,
  fetchCategories,
  fetchTransactionsRange,
} from '../lib/api';
import {
  DAY_NAMES,
  formatAmount,
  formatDisplayDate,
  formatShortDateWithDay,
  getGroupCssVar,
  getMonthEndStr,
  getMonthStartStr,
  toLocalDateStr,
} from '../lib/format';
import type { EntryKind, TransactionWithDetails } from '../lib/types';

const MAX_DIGITS = 9;
const MAX_AMOUNT = 999_999_999;

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
  const { user } = useAuth();
  const { ledgers, currentLedger, isLoadingLedgers, ledgerError, isOffline } =
    useLedger();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<EntryKind>('expense');
  const [amountExpr, setAmountExpr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(() => toLocalDateStr(new Date()));
  const [note, setNote] = useState('');
  const [isTouchPointer, setIsTouchPointer] = useState(false);
  const [newTxId, setNewTxId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<TransactionWithDetails | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(pointer: coarse)');
    setIsTouchPointer(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsTouchPointer(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const now = new Date();
  const todayStr = toLocalDateStr(now);
  const todayTitle = `${now.getMonth() + 1}/${now.getDate()}（${DAY_NAMES[now.getDay()]}）`;
  const monthLabel = `${now.getMonth() + 1} 月`;
  const monthStart = getMonthStartStr(now.getFullYear(), now.getMonth());
  const monthEnd = getMonthEndStr(now.getFullYear(), now.getMonth());

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories', currentLedger?.id],
    queryFn: () => fetchCategories(currentLedger!.id),
    enabled: Boolean(currentLedger?.id),
  });

  const { data: monthTransactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions', currentLedger?.id, monthStart, monthEnd],
    queryFn: () => fetchTransactionsRange(currentLedger!.id, monthStart, monthEnd),
    enabled: Boolean(currentLedger?.id),
  });

  const activeCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.group.kind === kind && !c.archived_at && !c.group.archived_at,
      ),
    [categories, kind],
  );

  // Clear or auto-select valid category when switching ledger or kind
  useEffect(() => {
    if (activeCategories.length === 0) {
      setSelectedCategoryId('');
      return;
    }
    const exists = activeCategories.some((c) => c.id === selectedCategoryId);
    if (!exists) {
      setSelectedCategoryId(activeCategories[0].id);
    }
  }, [activeCategories, selectedCategoryId]);

  const todayTransactions = useMemo(
    () => monthTransactions.filter((tx) => tx.occurred_on === todayStr),
    [monthTransactions, todayStr],
  );

  const recentTransactions = useMemo(
    () => monthTransactions.slice(0, 12),
    [monthTransactions],
  );

  const todayExpenseTotal = useMemo(
    () =>
      todayTransactions
        .filter((tx) => tx.kind === 'expense')
        .reduce((sum, tx) => sum + tx.amount, 0),
    [todayTransactions],
  );

  const hasOperator = /[+-]/.test(amountExpr);
  const evaluatedAmount = Number(evaluateExpression(amountExpr) || '0');
  const canSave =
    Boolean(currentLedger) &&
    Boolean(user) &&
    Boolean(selectedCategoryId) &&
    evaluatedAmount > 0 &&
    !isOffline;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!currentLedger || !user) throw new Error('尚未選擇帳本');
      const finalAmt = Number(evaluateExpression(amountExpr));
      if (!Number.isInteger(finalAmt) || finalAmt <= 0) {
        throw new Error('請輸入大於 0 的金額');
      }
      if (!selectedCategoryId) {
        throw new Error('請選擇分類');
      }
      return createTransaction({
        ledger_id: currentLedger.id,
        category_id: selectedCategoryId,
        amount: finalAmt,
        occurred_on: date,
        note: note || null,
        created_by: user.id,
      });
    },
    onSuccess: (created) => {
      setSubmitError(null);
      setAmountExpr('');
      setNote('');
      setNewTxId(created.id);
      void queryClient.invalidateQueries({ queryKey: ['transactions'] });
      void queryClient.invalidateQueries({ queryKey: ['budgets'] });
      void queryClient.invalidateQueries({ queryKey: ['charts'] });
    },
    onError: (err) => {
      setSubmitError(err instanceof Error ? err.message : '儲存失敗，請再試一次');
    },
  });

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
    if (!canSave || createMutation.isPending) return;
    createMutation.mutate();
  };

  const ledgerKind = currentLedger?.kind ?? 'personal';
  const ledgerName = currentLedger?.name ?? '載入中...';
  const ledgerScope =
    currentLedger?.kind === 'shared' ? '家庭共用' : '個人私密';

  return (
    <div className="desktop-container">
      <h1 className="visually-hidden">快速記帳</h1>

      {ledgerError && (
        <div className="workspace-status-bar status-error" role="alert">
          <p className="demo-banner">載入帳本失敗：{ledgerError}</p>
        </div>
      )}

      <div className="desktop-home-grid">
        {/* Left Column: Quick-Entry Drafting Sheet */}
        <div className="desktop-left-column">
          <form
            className={`entry-panel entry-ledger-${ledgerKind}`}
            onSubmit={handleSubmit}
          >
            {/* Active Ledger Identity Strip */}
            <header className="entry-ledger-strip">
              <span className="entry-ledger-id">
                <span
                  className={`ledger-mark ledger-mark-${ledgerKind} ledger-mark-surface`}
                  aria-hidden="true"
                />
                <span className="entry-ledger-name">記入：{ledgerName}</span>
              </span>
              <span className="entry-ledger-scope">{ledgerScope}</span>
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

              {/* Category Selection Grid */}
              {isLoadingLedgers || loadingCategories ? (
                <div className="category-empty-frame">
                  <span className="category-empty-sub">載入分類中...</span>
                </div>
              ) : activeCategories.length === 0 ? (
                <div className="category-empty-frame">
                  <span className="category-empty-title">尚無分類</span>
                  <Link to="/settings/categories" className="sheet-header-link">
                    前往新增分類
                  </Link>
                </div>
              ) : (
                <div className="category-grid" role="group" aria-label="選擇分類">
                  {activeCategories.map((cat) => {
                    const selected = cat.id === selectedCategoryId;
                    const cssColor = getGroupCssVar(cat.group.color);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        className={`category-card-btn ${selected ? 'selected' : ''}`}
                        style={{ '--cat-color': cssColor } as React.CSSProperties}
                        aria-pressed={selected}
                        onClick={() => setSelectedCategoryId(cat.id)}
                      >
                        <span
                          className="category-tile-chip"
                          style={{ backgroundColor: cssColor }}
                          aria-hidden="true"
                        />
                        {selected && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.25"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="category-check-icon"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                        <span className="category-label">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

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

              {submitError && (
                <p className="form-error" role="alert">
                  {submitError}
                </p>
              )}

              {/* Primary Save Action */}
              <button
                type="submit"
                className="save-action-btn"
                disabled={!canSave || createMutation.isPending}
              >
                {createMutation.isPending ? '儲存中...' : '記一筆'}
              </button>
            </div>
          </form>

          {/* Phone-only: Minimal Today Feedback */}
          <div className="phone-only-section">
            <Slip
              title={`今日紀錄 · ${todayTitle}`}
              emptyText={loadingTransactions ? '載入中...' : '今天還沒有記錄'}
              headerRight={
                <div className="sheet-header-right-group">
                  {todayExpenseTotal > 0 && (
                    <span className="slip-total">
                      支出 {formatAmount(todayExpenseTotal)}
                    </span>
                  )}
                  <Link to="/transactions" className="sheet-header-link">
                    看全部明細
                  </Link>
                </div>
              }
            >
              {todayTransactions.map((tx) => (
                <SlipRow
                  key={tx.id}
                  category={tx.category_name}
                  note={tx.note ?? undefined}
                  meta={
                    tx.recurring_rule_id
                      ? '週期'
                      : ledgerKind === 'shared'
                        ? tx.creator_name ?? undefined
                        : undefined
                  }
                  amount={tx.amount}
                  groupColor={getGroupCssVar(tx.group_color)}
                  isIncome={tx.kind === 'income'}
                  isNew={tx.id === newTxId}
                  onClick={() => setEditingTx(tx)}
                />
              ))}
            </Slip>
          </div>
        </div>

        {/* Right Column (Desktop >=1024px): Simplified Essentials Overview */}
        <div className="desktop-right-column">
          <Slip
            title={`${monthLabel}預算`}
            emptyText="預算功能將於下一步開放"
            headerRight={
              <Link to="/budgets" className="sheet-header-link">
                管理預算
              </Link>
            }
          />

          <Slip
            title="最近交易"
            emptyText={loadingTransactions ? '載入中...' : '本月還沒有記錄'}
            headerRight={
              <Link to="/transactions" className="sheet-header-link">
                看全部明細
              </Link>
            }
          >
            {recentTransactions.map((tx) => (
              <SlipRow
                key={tx.id}
                category={tx.category_name}
                meta={
                  tx.occurred_on === todayStr
                    ? '今天'
                    : formatShortDateWithDay(tx.occurred_on)
                }
                note={tx.note ?? undefined}
                amount={tx.amount}
                groupColor={getGroupCssVar(tx.group_color)}
                isIncome={tx.kind === 'income'}
                isNew={tx.id === newTxId}
                onClick={() => setEditingTx(tx)}
              />
            ))}
          </Slip>
        </div>
      </div>

      <TransactionDialog
        transaction={editingTx}
        ledgers={ledgers}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};

export default Home;
