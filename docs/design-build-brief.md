# Design build brief: 統一發票 slip system (shell + 記帳 home)

Read first: `PRODUCT.md`, `.impeccable/surfaces/src-components-layout-tsx.md` (direction contract), `docs/SPEC.md` 4.2–4.2b. This file turns the contract into build rules. Do not copy the direction contract text into source code, comments, DOM or bundles.

## 1. Tokens (CSS custom properties in `src/styles/tokens.css`)

Light (default) and dark via `@media (prefers-color-scheme: dark)`. No manual toggle.

| Token | Light | Dark | Job |
|---|---|---|---|
| `--ground` | `#ECEFF2` | `#16181B` | app background behind slips |
| `--slip` | `#FFFFFF` | `#1F2226` | slip (paper) surface |
| `--ink` | `#1C2024` | `#E8EAED` | primary text, amounts |
| `--ink-2` | `#5A6169` | `#A3AAB2` | secondary text (must stay >= 4.5:1 on `--slip`) |
| `--rule` | `#D5DAE0` | `#353A40` | hairlines, tear line |
| `--invoice` | `#B3203A` | `#E0566C` | slip header band, primary button, active nav, focus ring |
| `--on-invoice` | `#FFFFFF` | `#1A0B0E` | text on invoice red |
| `--income` | `#17775A` | `#4CC39A` | income amounts and income bar |
| `--over` | `#B3203A` | `#E0566C` | over-budget segment; always paired with the text 「超支」 |

Group palette `--g1`…`--g8` (same in both themes, check contrast of white text on each, use dark text where white fails): `#3E6FB0` blue, `#C9741C` orange, `#2B8A6B` green, `#8657BF` purple, `#C0485F` rose, `#6E8B24` olive, `#2797B0` cyan, `#8A6A4E` brown.

Type: `font-family: "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif`. All amounts `font-variant-numeric: tabular-nums` and right-aligned. Scale: 12 / 14 / 16 / 20 / 28 / 40 px; amount input 40px weight 700; slip header 14px weight 600. Never monospace, never italic, no letter-spaced uppercase labels, no eyebrow/kicker text above headings.

Shape: slips have 2px corner radius (paper), buttons and inputs 6px radius (never pill), chips 4px. Shadow on slips only: `0 1px 2px rgb(0 0 0 / .06), 0 4px 12px rgb(0 0 0 / .05)` (dark: none, use `--rule` border instead). No gradients, no glass, no colored side borders.

Browser surfaces: `::selection` uses `--invoice` at 20% alpha; `caret-color: var(--invoice)`; `:focus-visible` = 2px `--invoice` outline with 2px offset; scrollbars thin, thumb `--rule`.

## 2. The slip component (`src/components/Slip.tsx`)

The signature element. Props: `title` (left, e.g. `11/10（一）`), `total` (right, formatted amount), `children` (rows). Structure:

- Header band: full-width `--invoice` background, `--on-invoice` text, 10px 16px padding, title left, total right.
- Tear line: 1px dashed `--rule` directly under the header, inset 12px each side.
- Rows: 12px 16px padding, a 10x10px square chip in the group color, category name (`--ink`, 15px), note (`--ink-2`, 13px, truncated with ellipsis), amount right-aligned tabular. Income rows show the amount in `--income` with a leading `+`. Rows separated by 1px `--rule`.
- Empty state: one quiet line in `--ink-2`: 「今天還沒有記錄」.

Print-in motion: a newly added row reveals with `clip-path: inset(0 0 100% 0)` → `inset(0 0 0 0)` over 240ms `cubic-bezier(0.16, 1, 0.3, 1)`; only rows added during this session animate; nothing animates under `prefers-reduced-motion: reduce`.

Reuse the slip for every grouped list: day slips, the budget slip, the income-vs-expense slip, the spending-by-group slip. No other card style exists.

## 3. Phone layout (< 1024px; content max-width 560px centered)

Top to bottom:

