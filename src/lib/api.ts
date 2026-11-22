import { supabase } from './supabase';
import type {
  AllowedEmail,
  BudgetRow,
  Category,
  CategoryGroup,
  CategoryWithGroup,
  EntryKind,
  GroupColorCode,
  Ledger,
  LedgerMember,
  LedgerRole,
  PeriodSeriesPoint,
  PeriodSummaryItem,
  Profile,
  RecurringFrequency,
  RecurringRule,
  TransactionRow,
  TransactionWithDetails,
} from './types';

function assertOk<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('預期資料為空');
  return data;
}

// ============================================================================
// Ledgers & Members
// ============================================================================

export async function fetchLedgers(userId: string): Promise<Ledger[]> {
  // Ensure personal ledger exists idempotently on first load
  await supabase.rpc('ensure_personal_ledger');

  const { data: ledgers, error: ledgersErr } = await supabase
    .from('ledgers')
    .select('*')
    .order('kind', { ascending: true })
    .order('created_at', { ascending: true });
  const rows = assertOk(ledgers, ledgersErr) as Ledger[];

  const { data: memberships, error: memErr } = await supabase
    .from('ledger_members')
    .select('ledger_id, role')
    .eq('user_id', userId);
  if (memErr) throw new Error(memErr.message);

  const roleMap = new Map<string, LedgerRole>();
  for (const m of memberships ?? []) {
    roleMap.set(m.ledger_id as string, m.role as LedgerRole);
  }

  return rows.map((l) => ({
    ...l,
    my_role: roleMap.get(l.id) ?? 'member',
  }));
}

export async function createSharedLedger(name: string): Promise<Ledger> {
  const { data, error } = await supabase.rpc('create_shared_ledger', {
    p_name: name.trim(),
  });
  return assertOk(data, error) as Ledger;
}

export async function renameLedger(ledgerId: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('ledgers')
    .update({ name: name.trim() })
    .eq('id', ledgerId);
  if (error) throw new Error(error.message);
}

export async function deleteLedger(ledgerId: string): Promise<void> {
  const { error } = await supabase.from('ledgers').delete().eq('id', ledgerId);
  if (error) throw new Error(error.message);
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, email, display_name, created_at')
    .order('created_at', { ascending: true });
  return assertOk(data, error) as Profile[];
}

export async function fetchLedgerMembers(ledgerId: string): Promise<LedgerMember[]> {
  const { data: members, error: memErr } = await supabase
    .from('ledger_members')
    .select('ledger_id, user_id, role, created_at')
    .eq('ledger_id', ledgerId)
    .order('created_at', { ascending: true });
  const rows = assertOk(members, memErr) as LedgerMember[];

  const profiles = await fetchProfiles();
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

  return rows.map((m) => ({
    ...m,
    profile: profileMap.get(m.user_id) ?? null,
  }));
}

export async function addLedgerMember(ledgerId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('ledger_members')
    .insert({ ledger_id: ledgerId, user_id: userId, role: 'member' });
  if (error) throw new Error(error.message);
}

