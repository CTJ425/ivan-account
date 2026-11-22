---
name: 個人記帳
description: A family bookkeeping app anchored by a deep blueprint-navy shell and zero-shadow 1px drafting-grid work sheets.
colors:
  ground: "#F3F6FA"
  surface: "#FFFFFF"
  surface-sub: "#F7F9FC"
  shell: "#152942"
  shell-hover: "#1D3554"
  shell-active: "#25436A"
  shell-border: "#274162"
  shell-ink: "#F4F7FB"
  shell-ink-2: "#B8C7DA"
  ink: "#121B26"
  ink-2: "#4B596A"
  ink-3: "#677688"
  rule: "#D4DEE9"
  rule-strong: "#76889B"
  accent: "#1D56B8"
  on-accent: "#FFFFFF"
  income: "#0F7B5F"
  on-income: "#FFFFFF"
  over: "#C8372D"
  ledger-personal: "#2563EB"
  ledger-shared: "#C2610C"
  g1: "#2E64B3"
  g2: "#C26B19"
  g3: "#1E7E62"
  g4: "#764EB3"
  g5: "#B84259"
  g6: "#5F7A20"
  g7: "#1E8299"
  g8: "#7D5E44"
typography:
  amount:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  page-title:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  wordmark:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  cta:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.2
  sheet-header:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.3
  row:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  note:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  meta:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
  label:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
rounded:
  sheet: "4px"
  control: "4px"
  chip: "2px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  segment-expense-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.control}"
    height: "40px"
  segment-income-active:
    backgroundColor: "{colors.income}"
    textColor: "{colors.on-income}"
    rounded: "{rounded.control}"
    height: "40px"
  sheet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  sheet-header:
    backgroundColor: "{colors.surface-sub}"
    textColor: "{colors.ink}"
    typography: "{typography.sheet-header}"
    padding: "11px 16px"
---

# Design System: 個人記帳（建築方眼藍圖 / Drafting Grid）

## Overview

**Creative North Star: "The Drafting Grid & Blueprint Shell"**

The navigation shell is a committed deep blueprint-navy frame (`#152942` light / `#0D1929` dark) that anchors the user's active ledger before they read a single number. Inside the workspace, a subtle 24px architectural grid ground (`#F3F6FA` / `#11161D`) carries flat, zero-shadow pure-white drafting sheets separated strictly by 1px structural rules (`#D4DEE9` / `#2A3544`).

Every ledger has its own unmistakable identity color—personal blue (`#2563EB` / `#60A5FA`) vs. shared household amber-orange (`#C2610C` / `#F59E0B`)—synchronized across both the ledger switcher in the shell and the top identity strip of the quick-entry sheet so family members never log a personal expense into the shared ledger by mistake.

Typography uses one CJK system sans at strictly two primary weights (`500` and `700`), with tabular right-aligned numerals locked to fixed vertical plumb lines. Dark mode follows the OS `prefers-color-scheme` setting automatically via `color-scheme: light dark`.

## Colors

### Shell (Blueprint Navy)
- **Shell Ground** (`shell`): `#152942` (light) / `#0D1929` (dark) — mobile sticky top bar and desktop 220px fixed left navigation rail.
- **Shell Hover / Active** (`shell-hover`, `shell-active`): `#1D3554` / `#25436A` (light), `#15263D` / `#1D3352` (dark).
- **Shell Text** (`shell-ink`, `shell-ink-2`): `#F4F7FB` primary, `#B8C7DA` tinted secondary (never neutral gray on colored surfaces; ≥8.5:1 contrast).

