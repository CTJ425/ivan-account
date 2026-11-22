-- Migration: 20261122000004_m5_recurring_rules.sql
-- Milestone M5: Recurring rules table, transaction FK/dedupe index, due-rule processor, and pg_cron schedule.
-- Safe to re-run (idempotent).

-- 1. Table: public.recurring_rules
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  amount integer not null check (amount > 0),
  note text null check (note is null or char_length(note) <= 200),
  frequency text not null check (frequency in ('weekly', 'monthly', 'yearly')),
  start_on date not null,
  end_on date null check (end_on is null or end_on >= start_on),
  next_run_on date not null,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_recurring_rules_due
  on public.recurring_rules (active, next_run_on)
  where active = true;

-- Ensure category belongs to the same ledger
drop trigger if exists tr_check_recurring_category_ledger on public.recurring_rules;
create trigger tr_check_recurring_category_ledger
  before insert or update on public.recurring_rules
  for each row
  execute function public.check_transaction_category_ledger();

-- 2. Link transactions.recurring_rule_id and prevent duplicate generation per rule + date
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'fk_transactions_recurring_rule'
  ) then
    alter table public.transactions
      add constraint fk_transactions_recurring_rule
      foreign key (recurring_rule_id)
      references public.recurring_rules(id)
      on delete set null;
  end if;
end $$;

create unique index if not exists idx_transactions_recurring_unique
  on public.transactions (recurring_rule_id, occurred_on)
  where recurring_rule_id is not null;

-- 3. RLS on recurring_rules
alter table public.recurring_rules enable row level security;

drop policy if exists "Members can select recurring_rules" on public.recurring_rules;
create policy "Members can select recurring_rules"
  on public.recurring_rules for select to authenticated
  using (public.is_ledger_member(ledger_id));

drop policy if exists "Members can insert recurring_rules" on public.recurring_rules;
create policy "Members can insert recurring_rules"
  on public.recurring_rules for insert to authenticated
  with check (
    public.is_ledger_member(ledger_id)
    and created_by = (select auth.uid())
  );

drop policy if exists "Members can update recurring_rules" on public.recurring_rules;
create policy "Members can update recurring_rules"
  on public.recurring_rules for update to authenticated
  using (public.is_ledger_member(ledger_id))
  with check (public.is_ledger_member(ledger_id));

drop policy if exists "Members can delete recurring_rules" on public.recurring_rules;
create policy "Members can delete recurring_rules"
  on public.recurring_rules for delete to authenticated
  using (public.is_ledger_member(ledger_id));

revoke all on table public.recurring_rules from public, anon, authenticated;
grant select, insert, update, delete on table public.recurring_rules to authenticated;

-- 4. Helper: compute next occurrence anchored to start_on (handles month-end 29/30/31 & leap years)
create or replace function public.advance_recurring_date(
  p_current date,
  p_start date,
  p_frequency text
)
returns date
language plpgsql
immutable
as $$
declare
  v_anchor_day int;
  v_target_month date;
  v_last_day int;
  v_target_year int;
begin
  if p_frequency = 'weekly' then
    return p_current + interval '7 days';
  elsif p_frequency = 'monthly' then
    v_anchor_day := extract(day from p_start)::int;
    v_target_month := (date_trunc('month', p_current) + interval '1 month')::date;
    v_last_day := extract(day from (v_target_month + interval '1 month - 1 day'))::int;
    return v_target_month + (least(v_anchor_day, v_last_day) - 1);
  elsif p_frequency = 'yearly' then
    v_anchor_day := extract(day from p_start)::int;
    v_target_year := extract(year from p_current)::int + 1;
    v_target_month := make_date(v_target_year, extract(month from p_start)::int, 1);
    v_last_day := extract(day from (v_target_month + interval '1 month - 1 day'))::int;
    return v_target_month + (least(v_anchor_day, v_last_day) - 1);
  end if;
  raise exception 'Unsupported frequency: %', p_frequency;
end;
$$;

-- 5. Processor function (catches up missed runs idempotently)
create or replace function public.process_due_recurring_rules(
  p_as_of date default (now() at time zone 'Asia/Taipei')::date,
  p_ledger_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_run_date date;
  v_inserted integer := 0;
  v_steps integer;
begin
  for r in
    select *
    from public.recurring_rules
    where active = true
      and next_run_on <= p_as_of
      and (p_ledger_id is null or ledger_id = p_ledger_id)
    for update
  loop
    v_run_date := r.next_run_on;
    v_steps := 0;

    while v_run_date <= p_as_of and (r.end_on is null or v_run_date <= r.end_on) and v_steps < 120 loop
      insert into public.transactions (
        ledger_id,
        category_id,
        amount,
        occurred_on,
        note,
        created_by,
        recurring_rule_id
      )
      values (
        r.ledger_id,
        r.category_id,
        r.amount,
        v_run_date,
        r.note,
        r.created_by,
        r.id
      )
      on conflict (recurring_rule_id, occurred_on) where recurring_rule_id is not null do nothing;

      if found then
        v_inserted := v_inserted + 1;
      end if;

      v_run_date := public.advance_recurring_date(v_run_date, r.start_on, r.frequency);
      v_steps := v_steps + 1;
    end loop;

    update public.recurring_rules
    set next_run_on = v_run_date,
        active = case when end_on is not null and v_run_date > end_on then false else active end
    where id = r.id;
  end loop;

  return v_inserted;
end;
$$;

-- Member-callable RPC to process due rules for a specific ledger
create or replace function public.run_ledger_recurring_rules(p_ledger_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_ledger_member(p_ledger_id) then
    raise exception 'Not a member of ledger %', p_ledger_id;
  end if;

  return public.process_due_recurring_rules(
    (now() at time zone 'Asia/Taipei')::date,
    p_ledger_id
  );
end;
$$;

revoke all on function public.advance_recurring_date(date, date, text) from public, anon, authenticated;
revoke all on function public.process_due_recurring_rules(date, uuid) from public, anon, authenticated;
revoke all on function public.run_ledger_recurring_rules(uuid) from public, anon;
grant execute on function public.run_ledger_recurring_rules(uuid) to authenticated;

-- 6. Schedule daily pg_cron job at 16:05 UTC (00:05 Asia/Taipei) if pg_cron is available
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid)
    from cron.job
    where jobname = 'process_due_recurring_rules_daily';

    perform cron.schedule(
      'process_due_recurring_rules_daily',
      '5 16 * * *',
      $cron$select public.process_due_recurring_rules();$cron$
    );
  end if;
exception when others then
  null;
end $$;