export async function removeLedgerMember(ledgerId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('ledger_members')
    .delete()
    .eq('ledger_id', ledgerId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Category Groups & Categories
// ============================================================================

export async function fetchCategoryGroups(ledgerId: string): Promise<CategoryGroup[]> {
  const { data, error } = await supabase
    .from('category_groups')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return assertOk(data, error) as CategoryGroup[];
}

export async function fetchCategories(ledgerId: string): Promise<CategoryWithGroup[]> {
  const [groups, catsRes] = await Promise.all([
    fetchCategoryGroups(ledgerId),
    supabase
      .from('categories')
      .select('*')
      .eq('ledger_id', ledgerId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
  ]);

  const cats = assertOk(catsRes.data, catsRes.error) as Category[];
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  return cats
    .map((c) => {
      const group = groupMap.get(c.group_id);
      if (!group) return null;
      return { ...c, group };
    })
    .filter((x): x is CategoryWithGroup => x !== null)
    .sort((a, b) => a.group.sort_order - b.group.sort_order || a.sort_order - b.sort_order);
}

export async function createCategoryGroup(input: {
  ledger_id: string;
  name: string;
  kind: EntryKind;
  color: GroupColorCode;
  sort_order: number;
}): Promise<CategoryGroup> {
  const { data, error } = await supabase
    .from('category_groups')
    .insert({ ...input, name: input.name.trim() })
    .select('*')
    .single();
  return assertOk(data, error) as CategoryGroup;
}

export async function updateCategoryGroup(
  id: string,
  patch: Partial<Pick<CategoryGroup, 'name' | 'color' | 'sort_order' | 'archived_at'>>,
): Promise<void> {
  const { error } = await supabase.from('category_groups').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function createCategory(input: {
  ledger_id: string;
  group_id: string;
  name: string;
  sort_order: number;
}): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ ...input, name: input.name.trim() })
    .select('*')
    .single();
  return assertOk(data, error) as Category;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, 'name' | 'sort_order' | 'archived_at'>>,
): Promise<void> {
  const { error } = await supabase.from('categories').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Transactions
// ============================================================================

export async function fetchTransactionsRange(
  ledgerId: string,
  startDate: string,
  endDate: string,
): Promise<TransactionWithDetails[]> {
  const [txRes, cats, profiles] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('ledger_id', ledgerId)
      .gte('occurred_on', startDate)
      .lte('occurred_on', endDate)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    fetchCategories(ledgerId),
    fetchProfiles(),
  ]);

  const txs = assertOk(txRes.data, txRes.error) as TransactionRow[];
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const profileMap = new Map(
    profiles.map((p) => [p.user_id, p.display_name || p.email.split('@')[0]]),
  );

  return txs.map((tx) => {
    const cat = catMap.get(tx.category_id);
    return {
      ...tx,
      category_name: cat?.name ?? '未分類',
      group_id: cat?.group.id ?? '',
      group_name: cat?.group.name ?? '其他',
      group_color: cat?.group.color ?? 'g8',
      kind: cat?.group.kind ?? 'expense',
      creator_name: profileMap.get(tx.created_by) ?? null,
    };
  });
}

export async function fetchAllLedgerTransactions(
  ledgerId: string,
): Promise<TransactionWithDetails[]> {
  const [txRes, cats, profiles] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('ledger_id', ledgerId)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false }),
    fetchCategories(ledgerId),
    fetchProfiles(),
  ]);

  const txs = assertOk(txRes.data, txRes.error) as TransactionRow[];
  const catMap = new Map(cats.map((c) => [c.id, c]));
  const profileMap = new Map(
    profiles.map((p) => [p.user_id, p.display_name || p.email.split('@')[0]]),
  );

  return txs.map((tx) => {
    const cat = catMap.get(tx.category_id);
    return {
      ...tx,
      category_name: cat?.name ?? '未分類',
      group_id: cat?.group.id ?? '',
      group_name: cat?.group.name ?? '其他',
      group_color: cat?.group.color ?? 'g8',
      kind: cat?.group.kind ?? 'expense',
      creator_name: profileMap.get(tx.created_by) ?? null,
    };
  });
}

export async function createTransaction(input: {
  ledger_id: string;
  category_id: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  created_by: string;
}): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...input,
      note: input.note?.trim() ? input.note.trim() : null,
    })
    .select('*')
    .single();
  return assertOk(data, error) as TransactionRow;
}

