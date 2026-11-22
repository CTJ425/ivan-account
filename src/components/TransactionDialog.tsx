import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteTransaction, fetchCategories, updateTransaction } from '../lib/api';
import { getGroupCssVar } from '../lib/format';
import type { EntryKind, Ledger, TransactionWithDetails } from '../lib/types';

export interface TransactionDialogProps {
  transaction: TransactionWithDetails | null;
  ledgers: Ledger[];
  onClose: () => void;
}

export const TransactionDialog: React.FC<TransactionDialogProps> = ({
  transaction,
  ledgers,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const queryClient = useQueryClient();

  const [ledgerId, setLedgerId] = useState('');
  const [kind, setKind] = useState<EntryKind>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [occurredOn, setOccurredOn] = useState('');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (transaction) {
      setLedgerId(transaction.ledger_id);
      setKind(transaction.kind);
      setCategoryId(transaction.category_id);
      setAmountStr(String(transaction.amount));
      setOccurredOn(transaction.occurred_on);
      setNote(transaction.note ?? '');
      setConfirmDelete(false);
      setErrorMsg(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [transaction]);

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories', ledgerId],
    queryFn: () => fetchCategories(ledgerId),
    enabled: Boolean(transaction && ledgerId),
  });

  const activeCategories = categories.filter(
    (c) => c.group.kind === kind && !c.archived_at && !c.group.archived_at,
  );

  // If switching ledger or kind invalidates selected category, pick first available
  useEffect(() => {
    if (!transaction || loadingCats) return;
    const stillValid = activeCategories.some((c) => c.id === categoryId);
    if (!stillValid) {
      setCategoryId(activeCategories[0]?.id ?? '');
    }
  }, [ledgerId, kind, loadingCats, activeCategories, categoryId, transaction]);

  const invalidateAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
    void queryClient.invalidateQueries({ queryKey: ['budgets'] });
    void queryClient.invalidateQueries({ queryKey: ['charts'] });
  };

  const updateMut = useMutation({
    mutationFn: async () => {
      if (!transaction) return;
      const amount = Number(amountStr);
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error('請輸入大於 0 的整數金額');
      }
      if (!categoryId) {
        throw new Error('請選擇分類');
      }
      await updateTransaction(transaction.id, {
        ledger_id: ledgerId,
        category_id: categoryId,
        amount,
        occurred_on: occurredOn,
        note,
      });
    },
    onSuccess: () => {
      invalidateAll();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : '儲存失敗');
    },
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      if (!transaction) return;
      await deleteTransaction(transaction.id);
    },
    onSuccess: () => {
      invalidateAll();
      onClose();
    },
    onError: (err) => {
      setErrorMsg(err instanceof Error ? err.message : '刪除失敗');
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    updateMut.mutate();
  };

  return (
    <dialog
      ref={dialogRef}
      className="draft-dialog"
      aria-labelledby="tx-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="draft-dialog-head">
        <h2 id="tx-dialog-title" className="draft-dialog-title">
          編輯交易
        </h2>
        <button
          type="button"
          className="draft-dialog-close"
          onClick={onClose}
          aria-label="關閉對話框"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <form className="draft-dialog-body" onSubmit={handleSubmit}>
        {ledgers.length > 1 && (
          <div className="field-group">
            <label htmlFor="tx-edit-ledger" className="field-label">
              帳本
            </label>
            <select
              id="tx-edit-ledger"
              className="field-control"
              value={ledgerId}
              onChange={(e) => {
                setLedgerId(e.target.value);
                setCategoryId('');
              }}
            >
              {ledgers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}（{l.kind === 'personal' ? '個人' : '共用'}）
                </option>
              ))}
            </select>
          </div>
        )}

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

        <div className="field-group">
          <label htmlFor="tx-edit-amount" className="field-label">
            金額（NT$）
          </label>
          <input
            id="tx-edit-amount"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="field-control field-amount-input"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, '').slice(0, 9))}
            required
          />
        </div>

        <div className="field-group">
          <span className="field-label">分類</span>
          {loadingCats ? (
            <div className="sheet-empty">載入分類...</div>
          ) : activeCategories.length === 0 ? (
            <div className="sheet-empty">此帳本尚無對應分類</div>
          ) : (
            <div className="category-grid">
              {activeCategories.map((cat) => {
                const selected = cat.id === categoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-card-btn ${selected ? 'selected' : ''}`}
                    style={{ '--cat-color': getGroupCssVar(cat.group.color) } as React.CSSProperties}
                    aria-pressed={selected}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <span
                      className="category-tile-chip"
                      style={{ backgroundColor: getGroupCssVar(cat.group.color) }}
                      aria-hidden="true"
                    />
                    <span className="category-label">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="date-note-row">
          <div className="field-group field-date-col">
            <label htmlFor="tx-edit-date" className="field-label">
              日期
            </label>
            <input
              id="tx-edit-date"
              type="date"
              className="field-control"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              required
            />
          </div>

          <div className="field-group field-note-col">
            <label htmlFor="tx-edit-note" className="field-label">
              備註
            </label>
            <input
              id="tx-edit-note"
              type="text"
              className="field-control"
              maxLength={200}
              placeholder="備註（選填）"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        {errorMsg && (
          <p className="form-error" role="alert">
            {errorMsg}
          </p>
        )}

        <div className="draft-dialog-actions">
          {!confirmDelete ? (
            <button
              type="button"
              className="btn-danger-outline"
              onClick={() => setConfirmDelete(true)}
              disabled={updateMut.isPending || deleteMut.isPending}
            >
              刪除
            </button>
          ) : (
            <div className="delete-confirm-group">
              <button
                type="button"
                className="btn-danger-solid"
                onClick={() => deleteMut.mutate()}
                disabled={deleteMut.isPending}
              >
                {deleteMut.isPending ? '刪除中...' : '確認刪除'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMut.isPending}
              >
                取消
              </button>
            </div>
          )}

          <div className="dialog-right-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={updateMut.isPending || deleteMut.isPending}
            >
              關閉
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                updateMut.isPending ||
                deleteMut.isPending ||
                !categoryId ||
                !amountStr ||
                Number(amountStr) <= 0
              }
            >
              {updateMut.isPending ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
};

export default TransactionDialog;
