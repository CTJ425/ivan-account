-- Migration: 20261110000001_auth_whitelist.sql
-- Milestone M1: Allowed emails whitelist and user profiles
-- Safe to re-run in Supabase SQL Editor.

-- 1. Table: public.allowed_emails
create table if not exists public.allowed_emails (
  email text primary key check (email = lower(email)),
  is_admin boolean not null default false,
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.allowed_emails is 'Whitelist of Google account emails authorized to sign in (max 5). Single source of truth for admin status.';

-- 1a. Trigger to enforce maximum 5 allowed emails with table lock
create or replace function public.check_allowed_emails_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Prevent concurrent-insert race
  lock table public.allowed_emails in share row exclusive mode;

  if not exists (
    select 1
    from public.allowed_emails
    where email = new.email
  ) and (select count(*) from public.allowed_emails) >= 5 then
    raise exception 'Cannot add more than 5 allowed emails';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_check_allowed_emails_limit on public.allowed_emails;
create trigger tr_check_allowed_emails_limit
  before insert on public.allowed_emails
  for each row
  execute function public.check_allowed_emails_limit();

-- 2. Table: public.profiles
-- Note: is_admin is omitted; public.allowed_emails is the single source of truth.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Public user profiles created automatically on sign up.';

-- 3. Security definer helper: public.is_allowed_user()
-- Checks if the caller is whitelisted in public.allowed_emails.
create or replace function public.is_allowed_user()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_emails
    where email = lower(coalesce(
      auth.jwt()->>'email',
      (select email from auth.users where id = auth.uid()),
      ''
    ))
  );
$$;

-- 4. Security definer helper: public.is_admin()
-- Checks if the caller is an administrator in public.allowed_emails.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.allowed_emails
    where email = lower(coalesce(
      auth.jwt()->>'email',
      (select email from auth.users where id = auth.uid()),
      ''
    ))
    and is_admin = true
  );
$$;

-- 5. BEFORE INSERT trigger on auth.users to enforce whitelist
create or replace function public.check_user_allowed_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null or not exists (
    select 1
    from public.allowed_emails
    where email = lower(new.email)
  ) then
    raise exception 'User email % is not in the allowed emails whitelist', new.email;
  end if;
  return new;
end;
$$;

drop trigger if exists tr_check_user_allowed_on_signup on auth.users;
create trigger tr_check_user_allowed_on_signup
  before insert on auth.users
  for each row
  execute function public.check_user_allowed_on_signup();

-- 6. AFTER INSERT trigger on auth.users to create profile
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
  );
  return new;
end;
$$;

drop trigger if exists tr_handle_user_created_profile on auth.users;
create trigger tr_handle_user_created_profile
  after insert on auth.users
  for each row
  execute function public.handle_user_created_profile();

-- 7. AFTER DELETE trigger on public.allowed_emails to terminate removed users' sessions
create or replace function public.handle_allowed_email_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id
  from auth.users
  where email = old.email;

  if v_user_id is not null then
    delete from auth.refresh_tokens
    where session_id::text in (
      select id::text from auth.sessions where user_id = v_user_id
    );

    delete from auth.sessions
    where user_id = v_user_id;
  end if;

  return old;
end;
$$;

drop trigger if exists tr_handle_allowed_email_deleted on public.allowed_emails;
create trigger tr_handle_allowed_email_deleted
  after delete on public.allowed_emails
  for each row
  execute function public.handle_allowed_email_deleted();

-- 8. Row Level Security (RLS)
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;

-- Profiles: whitelisted family members can view all profiles
drop policy if exists "Whitelisted users can select profiles" on public.profiles;
drop policy if exists "Users can select own profile" on public.profiles;
create policy "Whitelisted users can select profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_allowed_user());

-- Profiles: users can only update their own display_name
drop policy if exists "Users can update own profile display_name" on public.profiles;
drop policy if exists "Users can update own display_name" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile display_name"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id and public.is_allowed_user())
  with check ((select auth.uid()) = user_id and public.is_allowed_user());

-- Allowed emails: select is admin-only
drop policy if exists "Admins can select allowed emails" on public.allowed_emails;
create policy "Admins can select allowed emails"
  on public.allowed_emails
  for select
  to authenticated
  using (public.is_admin());

-- 9. Permissions Hardening
-- Revoke all table permissions from public, anon, and authenticated
revoke all on table public.allowed_emails from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;

-- Grant only what is needed to authenticated
grant select on table public.allowed_emails to authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

-- Revoke execute on helper functions from public and anon, grant to authenticated
revoke all on function public.is_allowed_user() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_allowed_user() to authenticated;
grant execute on function public.is_admin() to authenticated;
