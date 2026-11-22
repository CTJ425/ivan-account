import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { Slip } from '../components/Slip';
import {
  addAllowedEmail,
  checkIsAdmin,
  fetchAllowedEmails,
  removeAllowedEmail,
} from '../lib/api';

export const WhitelistSettings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: isAdmin = false, isLoading: loadingAdmin } = useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: checkIsAdmin,
    enabled: Boolean(user?.id),
  });

  const { data: emails = [], isLoading: loadingEmails } = useQuery({
    queryKey: ['allowed_emails'],
    queryFn: fetchAllowedEmails,
    enabled: isAdmin,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['allowed_emails'] });
  };

  const addMut = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const normalized = newEmail.trim().toLowerCase();
      if (!normalized || !normalized.includes('@')) {
        throw new Error('請輸入有效的 Google Email');
      }
      await addAllowedEmail(normalized, user.id);
    },
    onSuccess: () => {
      setNewEmail('');
      setErrorMsg(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '新增失敗'),
  });

  const removeMut = useMutation({
    mutationFn: (email: string) => removeAllowedEmail(email),
    onSuccess: () => {
      setErrorMsg(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '移除失敗'),
  });

  const selfEmail = (user?.email ?? '').toLowerCase();

  return (
    <div className="page-centered-container">
      <div className="page-breadcrumb">
        <Link to="/settings" className="sheet-header-link">
          ← 設定
        </Link>
        <h1 className="page-title">白名單管理</h1>
      </div>

      {loadingAdmin ? (
        <Slip title="白名單" emptyText="驗證權限中..." />
      ) : !isAdmin ? (
        <Slip title="權限不足" emptyText="僅管理員可查看與管理登入白名單。" />
      ) : (
        <>
          <p className="helper-note">
            最多可設定 5 個授權登入的 Google 帳號。從白名單移除後會立即登出該帳號，其歷史紀錄仍會保留。
          </p>

          {errorMsg && (
            <p className="form-error" role="alert">
              {errorMsg}
            </p>
          )}

          <Slip title="新增白名單帳號">
            <form
              className="inline-add-form"
              onSubmit={(e) => {
                e.preventDefault();
                addMut.mutate();
              }}
            >
              <input
                type="email"
                aria-label="Google 帳號 Email"
                className="field-control inline-add-input"
                placeholder="example@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={emails.length >= 5}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  addMut.isPending || emails.length >= 5 || !newEmail.trim()
                }
              >
                {emails.length >= 5 ? '已達 5 人上限' : '加入白名單'}
              </button>
            </form>
          </Slip>

          <Slip
            title="已授權帳號"
            total={`${emails.length} / 5`}
            emptyText={loadingEmails ? '載入中...' : '尚無白名單資料'}
          >
            {emails.map((row) => (
              <div key={row.email} className="manage-item-row">
                <div className="slip-row-left">
                  <span className="slip-category">{row.email}</span>
                  {row.is_admin && <span className="slip-meta-tag">管理員</span>}
                  {row.email === selfEmail && (
                    <span className="slip-meta-tag">目前帳號</span>
                  )}
                </div>
                {row.email !== selfEmail && (
                  <button
                    type="button"
                    className="mini-action-btn"
                    onClick={() => removeMut.mutate(row.email)}
                    disabled={removeMut.isPending}
                  >
                    移除
                  </button>
                )}
              </div>
            ))}
          </Slip>
        </>
      )}
    </div>
  );
};

export default WhitelistSettings;