export async function updateTransaction(
  id: string,
  patch: {
    ledger_id?: string;
    category_id: string;
    amount: number;
    occurred_on: string;
    note: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .update({
      ...patch,
      note: patch.note?.trim() ? patch.note.trim() : null,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Budgets
// ============================================================================

export async function fetchEffectiveBudgets(
  ledgerId: string,
  monthStart: string,
): Promise<BudgetRow[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('ledger_id', ledgerId)
    .lte('effective_from', monthStart)
    .order('effective_from', { ascending: false });
  const rows = assertOk(data, error) as BudgetRow[];

  // Keep only the latest effective row per (group_id, category_id) scope
  const latest = new Map<string, BudgetRow>();
  for (const row of rows) {
    const key = `${row.group_id ?? 'TOTAL'}:${row.category_id ?? 'NONE'}`;
    if (!latest.has(key)) {
      latest.set(key, row);
    }
  }
  return Array.from(latest.values());
}

export async function upsertBudget(input: {
  ledger_id: string;
  group_id: string | null;
  category_id: string | null;
  amount: number;
  effective_from: string;
}): Promise<void> {
  // Delete existing entry for exact same scope + effective_from, then insert
  let delQuery = supabase
    .from('budgets')
    .delete()
    .eq('ledger_id', input.ledger_id)
    .eq('effective_from', input.effective_from);

  delQuery = input.group_id
    ? delQuery.eq('group_id', input.group_id)
    : delQuery.is('group_id', null);
  delQuery = input.category_id
    ? delQuery.eq('category_id', input.category_id)
    : delQuery.is('category_id', null);

  const { error: delErr } = await delQuery;
  if (delErr) throw new Error(delErr.message);

  const { error: insErr } = await supabase.from('budgets').insert(input);
  if (insErr) throw new Error(insErr.message);
}

export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Whitelist Admin
// ============================================================================

export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) return false;
  return Boolean(data);
}

export async function fetchAllowedEmails(): Promise<AllowedEmail[]> {
  const { data, error } = await supabase
    .from('allowed_emails')
    .select('*')
    .order('created_at', { ascending: true });
  return assertOk(data, error) as AllowedEmail[];
}

export async function addAllowedEmail(email: string, addedBy: string): Promise<void> {
  const { error } = await supabase.from('allowed_emails').insert({
    email: email.trim().toLowerCase(),
    is_admin: false,
    added_by: addedBy,
  });
  if (error) throw new Error(error.message);
}

export async function removeAllowedEmail(email: string): Promise<void> {
  const { error } = await supabase
    .from('allowed_emails')
    .delete()
    .eq('email', email.toLowerCase());
  if (error) throw new Error(error.message);
}

// ============================================================================
// Charts RPC (M4)
// ============================================================================

export async function fetchPeriodSummary(
  ledgerId: string,
  startDate: string,
  endDate: string,
): Promise<PeriodSummaryItem[]> {
  const { data, error } = await supabase.rpc('get_period_summary', {
    p_ledger_id: ledgerId,
    p_start: startDate,
    p_end: endDate,
  });
  return assertOk(data, error) as PeriodSummaryItem[];
}

export async function fetchPeriodSeries(
  ledgerId: string,
  startDate: string,
  endDate: string,
  bucket: 'day' | 'month',
): Promise<PeriodSeriesPoint[]> {
  const { data, error } = await supabase.rpc('get_period_series', {
    p_ledger_id: ledgerId,
    p_start: startDate,
    p_end: endDate,
    p_bucket: bucket,
  });
  return assertOk(data, error) as PeriodSeriesPoint[];
}

// ============================================================================
// Recurring Rules (M5)
// ============================================================================

export async function fetchRecurringRules(ledgerId: string): Promise<RecurringRule[]> {
  const { data, error } = await supabase
    .from('recurring_rules')
    .select('*')
    .eq('ledger_id', ledgerId)
    .order('created_at', { ascending: false });
  return assertOk(data, error) as RecurringRule[];
}

export async function createRecurringRule(input: {
  ledger_id: string;
  category_id: string;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  start_on: string;
  end_on: string | null;
  next_run_on: string;
  created_by: string;
}): Promise<RecurringRule> {
  const { data, error } = await supabase
    .from('recurring_rules')
    .insert({
      ...input,
      note: input.note?.trim() ? input.note.trim() : null,
      active: true,
    })
    .select('*')
    .single();
  return assertOk(data, error) as RecurringRule;
}

export async function updateRecurringRule(
  id: string,
  patch: Partial<
    Pick<
      RecurringRule,
      'category_id' | 'amount' | 'note' | 'frequency' | 'start_on' | 'end_on' | 'next_run_on' | 'active'
    >
  >,
): Promise<void> {
  const { error } = await supabase.from('recurring_rules').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteRecurringRule(id: string): Promise<void> {
  const { error } = await supabase.from('recurring_rules').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function runLedgerRecurringRules(ledgerId: string): Promise<number> {
  const { data, error } = await supabase.rpc('run_ledger_recurring_rules', {
    p_ledger_id: ledgerId,
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}
