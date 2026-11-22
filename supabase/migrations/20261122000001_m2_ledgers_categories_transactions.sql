-- Migration: 20261122000001_m2_ledgers_categories_transactions.sql
-- Milestone M2: Ledgers, Ledger Members, Category Groups, Categories, Transactions, and RLS.
-- Safe to re-run (idempotent).

-- 1. Tables
create table if not exists public.ledgers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  kind text not null check (kind in ('personal', 'shared')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.ledger_members (
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (ledger_id, user_id)
);

-- At most one personal ledger per user
create unique index if not exists idx_ledgers_one_personal_per_user
  on public.ledgers (created_by)
  where kind = 'personal';

create table if not exists public.category_groups (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 30),
  kind text not null check (kind in ('expense', 'income')),
  color text not null check (color in ('g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'income')),
  sort_order integer not null default 0,
  archived_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_category_groups_ledger
  on public.category_groups (ledger_id, kind, sort_order);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  group_id uuid not null references public.category_groups(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 30),
  sort_order integer not null default 0,
  archived_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_ledger_group
  on public.categories (ledger_id, group_id, sort_order);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount integer not null check (amount > 0),
  occurred_on date not null,
  note text null check (note is null or char_length(note) <= 200),
  created_by uuid not null references auth.users(id) on delete cascade,
  recurring_rule_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_ledger_date
  on public.transactions (ledger_id, occurred_on desc, created_at desc);

-- Ensure updated_at stays current
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_transactions_updated_at on public.transactions;
create trigger tr_transactions_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

-- Ensure transaction category belongs to the same ledger
create or replace function public.check_transaction_category_ledger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cat_ledger uuid;
begin
  select ledger_id into v_cat_ledger
  from public.categories
  where id = new.category_id;

  if v_cat_ledger is null or v_cat_ledger <> new.ledger_id then
    raise exception 'Category % does not belong to ledger %', new.category_id, new.ledger_id;
  end if;

  return new;
end;
$$;

drop trigger if exists tr_check_transaction_category_ledger on public.transactions;
create trigger tr_check_transaction_category_ledger
  before insert or update on public.transactions
  for each row
  execute function public.check_transaction_category_ledger();

-- 2. Security-definer membership helpers
create or replace function public.is_ledger_member(p_ledger_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select public.is_allowed_user()
  and exists (
    select 1
    from public.ledger_members
    where ledger_id = p_ledger_id
      and user_id = (select auth.uid())
  );
$$;

create or replace function public.is_ledger_owner(p_ledger_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select public.is_allowed_user()
  and exists (
    select 1
    from public.ledger_members
    where ledger_id = p_ledger_id
      and user_id = (select auth.uid())
      and role = 'owner'
  );
$$;

-- 3. Starter category seeding (per SPEC 3: 餐食[早/午/晚], 交通, 居住, 娛樂, 其他; 收入: 薪資, 其他)
create or replace function public.seed_default_categories(p_ledger_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_food_id uuid;
  v_transport_id uuid;
  v_housing_id uuid;
  v_fun_id uuid;
  v_other_exp_id uuid;
  v_salary_id uuid;
  v_other_inc_id uuid;
begin
  if exists (select 1 from public.category_groups where ledger_id = p_ledger_id) then
    return;
  end if;

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '餐食', 'expense', 'g2', 10)
  returning id into v_food_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_food_id, '早餐', 10),
    (p_ledger_id, v_food_id, '午餐', 20),
    (p_ledger_id, v_food_id, '晚餐', 30);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '交通', 'expense', 'g1', 20)
  returning id into v_transport_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_transport_id, '交通', 10);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '居住', 'expense', 'g3', 30)
  returning id into v_housing_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_housing_id, '居住', 10);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '娛樂', 'expense', 'g4', 40)
  returning id into v_fun_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_fun_id, '娛樂', 10);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '其他', 'expense', 'g8', 50)
  returning id into v_other_exp_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_other_exp_id, '其他', 10);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '薪資', 'income', 'income', 10)
  returning id into v_salary_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_salary_id, '薪資', 10);

  insert into public.category_groups (ledger_id, name, kind, color, sort_order)
  values (p_ledger_id, '其他收入', 'income', 'income', 20)
  returning id into v_other_inc_id;
  insert into public.categories (ledger_id, group_id, name, sort_order) values
    (p_ledger_id, v_other_inc_id, '其他', 10);
end;
$$;

