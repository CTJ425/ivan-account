import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import {
  createRecurringRule,
  deleteRecurringRule,
  fetchCategories,
  fetchRecurringRules,
  runLedgerRecurringRules,
  updateRecurringRule,
} from '../lib/api';
import { formatAmount, getGroupCssVar, toLocalDateStr } from '../lib/format';
import type { EntryKind, RecurringFrequency, RecurringRule } from '../lib/types';

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  weekly: '每週',
  monthly: '每月',
  yearly: '每年',
};

export const RecurringSettings: React.FC = () => {
  const { user } = useAuth();
  const { currentLedger } = useLedger();
  const queryClient = useQueryClient();

  const ledgerId = currentLedger?.id ?? '';
  const todayStr = toLocalDateStr(new Date());

  const [kind, setKind] = useState<EntryKind>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startOn, setStartOn] = useState(todayStr);
  const [endOn, setEndOn] = useState('');
  const [note, setNote] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories', ledgerId],
    queryFn: () => fetchCategories(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['recurring_rules', ledgerId],
    queryFn: () => fetchRecurringRules(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const activeCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.group.kind === kind && !c.archived_at && !c.group.archived_at,
      ),
    [categories, kind],
  );

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const effectiveCatId = activeCategories.some((c) => c.id === categoryId)
    ? categoryId
    : activeCategories[0]?.id ?? '';

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['recurring_rules', ledgerId] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['budgets'] });
    void queryClient.invalidateQueries({ queryKey: ['charts'] });
  };

  const createMut = useMutation({
    mutationFn: async () => {
      if (!ledgerId || !user) throw new Error('尚未登入或選擇帳本');
      const amount = Number(amountStr);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('請輸入大於 0 的整數金額');
      }
      if (!effectiveCatId) {
        throw new Error('請選擇分類');
      }
      if (endOn && endOn < startOn) {
        throw new Error('結束日期不可早於開始日期');
      }
      await createRecurringRule({
        ledger_id: ledgerId,
        category_id: effectiveCatId,
        amount,
        note: note || null,
        frequency,
        start_on: startOn,
        end_on: endOn || null,
        next_run_on: startOn,
        created_by: user.id,
      });
      // Immediately process if start_on <= today
      if (startOn <= todayStr) {
        await runLedgerRecurringRules(ledgerId);
      }
    },
    onSuccess: () => {
      setAmountStr('');
      setNote('');
      setEndOn('');
      setErrorMsg(null);
      setStatusMsg('已新增週期性項目。');
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '新增失敗'),
  });

  const toggleActiveMut = useMutation({
    mutationFn: (rule: RecurringRule) =>
      updateRecurringRule(rule.id, { active: !rule.active }),
    onSuccess: invalidate,
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '更新失敗'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteRecurringRule(id),
    onSuccess: invalidate,
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '刪除失敗'),
  });

  const runDueMut = useMutation({
    mutationFn: () => runLedgerRecurringRules(ledgerId),
    onSuccess: (count) => {
      setErrorMsg(null);
      setStatusMsg(
        count > 0 ? `已補齊並產生 ${count} 筆到期交易。` : '目前沒有到期的週期性項目。',
      );
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '執行失敗'),
  });

  return (
    <div className="page-centered-container">
      <div className="page-header-row">
        <div className="page-breadcrumb">
          <Link to="/settings" className="sheet-header-link">
            ← 設定
          </Link>
          <h1 className="page-title">週期性項目</h1>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => runDueMut.mutate()}
          disabled={!ledgerId || runDueMut.isPending}
        >
          {runDueMut.isPending ? '檢查中...' : '立即補齊到期項目'}
        </button>
      </div>

      <p className="helper-note">
        目前帳本：{currentLedger?.name ?? '載入中...'}。到期規則會由排程自動產生交易；編輯或停用只影響未來尚未產生的期數。
      </p>

      {statusMsg && (
        <div className="workspace-status-bar" role="status">
          <span className="status-dot" aria-hidden="true" />
          <p className="demo-banner">{statusMsg}</p>
        </div>
      )}

      {errorMsg && (
        <p className="form-error" role="alert">
          {errorMsg}
        </p>
      )}

      <Slip title="新增週期性規則">
        <form
          className="draft-dialog-body"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
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

          <div className="recurring-form-grid">
            <div className="field-group">
              <label htmlFor="rec-cat" className="field-label">
                分類
              </label>
              <select
                id="rec-cat"
                className="field-control"
                value={effectiveCatId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.group.name} / {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="rec-amount" className="field-label">
                金額（NT$）
              </label>
              <input
                id="rec-amount"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="field-control field-amount-input"
                placeholder="0"
                value={amountStr}
                onChange={(e) =>
                  setAmountStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))
                }
              />
            </div>

            <div className="field-group">
              <label htmlFor="rec-freq" className="field-label">
                頻率
              </label>
              <select
                id="rec-freq"
                className="field-control"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              >
                <option value="weekly">每週</option>
                <option value="monthly">每月</option>
                <option value="yearly">每年</option>
              </select>
            </div>

            <div className="field-group">
              <label htmlFor="rec-start" className="field-label">
                開始日期
              </label>
              <input
                id="rec-start"
                type="date"
                className="field-control"
                value={startOn}
                onChange={(e) => setStartOn(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="rec-end" className="field-label">
                結束日期（選填）
              </label>
              <input
                id="rec-end"
                type="date"
                className="field-control"
                value={endOn}
                onChange={(e) => setEndOn(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="rec-note" className="field-label">
                備註（選填）
              </label>
              <input
                id="rec-note"
                type="text"
                className="field-control"
                maxLength={200}
                placeholder="例如：房租、月薪"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={
              createMut.isPending ||
              !effectiveCatId ||
              !amountStr ||
              Number(amountStr) <= 0
            }
          >
            {createMut.isPending ? '建立中...' : '新增週期性項目'}
          </button>
        </form>
      </Slip>

      <Slip
        title="規則列表"
        total={`${rules.length} 筆`}
        emptyText={isLoading ? '載入中...' : '尚未建立週期性規則'}
      >
        {rules.map((rule) => {
          const cat = catMap.get(rule.category_id);
          const isIncome = cat?.group.kind === 'income';
          const color = cat ? getGroupCssVar(cat.group.color) : 'var(--g8)';

          return (
            <div key={rule.id} className="manage-item-row">
              <div className="recurring-item-info">
                <div className="slip-row-left">
                  <span
                    className="slip-chip"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="slip-category">{cat?.name ?? '未分類'}</span>
                  <span className="slip-meta-tag">{FREQ_LABEL[rule.frequency]}</span>
                  {!rule.active && <span className="slip-meta-tag">已暫停</span>}
                  {rule.note && <span className="slip-note">{rule.note}</span>}
                </div>
                <span className="slip-note">
                  下次執行：{rule.next_run_on}
                  {rule.end_on ? ` · 結束：${rule.end_on}` : ''}
                </span>
              </div>

              <div className="row-actions-inline">
                <span
                  className={`slip-amount ${isIncome ? 'slip-amount-income' : ''}`}
                >
                  {isIncome ? '+' : ''}
                  {formatAmount(rule.amount)}
                </span>
                <button
                  type="button"
                  className="mini-action-btn"
                  onClick={() => toggleActiveMut.mutate(rule)}
                >
                  {rule.active ? '暫停' : '啟用'}
                </button>
                <button
                  type="button"
                  className="mini-action-btn"
                  onClick={() => deleteMut.mutate(rule.id)}
                >
                  刪除
                </button>
              </div>
            </div>
          );
        })}
      </Slip>
    </div>
  );
};

export default RecurringSettings;
