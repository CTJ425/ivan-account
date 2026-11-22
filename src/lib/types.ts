export type LedgerKind = 'personal' | 'shared';
export type LedgerRole = 'owner' | 'member';
export type EntryKind = 'expense' | 'income';
export type GroupColorCode = 'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8' | 'income';
export type RecurringFrequency = 'weekly' | 'monthly' | 'yearly';

export interface Ledger {
  id: string;
  name: string;
  kind: LedgerKind;
  created_by: string;
  created_at: string;
  my_role?: LedgerRole;
}

export interface LedgerMember {
  ledger_id: string;
  user_id: string;
  role: LedgerRole;
  created_at: string;
  profile?: Profile | null;
}

export interface Profile {
  user_id: string;
  email: string;
  display_name: string | null;
  created_at?: string;
}

export interface AllowedEmail {
  email: string;
  is_admin: boolean;
  added_by: string | null;
  created_at: string;
}

export interface CategoryGroup {
  id: string;
  ledger_id: string;
  name: string;
  kind: EntryKind;
  color: GroupColorCode;
  sort_order: number;
  archived_at: string | null;
}

export interface Category {
  id: string;
  ledger_id: string;
  group_id: string;
  name: string;
  sort_order: number;
  archived_at: string | null;
}

export interface CategoryWithGroup extends Category {
  group: CategoryGroup;
}

export interface TransactionRow {
  id: string;
  ledger_id: string;
  category_id: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  created_by: string;
  recurring_rule_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithDetails extends TransactionRow {
  category_name: string;
  group_id: string;
  group_name: string;
  group_color: GroupColorCode;
  kind: EntryKind;
  creator_name: string | null;
}

export interface BudgetRow {
  id: string;
  ledger_id: string;
  group_id: string | null;
  category_id: string | null;
  amount: number;
  effective_from: string;
  created_at: string;
}

export interface PeriodSummaryItem {
  group_id: string;
  group_name: string;
  group_color: GroupColorCode;
  kind: EntryKind;
  category_id: string;
  category_name: string;
  total_amount: number;
  tx_count: number;
}

export interface PeriodSeriesPoint {
  bucket_date: string;
  expense_total: number;
  income_total: number;
}

export interface RecurringRule {
  id: string;
  ledger_id: string;
  category_id: string;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  start_on: string;
  end_on: string | null;
  next_run_on: string;
  active: boolean;
  created_by: string;
  created_at: string;
}
