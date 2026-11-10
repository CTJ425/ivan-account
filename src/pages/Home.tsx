import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DEMO_CATEGORIES,
  INITIAL_DAY_SLIPS,
  DEMO_BUDGET_DATA,
  DEMO_INCOME_EXPENSE,
  DEMO_SPENDING_BY_GROUP,
  type DemoTransaction,
  type DaySlipData,
} from '../demo/data';
import {
  Slip,
  SlipRow,
  SlipBudgetRow,
  SlipCompareRow,
  SlipGroupShareRow,
} from '../components/Slip';

const formatDisplayDate = (dateStr: string): string => {
  const todayStr = '2026-11-10';
  if (dateStr === todayStr) return '今天';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = dayNames[dateObj.getDay()];
    return `${m}/${d}（${dayOfWeek}）`;
  }
  return dateStr;
};

export const Home: React.FC = () => {
  const [kind, setKind] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [date, setDate] = useState('2026-11-10');
  const [note, setNote] = useState('');

  // Slips state in memory for demo print-in motion
  const [daySlips, setDaySlips] = useState<DaySlipData[]>(INITIAL_DAY_SLIPS);

  const filteredCategories = DEMO_CATEGORIES.filter((c) => c.kind === kind);
  const selectedCategory = DEMO_CATEGORIES.find((c) => c.id === selectedCatId);

  const numericAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isSaveEnabled = numericAmount > 0 && selectedCatId !== null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(val);
  };

  const handleKindSwitch = (newKind: 'expense' | 'income') => {
    setKind(newKind);
    setSelectedCatId(null);
  };

  const handleSave = () => {
    if (!isSaveEnabled || !selectedCategory) return;

    const newTx: DemoTransaction = {
      id: `tx-${Date.now()}`,
      kind,
      amount: numericAmount,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      groupName: selectedCategory.groupName,
      groupColor: selectedCategory.groupColor,
      date,
      note: note.trim(),
      isNew: true,
    };

    setDaySlips((prev) => {
      const copy = [...prev];
      const todaySlip = { ...copy[0] };
      todaySlip.transactions = [newTx, ...todaySlip.transactions];
      todaySlip.total =
        kind === 'income'
          ? todaySlip.total + numericAmount
          : todaySlip.total + numericAmount;
      copy[0] = todaySlip;
      return copy;
    });

    // Reset form
    setAmountStr('');
    setSelectedCatId(null);
    setNote('');
  };

  const maxBudgetScale = Math.max(
    ...DEMO_BUDGET_DATA.groups.map((g) => Math.max(g.budget, g.used)),
    18000,
  );
  const maxIncomeExpenseScale = Math.max(
    DEMO_INCOME_EXPENSE.income,
    DEMO_INCOME_EXPENSE.expense,
  );
  const maxSpendingGroupScale = Math.max(
    ...DEMO_SPENDING_BY_GROUP.groups.map((g) => g.amount),
  );

  return (
    <div className="desktop-container">
      <p className="demo-banner">示範資料，尚未連接帳本</p>

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
                onClick={() => handleKindSwitch('expense')}
              >
                支出
              </button>
              <button
                type="button"
                className={`segmented-btn ${kind === 'income' ? 'active-income' : ''}`}
                aria-pressed={kind === 'income'}
                onClick={() => handleKindSwitch('income')}
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

            {/* Category Grid (4 columns, min 64px tall) */}
            <div className="category-grid" aria-label="選擇分類">
              {filteredCategories.map((cat) => {
                const isSelected = selectedCatId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card-btn ${isSelected ? 'selected' : ''}`}
                    style={{ '--cat-color': cat.groupColor } as React.CSSProperties}
                    onClick={() => setSelectedCatId(cat.id)}
                    aria-pressed={isSelected}
                    aria-label={`${cat.groupName} - ${cat.name}`}
                  >
                    <span
                      className="category-tile-chip"
                      style={{ backgroundColor: cat.groupColor }}
                      aria-hidden="true"
                    />
                    <span className="category-label">{cat.name}</span>
                    {isSelected && (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="category-check-icon"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

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

            {/* Save Button */}
            <button
              type="button"
              className="save-action-btn"
              disabled={!isSaveEnabled}
              onClick={handleSave}
            >
              記一筆
            </button>
          </div>

          {/* Phone-only: Today's slip + link to all transactions */}
          <div className="phone-only-section">
            <Slip
              title={daySlips[0].title}
              total={daySlips[0].total}
            >
              {daySlips[0].transactions.map((tx) => (
                <SlipRow
                  key={tx.id}
                  category={tx.categoryName}
                  note={tx.note}
                  amount={tx.amount}
                  groupColor={tx.groupColor}
                  isIncome={tx.kind === 'income'}
                  isNew={tx.isNew}
                />
              ))}
            </Slip>
            <div className="view-all-link-container">
              <Link to="/transactions" className="view-all-link">
                看全部明細
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Desktop >= 1024px overview slips) */}
        <div className="desktop-right-column">
          {/* 1. Budget Slip */}
          <Slip
            title={DEMO_BUDGET_DATA.title}
            headerRight={
              <span className="slip-total">{DEMO_BUDGET_DATA.remainingText}</span>
            }
          >
            {DEMO_BUDGET_DATA.groups.map((g) => (
              <SlipBudgetRow
                key={g.id}
                name={g.name}
                used={g.used}
                budget={g.budget}
                maxScale={maxBudgetScale}
                color={g.color}
              />
            ))}
          </Slip>

          {/* 2 & 3: Side by side at >= 1280px */}
          <div className="desktop-side-by-side">
            {/* 2. Income vs Expense Slip */}
            <Slip
              title={DEMO_INCOME_EXPENSE.title}
              headerRight={
                <span className="slip-total">
                  {DEMO_INCOME_EXPENSE.balanceText}
                </span>
              }
            >
              <SlipCompareRow
                label="收入"
                amount={DEMO_INCOME_EXPENSE.income}
                maxScale={maxIncomeExpenseScale}
                color="var(--income)"
                prefix="+"
              />
              <SlipCompareRow
                label="支出"
                amount={DEMO_INCOME_EXPENSE.expense}
                maxScale={maxIncomeExpenseScale}
                color="var(--ink)"
              />
            </Slip>

            {/* 3. Spending by Group Slip */}
            <Slip
              title={DEMO_SPENDING_BY_GROUP.title}
              total={DEMO_SPENDING_BY_GROUP.totalText}
            >
              {DEMO_SPENDING_BY_GROUP.groups.map((g) => (
                <SlipGroupShareRow
                  key={g.name}
                  name={g.name}
                  color={g.color}
                  amount={g.amount}
                  percentage={g.percentage}
                  maxAmount={maxSpendingGroupScale}
                />
              ))}
            </Slip>
          </div>

          {/* 4. Recent Day Slips */}
          {daySlips.map((day) => (
            <Slip key={day.id} title={day.title} total={day.total}>
              {day.transactions.map((tx) => (
                <SlipRow
                  key={tx.id}
                  category={tx.categoryName}
                  note={tx.note}
                  amount={tx.amount}
                  groupColor={tx.groupColor}
                  isIncome={tx.kind === 'income'}
                  isNew={tx.isNew}
                />
              ))}
            </Slip>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
