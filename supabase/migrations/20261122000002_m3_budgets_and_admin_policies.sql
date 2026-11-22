-- Migration: 20261122000002_m3_budgets_and_admin_policies.sql
-- Milestone M3: Budgets table, admin whitelist insert/delete policies, and shared ledger owner management policies.
-- Safe to re-run (idempotent).

-- 1. Budgets table
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  group_id uuid null references public.category_groups(id) on delete cascade,
  category_id uuid null references public.categories(id) on delete cascade,
  amount integer not null check (amount > 0),
  effective_from date not null check (extract(day from effective_from) = 1),
  created_at timestamptz not null default now(),
  check (not (group_id is not null and category_id is not null))
);

create unique index if not exists idx_budgets_scope_unique
  on public.budgets (
    ledger_id,
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid),
    effective_from
  );

-- 2. RLS on budgets
alter table public.budgets enable row level security;

drop policy if exists "Members can select budgets" on public.budgets;
create policy "Members can select budgets"
  on public.budgets for select to authenticated
  using (public.is_ledger_member(ledger_id));

drop policy if exists "Members can insert budgets" on public.budgets;
create policy "Members can insert budgets"
  on public.budgets for insert to authenticated
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can update budgets" on public.budgets;
create policy "Members can update budgets"
  on public.budgets for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can delete budgets" on public.budgets;
create policy "Members can delete budgets"
  on public.budgets for delete to authenticated
  using (public.is_ledger_member(ledger_id));

revoke all on table public.budgets from public, anon, authenticated;
grant select, insert, update, delete on table public.budgets to authenticated;

-- 3. Admin whitelist management policies (allowed_emails)
drop policy if exists "Admins can insert allowed emails" on public.allowed_emails;
create policy "Admins can insert allowed emails"
  on public.allowed_emails for insert to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can delete non-self allowed emails" on public.allowed_emails;
create policy "Admins can delete non-self allowed emails"
  on public.allowed_emails for delete to authenticated
  using (
    public.is_admin()
    and email <> lower(coalesce(
      auth.jwt()->>'email',
      (select email from auth.users where id = (select auth.uid())),
      ''
    ))
  );

grant insert, delete on table public.allowed_emails to authenticated;

-- 4. Shared ledger owner management policies (ledgers & ledger_members)
drop policy if exists "Owners can rename shared ledgers" on public.ledgers;
create policy "Owners can rename shared ledgers"
  on public.ledgers for update to authenticated
  using (kind = 'shared' and public.is_ledger_owner(id))
  with check (kind = 'shared' and public.is_ledger_owner(id));

drop policy if exists "Owners can delete shared ledgers" on public.ledgers;
create policy "Owners can delete shared ledgers"
  on public.ledgers for delete to authenticated
  using (kind = 'shared' and public.is_ledger_owner(id));

grant update (name), delete on table public.ledgers to authenticated;

drop policy if exists "Shared ledger owners can insert members" on public.ledger_members;
create policy "Shared ledger owners can insert members"
  on public.ledger_members for insert to authenticated
  with check (
    public.is_ledger_owner(ledger_id)
    and exists (
      select 1 from public.ledgers l
      where l.id = ledger_id and l.kind = 'shared'
    )
  );

drop policy if exists "Shared ledger owners can delete non-owner members" on public.ledger_members;
create policy "Shared ledger owners can delete non-owner members"
  on public.ledger_members for delete to authenticated
  using (
    public.is_ledger_owner(ledger_id)
    and user_id <> (select auth.uid())
    and exists (
      select 1 from public.ledgers l
      where l.id = ledger_id and l.kind = 'shared'
    )
  );

grant insert, delete on table public.ledger_members to authenticated;
