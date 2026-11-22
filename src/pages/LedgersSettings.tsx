import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import {
  addLedgerMember,
  createSharedLedger,
  deleteLedger,
  fetchLedgerMembers,
  fetchProfiles,
  removeLedgerMember,
  renameLedger,
} from '../lib/api';
import type { Ledger } from '../lib/types';

export const LedgersSettings: React.FC = () => {
  const { user } = useAuth();
  const { ledgers, currentLedger, setLedgerId } = useLedger();
  const queryClient = useQueryClient();

  const [newLedgerName, setNewLedgerName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [selectedProfileByLedger, setSelectedProfileByLedger] = useState<
    Record<string, string>
  >({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: fetchProfiles,
  });

  const invalidateLedgers = () => {
    void queryClient.invalidateQueries({ queryKey: ['ledgers'] });
    void queryClient.invalidateQueries({ queryKey: ['ledger_members'] });
  };

  const createMut = useMutation({
    mutationFn: () => createSharedLedger(newLedgerName),
    onSuccess: (created) => {
      setNewLedgerName('');
      setErrorMsg(null);
      setLedgerId(created.id);
      invalidateLedgers();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '建立失敗'),
  });

  const renameMut = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameLedger(id, name),
    onSuccess: () => {
      setRenamingId(null);
      setErrorMsg(null);
      invalidateLedgers();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '改名失敗'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteLedger(id),
    onSuccess: (_d, deletedId) => {
      setConfirmDeleteId(null);
      if (currentLedger?.id === deletedId) {
        const personal = ledgers.find((l) => l.kind === 'personal');
        if (personal) setLedgerId(personal.id);
      }
      invalidateLedgers();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '刪除失敗'),
  });

  return (
    <div className="page-centered-container">
      <div className="page-breadcrumb">
        <Link to="/settings" className="sheet-header-link">
          ← 設定
        </Link>
        <h1 className="page-title">帳本與成員</h1>
      </div>

      <p className="helper-note">
        每位家人都有一本只有自己看得到的「個人帳本」。共用帳本可由建立者（owner）邀請已登入過的家人加入。
      </p>

      {errorMsg && (
        <p className="form-error" role="alert">
          {errorMsg}
        </p>
      )}

      <Slip title="建立共用帳本">
        <form
          className="inline-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <input
            type="text"
            aria-label="共用帳本名稱"
            className="field-control inline-add-input"
            placeholder="輸入帳本名稱（例如：家庭、旅遊）"
            maxLength={40}
            value={newLedgerName}
            onChange={(e) => setNewLedgerName(e.target.value)}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={createMut.isPending || !newLedgerName.trim()}
          >
            {createMut.isPending ? '建立中...' : '建立共用帳本'}
          </button>
        </form>
      </Slip>

      {ledgers.map((ledger) => (
        <LedgerManageCard
          key={ledger.id}
          ledger={ledger}
          isActive={ledger.id === currentLedger?.id}
          currentUserId={user?.id ?? ''}
          profiles={profiles}
          renaming={renamingId === ledger.id}
          renameVal={renameVal}
          confirmDelete={confirmDeleteId === ledger.id}
          selectedMemberToAdd={selectedProfileByLedger[ledger.id] ?? ''}
          onStartRename={() => {
            setRenamingId(ledger.id);
            setRenameVal(ledger.name);
          }}
          onCancelRename={() => setRenamingId(null)}
          onChangeRenameVal={setRenameVal}
          onSubmitRename={() => renameMut.mutate({ id: ledger.id, name: renameVal })}
          onRequestDelete={() => setConfirmDeleteId(ledger.id)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onConfirmDelete={() => deleteMut.mutate(ledger.id)}
          onSelectActive={() => setLedgerId(ledger.id)}
          onSelectProfile={(uid) =>
            setSelectedProfileByLedger((prev) => ({ ...prev, [ledger.id]: uid }))
          }
          onError={setErrorMsg}
        />
      ))}
    </div>
  );
};

interface LedgerManageCardProps {
  ledger: Ledger;
  isActive: boolean;
  currentUserId: string;
  profiles: { user_id: string; email: string; display_name: string | null }[];
  renaming: boolean;
  renameVal: string;
  confirmDelete: boolean;
  selectedMemberToAdd: string;
  onStartRename: () => void;
  onCancelRename: () => void;
  onChangeRenameVal: (v: string) => void;
  onSubmitRename: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onSelectActive: () => void;
  onSelectProfile: (uid: string) => void;
  onError: (msg: string) => void;
}

const LedgerManageCard: React.FC<LedgerManageCardProps> = ({
  ledger,
  isActive,
  currentUserId,
  profiles,
  renaming,
  renameVal,
  confirmDelete,
  selectedMemberToAdd,
  onStartRename,
  onCancelRename,
  onChangeRenameVal,
  onSubmitRename,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onSelectActive,
  onSelectProfile,
  onError,
}) => {
  const queryClient = useQueryClient();
  const isOwner = ledger.my_role === 'owner';

  const { data: members = [] } = useQuery({
    queryKey: ['ledger_members', ledger.id],
    queryFn: () => fetchLedgerMembers(ledger.id),
  });

  const addMemberMut = useMutation({
    mutationFn: (userId: string) => addLedgerMember(ledger.id, userId),
    onSuccess: () => {
      onSelectProfile('');
      void queryClient.invalidateQueries({ queryKey: ['ledger_members', ledger.id] });
    },
    onError: (err) => onError(err instanceof Error ? err.message : '加入成員失敗'),
  });

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) => removeLedgerMember(ledger.id, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ledger_members', ledger.id] });
    },
    onError: (err) => onError(err instanceof Error ? err.message : '移除成員失敗'),
  });

  const memberIds = new Set(members.map((m) => m.user_id));
  const availableProfiles = profiles.filter((p) => !memberIds.has(p.user_id));

  return (
    <Slip
      title={`${ledger.name}（${ledger.kind === 'personal' ? '個人帳本' : '共用帳本'}）`}
      headerRight={
        <div className="row-actions-inline">
          {!isActive ? (
            <button type="button" className="mini-action-btn" onClick={onSelectActive}>
              切換使用
            </button>
          ) : (
            <span className="slip-meta-tag">使用中</span>
          )}
          {ledger.kind === 'shared' && isOwner && (
            <>
              <button type="button" className="mini-action-btn" onClick={onStartRename}>
                改名
              </button>
              <button type="button" className="mini-action-btn" onClick={onRequestDelete}>
                刪除
              </button>
            </>
          )}
        </div>
      }
    >
      {renaming && (
        <form
          className="inline-edit-strip"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitRename();
          }}
        >
          <input
            type="text"
            aria-label="修改帳本名稱"
            className="field-control inline-add-input"
            maxLength={40}
            value={renameVal}
            onChange={(e) => onChangeRenameVal(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            儲存
          </button>
          <button type="button" className="btn-secondary" onClick={onCancelRename}>
            取消
          </button>
        </form>
      )}

      {confirmDelete && (
        <div className="inline-edit-strip danger-strip">
          <span className="form-error">確定刪除此共用帳本與所有交易？</span>
          <button type="button" className="btn-danger-solid" onClick={onConfirmDelete}>
            確認刪除
          </button>
          <button type="button" className="btn-secondary" onClick={onCancelDelete}>
            取消
          </button>
        </div>
      )}

      {members.map((m) => (
        <div key={m.user_id} className="manage-item-row">
          <div className="slip-row-left">
            <span className="slip-category">
              {m.profile?.display_name || m.profile?.email || m.user_id}
            </span>
            <span className="slip-meta-tag">
              {m.role === 'owner' ? '擁有者' : '成員'}
            </span>
            {m.profile?.email && (
              <span className="slip-note">{m.profile.email}</span>
            )}
          </div>
          {ledger.kind === 'shared' && isOwner && m.user_id !== currentUserId && (
            <button
              type="button"
              className="mini-action-btn"
              onClick={() => removeMemberMut.mutate(m.user_id)}
              disabled={removeMemberMut.isPending}
            >
              移除
            </button>
          )}
        </div>
      ))}

      {ledger.kind === 'shared' && isOwner && (
        <form
          className="inline-edit-strip"
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedMemberToAdd) addMemberMut.mutate(selectedMemberToAdd);
          }}
        >
          <select
            aria-label={`為 ${ledger.name} 選擇要加入的家人`}
            className="field-control inline-add-input"
            value={selectedMemberToAdd}
            onChange={(e) => onSelectProfile(e.target.value)}
          >
            <option value="">
              {availableProfiles.length === 0
                ? '沒有其他已登入過的家人可加入'
                : '選擇要加入的家人...'}
            </option>
            {availableProfiles.map((p) => (
              <option key={p.user_id} value={p.user_id}>
                {p.display_name ? `${p.display_name} (${p.email})` : p.email}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="btn-secondary"
            disabled={!selectedMemberToAdd || addMemberMut.isPending}
          >
            加入成員
          </button>
        </form>
      )}
    </Slip>
  );
};

export default LedgersSettings;