-- Helper for creating a personal ledger for a specific user_id
create or replace function public.ensure_personal_ledger_for_user(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ledger_id uuid;
begin
  if p_user_id is null then
    raise exception 'User ID is required';
  end if;

  select id into v_ledger_id
  from public.ledgers
  where created_by = p_user_id and kind = 'personal'
  limit 1;

  if v_ledger_id is null then
    insert into public.ledgers (name, kind, created_by)
    values ('個人帳本', 'personal', p_user_id)
    on conflict (created_by) where kind = 'personal' do nothing
    returning id into v_ledger_id;

    if v_ledger_id is null then
      select id into v_ledger_id
      from public.ledgers
      where created_by = p_user_id and kind = 'personal'
      limit 1;
    end if;
  end if;

  insert into public.ledger_members (ledger_id, user_id, role)
  values (v_ledger_id, p_user_id, 'owner')
  on conflict (ledger_id, user_id) do nothing;

  perform public.seed_default_categories(v_ledger_id);

  return v_ledger_id;
end;
$$;

-- RPC callable by authenticated client to guarantee personal ledger exists
create or replace function public.ensure_personal_ledger()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null or not public.is_allowed_user() then
    raise exception 'Not authorized';
  end if;
  return public.ensure_personal_ledger_for_user(v_uid);
end;
$$;

-- RPC callable by authenticated client to create a shared ledger atomically
create or replace function public.create_shared_ledger(p_name text)
returns public.ledgers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_trimmed text;
  v_ledger public.ledgers;
begin
  v_uid := (select auth.uid());
  if v_uid is null or not public.is_allowed_user() then
    raise exception 'Not authorized';
  end if;

  v_trimmed := trim(coalesce(p_name, ''));
  if char_length(v_trimmed) < 1 or char_length(v_trimmed) > 40 then
    raise exception 'Ledger name must be between 1 and 40 characters';
  end if;

  insert into public.ledgers (name, kind, created_by)
  values (v_trimmed, 'shared', v_uid)
  returning * into v_ledger;

  insert into public.ledger_members (ledger_id, user_id, role)
  values (v_ledger.id, v_uid, 'owner');

  perform public.seed_default_categories(v_ledger.id);

  return v_ledger;
end;
$$;

-- Update handle_user_created_profile so future signups automatically receive a personal ledger
create or replace function public.handle_user_created_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, email, display_name, created_at)
  values (
    new.id,
    lower(new.email),
    new.raw_user_meta_data->>'full_name',
    now()
  )
  on conflict (user_id) do nothing;

  perform public.ensure_personal_ledger_for_user(new.id);
  return new;
end;
$$;

-- Backfill personal ledgers for any existing profiles
do $$
declare
  r record;
begin
  for r in select user_id from public.profiles loop
    perform public.ensure_personal_ledger_for_user(r.user_id);
  end loop;
end $$;

-- 4. Row Level Security (RLS)
alter table public.ledgers enable row level security;
alter table public.ledger_members enable row level security;
alter table public.category_groups enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

-- Ledgers: members can select
drop policy if exists "Members can select ledgers" on public.ledgers;
create policy "Members can select ledgers"
  on public.ledgers for select to authenticated
  using (public.is_ledger_member(id));

-- Ledger Members: members can select co-members
drop policy if exists "Members can select ledger_members" on public.ledger_members;
create policy "Members can select ledger_members"
  on public.ledger_members for select to authenticated
  using (public.is_ledger_member(ledger_id));

-- Category Groups: members can select/insert/update/delete
drop policy if exists "Members can select category_groups" on public.category_groups;
create policy "Members can select category_groups"
  on public.category_groups for select to authenticated
  using (public.is_ledger_member(ledger_id));

drop policy if exists "Members can insert category_groups" on public.category_groups;
create policy "Members can insert category_groups"
  on public.category_groups for insert to authenticated
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can update category_groups" on public.category_groups;
create policy "Members can update category_groups"
  on public.category_groups for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can delete category_groups" on public.category_groups;
create policy "Members can delete category_groups"
  on public.category_groups for delete to authenticated
  using (public.is_ledger_member(ledger_id));

-- Categories: members can select/insert/update/delete
drop policy if exists "Members can select categories" on public.categories;
create policy "Members can select categories"
  on public.categories for select to authenticated
  using (public.is_ledger_member(ledger_id));

drop policy if exists "Members can insert categories" on public.categories;
create policy "Members can insert categories"
  on public.categories for insert to authenticated
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can update categories" on public.categories;
create policy "Members can update categories"
  on public.categories for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can delete categories" on public.categories;
create policy "Members can delete categories"
  on public.categories for delete to authenticated
  using (public.is_ledger_member(ledger_id));

-- Transactions: members can select/insert/update/delete
drop policy if exists "Members can select transactions" on public.transactions;
create policy "Members can select transactions"
  on public.transactions for select to authenticated
  using (public.is_ledger_member(ledger_id));

drop policy if exists "Members can insert transactions" on public.transactions;
create policy "Members can insert transactions"
  on public.transactions for insert to authenticated
  with check (
    public.is_ledger_member(ledger_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "Members can update transactions" on public.transactions;
create policy "Members can update transactions"
  on public.transactions for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can delete transactions" on public.transactions;
create policy "Members can delete transactions"
  on public.transactions for delete to authenticated
  using (public.is_ledger_member(ledger_id));

-- 5. Permissions Hardening
revoke all on table public.ledgers from public, anon, authenticated;
revoke all on table public.ledger_members from public, anon, authenticated;
revoke all on table public.category_groups from public, anon, authenticated;
revoke all on table public.categories from public, anon, authenticated;
revoke all on table public.transactions from public, anon, authenticated;

grant select on table public.ledgers to authenticated;
grant select on table public.ledger_members to authenticated;
grant select, insert, update, delete on table public.category_groups to authenticated;
grant select, insert, update, delete on table public.categories to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

revoke all on function public.is_ledger_member(uuid) from public, anon;
revoke all on function public.is_ledger_owner(uuid) from public, anon;
revoke all on function public.seed_default_categories(uuid) from public, anon, authenticated;
revoke all on function public.ensure_personal_ledger_for_user(uuid) from public, anon, authenticated;
revoke all on function public.ensure_personal_ledger() from public, anon;
revoke all on function public.create_shared_ledger(text) from public, anon;

grant execute on function public.is_ledger_member(uuid) to authenticated;
grant execute on function public.is_ledger_owner(uuid) to authenticated;
grant execute on function public.ensure_personal_ledger() to authenticated;
grant execute on function public.create_shared_ledger(text) to authenticated;