1. Top bar (56px, `--slip` background, bottom 1px `--rule`): ledger switcher on the left as a real `<button>` showing the current ledger name and a chevron icon (authored SVG); opens a native-feeling list (a simple popover list is fine; demo ledgers: 個人帳本, 家庭).
2. Entry area on `--slip` (not a slip with header; it is the form):
   - Expense / income segmented control: two equal buttons, 6px radius, selected = `--invoice` fill with `--on-invoice` text for expense, `--income` fill for income; `aria-pressed`.
   - Amount: a real `<input inputmode="numeric" pattern="[0-9]*">`, 40px bold, right-aligned, `NT$` prefix in `--ink-2`, bottom 2px `--ink` rule, no box. Placeholder 0.
   - Category grid: 4 columns of square-ish buttons (min 64px tall): group color chip filling the top area or the whole button with the category name; selected = 2px `--ink` outline + check icon (SVG). Only categories of the selected kind.
   - Row: date button (shows 今天 or `11/08（六）`, opens native `<input type="date">`) and note input (placeholder 「備註（選填）」, maxlength 200, label linked).
   - Save button: full width, 52px, `--invoice`, text 「記一筆」. Disabled until amount > 0 and a category is chosen.
3. Today's slip (`Slip` with today's date and total), then a 「看全部明細」 text link to `/transactions`.
4. Bottom nav (fixed, height 56px + safe-area inset): 記帳 `/`, 明細 `/transactions`, 圖表 `/charts`, 預算 `/budgets`, 設定 `/settings`; authored SVG icons, 1.75 stroke; active item `--invoice` icon and label; all others `--ink-2`.

## 4. Desktop layout (>= 1024px)

No bottom nav. A different page, not a stretched phone:

- Top bar (64px): 「個人記帳」 wordmark (18px weight 700 `--ink`) left, ledger switcher next to it, five nav links right (text links, active = `--invoice` text with 2px underline offset 6px).
- Body: max-width 1280px, centered, 24px gutters, CSS grid `360px 1fr`, 24px gap.
- Left column (sticky top 88px): the same entry form as the phone, on a `--slip` panel with 2px radius and slip shadow.
- Right column, stacked slips with 16px gap:
  1. Budget slip: header 「11 月預算」 left, 「剩餘 12,350」 right. One row per budgeted group: name, a bar, `已用 / 預算` right-aligned. All bars share one scale (the largest budget = full width); the used part in the group color, the remaining part `--rule`; an overrun continues past the budget mark in `--over` and the row's right text reads 「超支 1,200」.
  2. Income vs expense slip: header 「11 月收支」 left, 「結餘 +20,520」 right; two rows (收入 in `--income`, 支出 in `--ink`) with bars on one shared scale.
  3. Spending-by-group slip: header 「11 月支出分布」 left, total right; rows sorted descending: chip, group name, bar (shared scale), percentage, amount.
  4. Recent days: the last three day slips.
- Between 1024 and 1279px the right column is one column; at >= 1280px slips 2 and 3 sit side by side.

## 5. Routes and pages

- Add `/transactions` (明細) as a placeholder page in the new style (a heading 「明細」 and one empty-state slip).
- Move category management under settings: `/settings/categories` renders the old categories placeholder restyled; `/settings` lists entries 分類管理, 週期性項目, 帳本與成員, 白名單, 匯出 CSV, 登出 as rows inside a slip (the slip header is 「設定」 with the signed-in email on the right).
- Remove `/categories` from the nav; keep it as a redirect to `/settings/categories`.
- Restyle 圖表、預算、登入、找不到頁面 placeholders to the new tokens (headings and one empty-state slip each). The login page: centered slip with header 「個人記帳」, one line of copy, the Google sign-in button (`--slip` background, `--ink` text, 1px `--rule` border, Google "G" as authored SVG), error message in `--over`.

## 6. Demo data

Home uses demo data from one module `src/demo/data.ts` (realistic TWD amounts, e.g. 午餐 便當 120, 晚餐 牛肉麵 185, 交通 捷運 30, 收入 薪資 52,000). Every screen that shows demo figures shows one line 「示範資料，尚未連接帳本」 in `--ink-2` at the top of the content. Saving on the home screen adds the row to today's demo slip in memory (so the print-in motion can be seen), nothing is persisted.

## 7. Done when

- `npm run lint`, `npm run typecheck`, `npm run build` pass; initial JS stays under 200 KB gzip.
- At 390px and 1440px wide, nothing overflows horizontally; text never overlaps.
- Every interactive element has hover, focus-visible, active and disabled states.
- No emoji or Unicode symbols as icons; all icons are inline SVG with one stroke width.
