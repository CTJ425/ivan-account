import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLedger } from '../components/ledgerContext';
import { Slip } from '../components/Slip';
import {
  createCategory,
  createCategoryGroup,
  fetchCategories,
  fetchCategoryGroups,
  updateCategory,
  updateCategoryGroup,
} from '../lib/api';
import { GROUP_COLOR_OPTIONS, getGroupCssVar } from '../lib/format';
import type { Category, CategoryGroup, EntryKind, GroupColorCode } from '../lib/types';

export const Categories: React.FC = () => {
  const { currentLedger } = useLedger();
  const queryClient = useQueryClient();

  const [kind, setKind] = useState<EntryKind>('expense');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState<GroupColorCode>('g1');
  const [newCatNames, setNewCatNames] = useState<Record<string, string>>({});
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [renameGroupVal, setRenameGroupVal] = useState('');
  const [renamingCatId, setRenamingCatId] = useState<string | null>(null);
  const [renameCatVal, setRenameCatVal] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ledgerId = currentLedger?.id ?? '';

  const { data: groups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['category_groups', ledgerId],
    queryFn: () => fetchCategoryGroups(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['categories', ledgerId],
    queryFn: () => fetchCategories(ledgerId),
    enabled: Boolean(ledgerId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['category_groups', ledgerId] });
    void queryClient.invalidateQueries({ queryKey: ['categories', ledgerId] });
    void queryClient.invalidateQueries({ queryKey: ['transactions'] });
  };

  const kindGroups = useMemo(
    () =>
      groups
        .filter((g) => g.kind === kind && (showArchived || !g.archived_at))
        .sort((a, b) => a.sort_order - b.sort_order),
    [groups, kind, showArchived],
  );

  const catsByGroup = useMemo(() => {
    const map = new Map<string, Category[]>();
    for (const c of categories) {
      if (!showArchived && c.archived_at) continue;
      const list = map.get(c.group_id) ?? [];
      list.push(c);
      map.set(c.group_id, list);
    }
    return map;
  }, [categories, showArchived]);

  const addGroupMut = useMutation({
    mutationFn: async () => {
      if (!ledgerId) return;
      const trimmed = newGroupName.trim();
      if (!trimmed) throw new Error('請輸入群組名稱');
      const maxOrder = groups.reduce((m, g) => Math.max(m, g.sort_order), 0);
      await createCategoryGroup({
        ledger_id: ledgerId,
        name: trimmed,
        kind,
        color: kind === 'income' ? 'income' : newGroupColor,
        sort_order: maxOrder + 10,
      });
    },
    onSuccess: () => {
      setNewGroupName('');
      setErrorMsg(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '新增群組失敗'),
  });

  const addCatMut = useMutation({
    mutationFn: async ({ groupId, name }: { groupId: string; name: string }) => {
      if (!ledgerId) return;
      const trimmed = name.trim();
      if (!trimmed) throw new Error('請輸入分類名稱');
      const siblings = categories.filter((c) => c.group_id === groupId);
      const maxOrder = siblings.reduce((m, c) => Math.max(m, c.sort_order), 0);
      await createCategory({
        ledger_id: ledgerId,
        group_id: groupId,
        name: trimmed,
        sort_order: maxOrder + 10,
      });
    },
    onSuccess: (_data, vars) => {
      setNewCatNames((prev) => ({ ...prev, [vars.groupId]: '' }));
      setErrorMsg(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '新增分類失敗'),
  });

  const renameGroupMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('名稱不可空白');
      await updateCategoryGroup(id, { name: trimmed });
    },
    onSuccess: () => {
      setRenamingGroupId(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '改名失敗'),
  });

  const renameCatMut = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error('名稱不可空白');
      await updateCategory(id, { name: trimmed });
    },
    onSuccess: () => {
      setRenamingCatId(null);
      invalidate();
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : '改名失敗'),
  });

  const toggleArchiveGroup = useMutation({
    mutationFn: async (group: CategoryGroup) => {
      await updateCategoryGroup(group.id, {
        archived_at: group.archived_at ? null : new Date().toISOString(),
      });
    },
    onSuccess: invalidate,
  });

  const toggleArchiveCat = useMutation({
    mutationFn: async (cat: Category) => {
      await updateCategory(cat.id, {
        archived_at: cat.archived_at ? null : new Date().toISOString(),
      });
    },
    onSuccess: invalidate,
  });

  const moveGroup = async (index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= kindGroups.length) return;
    const a = kindGroups[index];
    const b = kindGroups[targetIdx];
    const aOrder = a.sort_order === b.sort_order ? (index + 1) * 10 : a.sort_order;
    const bOrder = a.sort_order === b.sort_order ? (targetIdx + 1) * 10 : b.sort_order;
    await Promise.all([
      updateCategoryGroup(a.id, { sort_order: bOrder }),
      updateCategoryGroup(b.id, { sort_order: aOrder }),
    ]);
    invalidate();
  };

  const moveCat = async (list: Category[], index: number, delta: -1 | 1) => {
    const targetIdx = index + delta;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const a = list[index];
    const b = list[targetIdx];
    const aOrder = a.sort_order === b.sort_order ? (index + 1) * 10 : a.sort_order;
    const bOrder = a.sort_order === b.sort_order ? (targetIdx + 1) * 10 : b.sort_order;
    await Promise.all([
      updateCategory(a.id, { sort_order: bOrder }),
      updateCategory(b.id, { sort_order: aOrder }),
    ]);
    invalidate();
  };

  return (
    <div className="page-centered-container">
      <div className="page-header-row">
        <div className="page-breadcrumb">
          <Link to="/settings" className="sheet-header-link">
            ← 設定
          </Link>
          <h1 className="page-title">分類管理</h1>
        </div>

        <label className="inline-check-label">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          <span>顯示已封存</span>
        </label>
      </div>

      <p className="helper-note">
        目前帳本：{currentLedger?.name ?? '載入中...'}。封存群組或分類時，歷史交易與報表紀錄仍會完整保留。
      </p>

      <div className="segmented-control" role="group" aria-label="切換分類種類">
        <button
          type="button"
          className={`segmented-btn ${kind === 'expense' ? 'active-expense' : ''}`}
          aria-pressed={kind === 'expense'}
          onClick={() => setKind('expense')}
        >
          支出分類
        </button>
        <button
          type="button"
          className={`segmented-btn ${kind === 'income' ? 'active-income' : ''}`}
          aria-pressed={kind === 'income'}
          onClick={() => setKind('income')}
        >
          收入分類
        </button>
      </div>

      {errorMsg && (
        <p className="form-error" role="alert">
          {errorMsg}
        </p>
      )}

      {/* Add Group Form */}
      <Slip title={kind === 'expense' ? '新增支出群組' : '新增收入群組'}>
        <form
          className="inline-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            addGroupMut.mutate();
          }}
        >
          <input
            type="text"
            aria-label="新群組名稱"
            className="field-control inline-add-input"
            placeholder="輸入群組名稱（例如：醫療、寵物）"
            maxLength={30}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />

          {kind === 'expense' && (
            <div className="color-picker-row" role="group" aria-label="選擇群組色盤">
              {GROUP_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  className={`color-swatch-btn ${
                    newGroupColor === c.code ? 'selected' : ''
                  }`}
                  style={{ backgroundColor: getGroupCssVar(c.code) }}
                  aria-label={`顏色：${c.label}`}
                  aria-pressed={newGroupColor === c.code}
                  onClick={() => setNewGroupColor(c.code)}
                />
              ))}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={addGroupMut.isPending || !newGroupName.trim()}
          >
            新增群組
          </button>
        </form>
      </Slip>

      {loadingGroups || loadingCats ? (
        <Slip title="分類列表" emptyText="載入分類中..." />
      ) : kindGroups.length === 0 ? (
        <Slip title="分類列表" emptyText="尚無分類群組" />
      ) : (
        kindGroups.map((group, gIdx) => {
          const groupCats = catsByGroup.get(group.id) ?? [];
          const isArchived = Boolean(group.archived_at);

          return (
            <Slip
              key={group.id}
              title={isArchived ? `${group.name}（已封存）` : group.name}
              headerRight={
                <div className="row-actions-inline">
                  <button
                    type="button"
                    className="mini-action-btn"
                    onClick={() => moveGroup(gIdx, -1)}
                    disabled={gIdx === 0}
                    aria-label={`上移 ${group.name}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn"
                    onClick={() => moveGroup(gIdx, 1)}
                    disabled={gIdx === kindGroups.length - 1}
                    aria-label={`下移 ${group.name}`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn"
                    onClick={() => {
                      setRenamingGroupId(group.id);
                      setRenameGroupVal(group.name);
                    }}
                  >
                    改名
                  </button>
                  <button
                    type="button"
                    className="mini-action-btn"
                    onClick={() => toggleArchiveGroup.mutate(group)}
                  >
                    {isArchived ? '還原' : '封存'}
                  </button>
                </div>
              }
            >
              {renamingGroupId === group.id && (
                <form
                  className="inline-edit-strip"
                  onSubmit={(e) => {
                    e.preventDefault();
                    renameGroupMut.mutate({ id: group.id, name: renameGroupVal });
                  }}
                >
                  <input
                    type="text"
                    aria-label="修改群組名稱"
                    className="field-control inline-add-input"
                    maxLength={30}
                    value={renameGroupVal}
                    onChange={(e) => setRenameGroupVal(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">
                    儲存
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setRenamingGroupId(null)}
                  >
                    取消
                  </button>
                </form>
              )}

              {kind === 'expense' && (
                <div className="group-color-strip">
                  <span className="field-label">色盤：</span>
                  {GROUP_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      className={`color-swatch-btn ${
                        group.color === c.code ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: getGroupCssVar(c.code) }}
                      aria-label={`${group.name} 改為 ${c.label}`}
                      aria-pressed={group.color === c.code}
                      onClick={() => {
                        void updateCategoryGroup(group.id, { color: c.code }).then(
                          invalidate,
                        );
                      }}
                    />
                  ))}
                </div>
              )}

              {groupCats.length === 0 ? (
                <div className="slip-empty">此群組尚無分類</div>
              ) : (
                groupCats.map((cat, cIdx) => {
                  const catArchived = Boolean(cat.archived_at);
                  return (
                    <div key={cat.id} className="manage-item-row">
                      {renamingCatId === cat.id ? (
                        <form
                          className="inline-edit-strip full-width"
                          onSubmit={(e) => {
                            e.preventDefault();
                            renameCatMut.mutate({ id: cat.id, name: renameCatVal });
                          }}
                        >
                          <input
                            type="text"
                            aria-label="修改分類名稱"
                            className="field-control inline-add-input"
                            maxLength={30}
                            value={renameCatVal}
                            onChange={(e) => setRenameCatVal(e.target.value)}
                          />
                          <button type="submit" className="btn-primary">
                            儲存
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setRenamingCatId(null)}
                          >
                            取消
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="slip-row-left">
                            <span
                              className="slip-chip"
                              style={{ backgroundColor: getGroupCssVar(group.color) }}
                              aria-hidden="true"
                            />
                            <span
                              className={`slip-category ${
                                catArchived ? 'text-muted' : ''
                              }`}
                            >
                              {cat.name}
                              {catArchived ? '（已封存）' : ''}
                            </span>
                          </div>
                          <div className="row-actions-inline">
                            <button
                              type="button"
                              className="mini-action-btn"
                              onClick={() => moveCat(groupCats, cIdx, -1)}
                              disabled={cIdx === 0}
                              aria-label={`上移 ${cat.name}`}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="mini-action-btn"
                              onClick={() => moveCat(groupCats, cIdx, 1)}
                              disabled={cIdx === groupCats.length - 1}
                              aria-label={`下移 ${cat.name}`}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="mini-action-btn"
                              onClick={() => {
                                setRenamingCatId(cat.id);
                                setRenameCatVal(cat.name);
                              }}
                            >
                              改名
                            </button>
                            <button
                              type="button"
                              className="mini-action-btn"
                              onClick={() => toggleArchiveCat.mutate(cat)}
                            >
                              {catArchived ? '還原' : '封存'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}

              {!isArchived && (
                <form
                  className="inline-edit-strip"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addCatMut.mutate({
                      groupId: group.id,
                      name: newCatNames[group.id] ?? '',
                    });
                  }}
                >
                  <input
                    type="text"
                    aria-label={`在 ${group.name} 新增分類`}
                    className="field-control inline-add-input"
                    placeholder={`在「${group.name}」新增分類...`}
                    maxLength={30}
                    value={newCatNames[group.id] ?? ''}
                    onChange={(e) =>
                      setNewCatNames((prev) => ({
                        ...prev,
                        [group.id]: e.target.value,
                      }))
                    }
                  />
                  <button
                    type="submit"
                    className="btn-secondary"
                    disabled={
                      addCatMut.isPending || !(newCatNames[group.id] ?? '').trim()
                    }
                  >
                    新增
                  </button>
                </form>
              )}
            </Slip>
          );
        })
      )}
    </div>
  );
};

export default Categories;