### Workspace Surfaces & Structural Rules
- **Drafting Ground** (`ground`): `#F3F6FA` (light) / `#11161D` (dark) with subtle 24px architectural gridlines (`--grid-line`).
- **Work Sheet** (`surface`): `#FFFFFF` (light) / `#181F28` (dark) — entry sheet, overview sheets, ledger popover, inputs.
- **Header Band** (`surface-sub`): `#F7F9FC` (light) / `#1E2733` (dark) — sheet header strip, hover rows, architectural empty category frame.
- **Structural Rules** (`rule`, `rule-strong`): `#D4DEE9` / `#76889B` (light), `#2A3544` / `#687A90` (dark). Interactive form borders use `rule-strong` to maintain ≥3:1 non-text contrast (WCAG 1.4.11).

### Semantic & Ledger Identity
- **Drafting Cobalt** (`accent`): `#1D56B8` (light) / `#5B94F5` (dark) — primary `記一筆` CTA, active expense segment, active mobile bottom-nav tab, links, focus ring, caret.
- **Ledger Emerald** (`income`): `#0F7B5F` (light) / `#3CC89F` (dark) — income amounts (with leading `+`) and active income segment.
- **Overrun Vermilion** (`over`): `#C8372D` (light) / `#F0645A` (dark) — budget overrun bars, `超支` labels, danger actions, errors; always paired with explicit text.
- **Ledger Identity** (`ledger-personal`, `ledger-shared`): `#2563EB` / `#60A5FA` for 個人帳本, `#C2610C` / `#F59E0B` for 家庭共用帳本.

### Ink Scale
- **Primary Ink** (`ink`): `#121B26` (light) / `#EDF2F8` (dark).
- **Secondary Ink** (`ink-2`): `#4B596A` (light) / `#9FB0C4` (dark).
- **Placeholder Ink** (`ink-3`): `#677688` (light, ≥4.6:1 on white) / `#8899AE` (dark).

## Typography

- **Family**: `"PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif`.
- **Two-Weight Discipline**: Strictly `500` (medium) for labels/rows/body/placeholders and `700` (bold) for amounts, headers, wordmark, active nav, and primary actions.
- **Tabular Plumb Line**: Every amount, total, percentage, and budget value uses `font-variant-numeric: tabular-nums` and right alignment.

## Layout & Navigation

- **Phone (<1024px)**: Sticky `56px` blueprint-navy top bar (`個人記帳` + ledger switcher); centered single-column quick-entry drafting sheet (`max-width: 560px`) with a built-in 4×4 architectural numeric keypad (`52px` coarse-pointer keys, `00`, `⌫`, `C`, `+`, `−`, `=`, `inputMode="none"` on touch devices to prevent OS keyboard pop-up), minimal today sheet below, and fixed `56px` bottom nav with a `2px` top active indicator (`[aria-current="page"]`).
- **Desktop (>=1024px)**: Fixed `220px` blueprint-navy left navigation rail (wordmark, full-width ledger switcher, 5 vertical nav links); workspace to the right (`max-width: 1120px`, `380px minmax(0, 1fr)` grid with `24px` gap). Left column holds the sticky quick-entry sheet; right column holds two simplified overview sheets (`本月預算` and `最近交易`).

## Elevation, Depth & Shapes

- **Zero Drop Shadows**: All surfaces are completely flat; visual separation comes exclusively from surface contrast and `1px` structural rules.
- **Corners**: `4px` on sheets and controls, `2px` on square color marks and progress bars. Zero pill shapes.
- **No Side Stripes**: No colored `border-left` or `border-right` above `1px` on cards, list items, or callouts.

## Motion & Browser Surfaces

- **Signature Transitions**: Ledger identity top bar on the entry sheet transitions over `180ms` when switching ledgers; new transaction rows reveal top-down via `clip-path` (`220ms cubic-bezier(0.16, 1, 0.3, 1)`). All motion disables under `prefers-reduced-motion: reduce`.
- **Browser Surfaces**: `<meta name="color-scheme" content="light dark">` + `:root { color-scheme: light dark; accent-color: var(--accent); scrollbar-color: ... }` (keeping default accessible scrollbar width, never `thin`), themed `::selection`, `caret-color`, `:focus-visible`, and `@media (forced-colors: active)` support.
