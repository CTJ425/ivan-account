import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLedger } from '../components/ledgerContext';
import { Slip, SlipRow } from '../components/Slip';
import { TransactionDialog } from '../components/TransactionDialog';
import { fetchCategories, fetchTransactionsRange } from '../lib/api';
import {
  formatAmount,
  formatShortDateWithDay,
  getGroupCssVar,
  getMonthEndStr,
  getMonthStartStr,
} from '../lib/format';
import type { EntryKind, TransactionWithDetails } from '../lib/types';

interface DayGroup {
  date: string;
  items: TransactionWithDetails[];
  expenseTotal: number;
  incomeTotal: number;
}

export const Transactions: React.FC = () => {
  const { ledgers, currentLedger } = useLedger();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed

  const [kindFilter, setKindFilter] = useState<'all' | EntryKind>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [editingTx, setEditingTx] = useState<TransactionWithDetails | null>(null);

  const monthStart = getMonthStartStr(year, month);
  const monthEnd = getMonthEndStr(year, month);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', currentLedger?.id],
    queryFn: () => fetchCategories(currentLedger!.id),
    enabled: Boolean(currentLedger?.id),
  });

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', currentLedger?.id, monthStart, monthEnd],
    queryFn: () => fetchTransactionsRange(currentLedger!.id, monthStart, monthEnd),
    enabled: Boolean(currentLedger?.id),
  });

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        kindFilter === 'all' ? true : c.group.kind === kindFilter,
      ),
    [categories, kindFilter],
  );

  const filteredTransactions = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (kindFilter !== 'all' && tx.kind !== kindFilter) return false;
      if (categoryFilter && tx.category_id !== categoryFilter) return false;
      if (q) {
        const hay = `${tx.category_name} ${tx.group_name} ${tx.note ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, kindFilter, categoryFilter, searchText]);

  const dayGroups = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const tx of filteredTransactions) {
      let group = map.get(tx.occurred_on);
      if (!group) {
        group = {
          date: tx.occurred_on,
          items: [],
          expenseTotal: 0,
          incomeTotal: 0,
        };
        map.set(tx.occurred_on, group);
      }
      group.items.push(tx);
      if (tx.kind === 'income') {
        group.incomeTotal += tx.amount;
      } else {
        group.expenseTotal += tx.amount;
      }
    }
    return Array.from(map.values());
  }, [filteredTransactions]);

  const monthTotals = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const tx of filteredTransactions) {
      if (tx.kind === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    return { expense, income, net: income - expense };
  }, [filteredTransactions]);

  return (
    <div className="page-centered-container">
      <div className="page-header-row">
        <h1 className="page-title">明細</h1>

        <div className="month-pager" role="group" aria-label="切換月份">
          <button
            type="button"
            className="pager-btn"
            onClick={() => shiftMonth(-1)}
            aria-label="上個月"
          >
            ‹
          </button>
          <span className="pager-label">
            {year} 年 {month + 1} 月
          </span>
          <button
            type="button"
            className="pager-btn"
            onClick={() => shiftMonth(1)}
            aria-label="下個月"
          >
            ›
          </button>
        </div>
      </div>

      {/* Month Summary Strip */}
      <div className="summary-strip" aria-label="本月收支合計">
        <div className="summary-cell">
          <span className="summary-label">支出</span>
          <span className="summary-val">{formatAmount(monthTotals.expense)}</span>
        </div>
        <div className="summary-cell">
          <span className="summary-label">收入</span>
          <span className="summary-val summary-income">
            +{formatAmount(monthTotals.income)}
          </span>
        </div>
        <div className="summary-cell">
          <span className="summary-label">結餘</span>
          <span
            className={`summary-val ${
              monthTotals.net < 0 ? 'summary-over' : ''
            }`}
          >
            {monthTotals.net >= 0 ? '' : '-'}
            {formatAmount(Math.abs(monthTotals.net))}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <search>
        <div className="filter-bar">
          <div className="filter-kind-group" role="group" aria-label="篩選類型">
            {(
              [
                ['all', '全部'],
                ['expense', '支出'],
                ['income', '收入'],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`filter-chip ${kindFilter === val ? 'active' : ''}`}
                aria-pressed={kindFilter === val}
                onClick={() => {
                  setKindFilter(val);
                  setCategoryFilter('');
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            aria-label="篩選分類"
            className="field-control filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">全部分類</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.group.name} / {c.name}
              </option>
            ))}
          </select>

          <input
            type="search"
            aria-label="搜尋備註或分類"
            className="field-control filter-search"
            placeholder="搜尋備註或分類..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </search>

      {isLoading ? (
        <Slip title="明細記錄" emptyText="載入明細中..." />
      ) : dayGroups.length === 0 ? (
        <Slip title="明細記錄" emptyText="本月尚無符合條件的交易記錄" />
      ) : (
        dayGroups.map((day) => {
          const subtotalParts: string[] = [];
          if (day.expenseTotal > 0) {
            subtotalParts.push(`支出 ${formatAmount(day.expenseTotal)}`);
          }
          if (day.incomeTotal > 0) {
            subtotalParts.push(`收入 +${formatAmount(day.incomeTotal)}`);
          }

          return (
            <Slip
              key={day.date}
              title={formatShortDateWithDay(day.date)}
              total={subtotalParts.join(' · ')}
            >
              {day.items.map((tx) => {
                const tags: string[] = [];
                if (tx.recurring_rule_id) tags.push('週期');
                if (currentLedger?.kind === 'shared' && tx.creator_name) {
                  tags.push(tx.creator_name);
                }

                return (
                  <SlipRow
                    key={tx.id}
                    category={tx.category_name}
                    meta={tags.length > 0 ? tags.join(' · ') : undefined}
                    note={tx.note ?? undefined}
                    amount={tx.amount}
                    groupColor={getGroupCssVar(tx.group_color)}
                    isIncome={tx.kind === 'income'}
                    onClick={() => setEditingTx(tx)}
                  />
                );
              })}
            </Slip>
          );
        })
      )}

      <TransactionDialog
        transaction={editingTx}
        ledgers={ledgers}
        onClose={() => setEditingTx(null)}
      />
    </div>
  );
};

export default Transactions;
