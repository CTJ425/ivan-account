# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One family, at most five people, all adults who are comfortable with smartphones. Each person records their own spending and income; the family also records shared household money together. The owner of the project is both a user and the administrator.

Typical situation: standing at a counter or just after paying, phone in one hand, wanting to record one amount in a few seconds. Later, on a phone or a desktop browser, they look back at where the money went and whether a budget is holding.

## Product Purpose

A bookkeeping web app (UI title: 「個人記帳」) for recording income and expenses and seeing where money goes. Success means: recording a transaction takes about three actions (amount, category, save), and a month's spending by category and against budget can be read at a glance.

## Positioning

Private to one family rather than a public service: access is limited to a whitelist of Google accounts, every person has a personal ledger nobody else can see (including the administrator), and shared ledgers let chosen members record and edit together.

## Operating Context

- Mobile browser is the primary device (iOS Safari, Android Chrome, installable as a PWA). Phone width 360–430 px, portrait.
- Desktop browser is a first-class second device with its own layout, used for both quick entry and overview (confirmed: both matter equally on desktop). It is not a stretched phone layout.
- Online only in v1; no offline entry.
- Currency is New Taiwan dollars, whole numbers only.
- Interface language is Traditional Chinese (zh-TW).

## Capabilities and Constraints

Confirmed for v1 (see `docs/SPEC.md` for detail):

- Google sign-in restricted to whitelisted emails (max 5).
- Ledgers: one personal ledger per person; shared ledgers with owner and members. Everything (categories, budgets, charts, transactions) is scoped to the current ledger.
- Income and expense transactions with amount, category, date, optional note; edit and delete.
- Two-level, fully user-defined categories (group → category), per ledger; archive instead of delete.
- Monthly budgets on the whole ledger, a group, or a category.
- Recurring items that generate transactions automatically.
- Charts: pie and line, by week / month / year, drawn as SVG.
- CSV export.

Out of v1: payment methods / money accounts, multiple currencies, receipt photos, offline entry, automatic backups.

Technical constraints: React + TypeScript + Vite, plain CSS (no UI library), Supabase (Postgres, Auth, RLS), Cloudflare Pages. Initial JS under 200 KB gzip.

Terminology: 帳本 (ledger), 個人帳本 / 共用帳本, 群組 (category group), 分類 (category), 交易 (transaction), 預算 (budget), 週期性項目 (recurring item), 白名單 (whitelist).

## Brand Commitments

- Name shown in the UI: 「個人記帳」 (confirmed; keep it).
- No logo or brand assets exist.
- Binding style constraints from the owner: no cream/off-white backgrounds, no italic accent words in headlines, no numbered "01/02/03" section labels, no monospace labels, no pill-shaped buttons.

## Evidence on Hand

No real transaction data, screenshots, or user research exist yet. Placeholder category names in the code are examples, not user data. Do not fabricate statistics or sample households presented as real.

## Product Principles

1. Recording comes first: the fastest path on every device is "enter one transaction".
2. Phone decides: when phone and desktop needs conflict, the phone experience wins; desktop gets its own layout rather than a copy.
3. The current ledger is always obvious: nobody should record a personal expense into the family ledger by accident.
4. Numbers must be trustworthy: totals in charts, lists, and budgets always agree with each other.
5. Private by default: personal ledgers stay personal.

## Accessibility & Inclusion

Adults comfortable with phones; no special requirement beyond good practice: readable text sizes, sufficient contrast, zoom not locked, visible focus, touch targets sized for one-handed use.
