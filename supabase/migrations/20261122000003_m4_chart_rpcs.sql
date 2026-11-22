-- Migration: 20261122000003_m4_chart_rpcs.sql
-- Milestone M4: Postgres RPC aggregation functions for Charts (pie & line, week/month/year).
-- Safe to re-run (idempotent).

create or replace function public.get_period_summary(
  p_ledger_id uuid,
  p_start date,
  p_end date
)
returns table (
  group_id uuid,
  group_name text,
  group_color text,
  kind text,
  category_id uuid,
  category_name text,
  total_amount bigint,
  tx_count bigint
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_ledger_member(p_ledger_id) then
    raise exception 'Not a member of ledger %', p_ledger_id;
  end if;

  return query
  select
    cg.id as group_id,
    cg.name as group_name,
    cg.color as group_color,
    cg.kind as kind,
    c.id as category_id,
    c.name as category_name,
    coalesce(sum(t.amount), 0)::bigint as total_amount,
    count(t.id)::bigint as tx_count
  from public.transactions t
  join public.categories c on c.id = t.category_id
  join public.category_groups cg on cg.id = c.group_id
  where t.ledger_id = p_ledger_id
    and t.occurred_on >= p_start
    and t.occurred_on <= p_end
  group by cg.id, cg.name, cg.color, cg.kind, c.id, c.name
  order by total_amount desc, cg.sort_order asc, c.sort_order asc;
end;
$$;

create or replace function public.get_period_series(
  p_ledger_id uuid,
  p_start date,
  p_end date,
  p_bucket text default 'day'
)
returns table (
  bucket_date date,
  expense_total bigint,
  income_total bigint
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not public.is_ledger_member(p_ledger_id) then
    raise exception 'Not a member of ledger %', p_ledger_id;
  end if;

  if p_bucket not in ('day', 'month') then
    raise exception 'Invalid bucket: %', p_bucket;
  end if;

  return query
  select
    case
      when p_bucket = 'month' then date_trunc('month', t.occurred_on)::date
      else t.occurred_on
    end as bucket_date,
    coalesce(sum(case when cg.kind = 'expense' then t.amount else 0 end), 0)::bigint as expense_total,
    coalesce(sum(case when cg.kind = 'income' then t.amount else 0 end), 0)::bigint as income_total
  from public.transactions t
  join public.categories c on c.id = t.category_id
  join public.category_groups cg on cg.id = c.group_id
  where t.ledger_id = p_ledger_id
    and t.occurred_on >= p_start
    and t.occurred_on <= p_end
  group by 1
  order by 1 asc;
end;
$$;

revoke all on function public.get_period_summary(uuid, date, date) from public, anon;
revoke all on function public.get_period_series(uuid, date, date, text) from public, anon;
grant execute on function public.get_period_summary(uuid, date, date) to authenticated;
grant execute on function public.get_period_series(uuid, date, date, text) to authenticated;
