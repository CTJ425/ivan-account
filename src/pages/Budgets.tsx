import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLedger } from '../components/ledgerContext';
import { Slip, SlipBudgetRow } from '../components/Slip';
import {
  deleteBudget,
  fetchCategories,
  fetchCategoryGroups,
  fetchEffectiveBudgets,
  fetchTransactionsRange,
  upsertBudget,
} from '../lib/api';
import {
  formatAmount,
  getGroupCssVar,
  getMonthEndStr,
  getMonthStartStr,
} from '../lib/format';
import type { BudgetRow } from '../lib/types';

export const Budgets: React.FC = () => {
  const { currentLedger } = useLedger();
  const queryClient = useQueryClient();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const [scopeVal, setScopeVal] = useState('TOTAL');
  const [amountStr, setAmountStr] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ledgerId = currentLedger?.id ?? '';
  const monthStart = getMonthStartStr(year, month);
  const monthEnd = getMonthEndStr(year, month);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const { data: groups = [] } = useQuery({
    queryKey: ['category_groups', ledgerId],
    queryFn: () => fetchCategoryGroups(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', ledgerId],
    queryFn: () => fetchCategories(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const { data: budgets = [], isLoading: loadingBudgets } = useQuery({
    queryKey: ['budgets', ledgerId, monthStart],
    queryFn: () => fetchEffectiveBudgets(ledgerId, monthStart),
    enabled: Boolean(ledgerId),
  });

  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', ledgerId, monthStart, monthEnd],
    queryFn: () => fetchTransactionsRange(ledgerId, monthStart, monthEnd),
    enabled: Boolean(ledgerId),
  });

  const expenseGroups = useMemo(
    () => groups.filter((g) => g.kind === 'expense' && !g.archived_at),
    [groups],
  );
  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.group.kind === 'expense' && !c.archived_at && !c.group.archived_at,
      ),
    [categories],
  );

  const groupMap = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const spendingSummary = useMemo(() => {
    let totalExpense = 0;
    const byGroup = new Map<string, number>();
    const byCat = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.kind !== 'expense') continue;
      totalExpense += tx.amount;
      if (tx.group_id) {
        byGroup.set(tx.group_id, (byGroup.get(tx.group_id) ?? 0) + tx.amount);
      }
      byCat.set(tx.category_id, (byCat.get(tx.category_id) ?? 0) + tx.amount);
    }
    return { totalExpense, byGroup, byCat };
  }, [transactions]);

  const enrichedBudgets = useMemo(() => {
    return budgets
      .map((b) => {
        if (!b.group_id && !b.category_id) {
          return {
            row: b,
            name: '每月總預算',
            used: spendingSummary.totalExpense,
            color: 'var(--accent)',
            order: 0,
          };
        }
        if (b.group_id) {
          const g = groupMap.get(b.group_id);
          return {
            row: b,
            name: g ? `群組：${g.name}` : '已刪除群組',
            used: spendingSummary.byGroup.get(b.group_id) ?? 0,
            color: g ? getGroupCssVar(g.color) : 'var(--g8)',
            order: 1,
          };
        }
        const c = b.category_id ? catMap.get(b.category_id) : undefined;
        return {
          row: b,
          name: c ? `分類：${c.name}` : '已刪除分類',
          used: b.category_id ? spendingSummary.byCat.get(b.category_id) ?? 0 : 0,
          color: c ? getGroupCssVar(c.group.color) : 'var(--g8)',
          order: 2,
        };
      })
      .sort((a, b) => a.order - b.order);
  }, [budgets, spendingSummary, groupMap, catMap]);

  const maxScale = useMemo(() => {
    return enrichedBudgets.reduce(
      (max, item) => Math.max(max, item.row.amount, item.used),
      1,
    );
  }, [enrichedBudgets]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!ledgerId) return;
      const amount = Number(amountStr);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('請輸入大於 0 的整數預算金額');
      }
      let group_id: string | null = null;
      let category_id: string | null = null;
      if (scopeVal.startsWith('group:')) {
        group_id = scopeVal.slice('group:'.length);
      } else if (scopeVal.startsWith('cat:')) {
        category_id = scopeVal.slice('cat:'.length);
      }
      await upsertBudget({
        ledger_id: ledgerId,
        group_id,
        category_id,
        amount,
        effective_from: monthStart,
      });
    },
    onSuccess: () => {
      setAmountStr('');
      setErrorMsg(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '儲存預算失敗'),
  });

  const deleteMutation = useMutation({
    mutationFn: (row: BudgetRow) => deleteBudget(row.id),
    onSuccess: invalidate,
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '刪除失敗'),
  });

  return (
    <div className="page-centered-container">
      <div className="page-header-row">
        <h1 className="page-title">預算</h1>

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

      <p className="helper-note">
        預算自「{year} 年 {month + 1} 月」起生效並自動沿用到之後月份（不跨月結轉）。超過 80% 顯示警示色，超過 100% 標示超支。
      </p>

      <Slip title="設定或更新預算">
        <form
          className="budget-form-grid"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          <div className="field-group">
            <label htmlFor="budget-scope" className="field-label">
              預算對象
            </label>
            <select
              id="budget-scope"
              className="field-control"
              value={scopeVal}
              onChange={(e) => setScopeVal(e.target.value)}
            >
              <option value="TOTAL">每月總預算</option>
              {expenseGroups.length > 0 && (
                <optgroup label="群組預算">
                  {expenseGroups.map((g) => (
                    <option key={g.id} value={`group:${g.id}`}>
                      群組：{g.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {expenseCategories.length > 0 && (
                <optgroup label="分類預算">
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={`cat:${c.id}`}>
                      {c.group.name} / {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="budget-amount" className="field-label">
              金額（NT$）
            </label>
            <input
              id="budget-amount"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="field-control field-amount-input"
              placeholder="例如 20000"
              value={amountStr}
              onChange={(e) =>
                setAmountStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))
              }
            />
          </div>

          <button
            type="submit"
            className="btn-primary budget-submit-btn"
            disabled={saveMutation.isPending || !amountStr || Number(amountStr) <= 0}
          >
            {saveMutation.isPending ? '儲存中...' : '儲存預算'}
          </button>
        </form>
        {errorMsg && (
          <div className="slip-row">
            <p className="form-error" role="alert">
              {errorMsg}
            </p>
          </div>
        )}
      </Slip>

      <Slip
        title={`${year} 年 ${month + 1} 月預算進度`}
        total={`本月總支出 ${formatAmount(spendingSummary.totalExpense)}`}
        emptyText={loadingBudgets || loadingTx ? '載入中...' : '尚未設定任何預算'}
      >
        {enrichedBudgets.map((item) => (
          <div key={item.row.id} className="budget-item-wrapper">
            <SlipBudgetRow
              name={item.name}
              used={item.used}
              budget={item.row.amount}
              maxScale={maxScale}
              color={item.color}
            />
            <div className="budget-item-meta">
              <span className="slip-note">
                自 {item.row.effective_from.slice(0, 7)} 起生效
              </span>
              <button
                type="button"
                className="mini-action-btn"
                onClick={() => deleteMutation.mutate(item.row)}
                disabled={deleteMutation.isPending}
              >
                移除此設定
              </button>
            </div>
          </div>
        ))}
      </Slip>
    </div>
  );
};

export default Budgets;
