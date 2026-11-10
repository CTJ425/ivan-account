---
name: 個人記帳
description: A family bookkeeping app where every day prints onto one 統一發票 slip.
colors:
  ground: "#ECEFF2"
  slip: "#FFFFFF"
  ink: "#1C2024"
  ink-2: "#5A6169"
  ink-3: "#8A9199"
  rule: "#D5DAE0"
  invoice: "#B3203A"
  on-invoice: "#FFFFFF"
  income: "#17775A"
  over: "#B3203A"
  g1: "#3E6FB0"
  g2: "#C9741C"
  g3: "#2B8A6B"
  g4: "#8657BF"
  g5: "#C0485F"
  g6: "#6E8B24"
  g7: "#2797B0"
  g8: "#8A6A4E"
typography:
  amount:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  wordmark:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "-0.01em"
  slip-header:
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
    fontWeight: 400
    lineHeight: 1.5
  note:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "PingFang TC, Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
rounded:
  slip: "2px"
  control: "6px"
  bar: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.invoice}"
    textColor: "{colors.on-invoice}"
    typography: "{typography.row}"
    rounded: "{rounded.control}"
    height: "52px"
  button-primary-disabled:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.ink-2}"
  button-secondary:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "48px"
  segment-expense-active:
    backgroundColor: "{colors.invoice}"
    textColor: "{colors.on-invoice}"
    rounded: "{rounded.control}"
    height: "40px"
  segment-income-active:
    backgroundColor: "{colors.income}"
    textColor: "{colors.on-invoice}"
    rounded: "{rounded.control}"
    height: "40px"
  segment-idle:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.control}"
    height: "40px"
  input-note:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "0 14px"
  slip:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
  slip-header:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.invoice}"
    typography: "{typography.slip-header}"
    padding: "12px 16px 10px"
  slip-row:
    textColor: "{colors.ink}"
    typography: "{typography.row}"
    padding: "12px 16px"
  nav-item-active:
    textColor: "{colors.invoice}"
    typography: "{typography.label}"
---

# Design System: 個人記帳

## Overview

**Creative North Star: "The Day's Receipt Slip"**

Every day is one 統一發票 slip. White thermal-paper slips sit on a cool light-gray counter; transactions print onto the day's slip, and the slip's head carries the date in invoice red and the day total in ink. Every grouped list in the product (day slips, budget, income vs expense, spending by group, settings, the login card) is the same slip, so the whole app reads as a stack of receipts rather than a dashboard of rounded cards with a hero metric.

The system is dense, quiet and numeric. Graphite ink does the work; one invoice red marks slip heads, the primary action, the active nav item and focus; teal-green marks income only; eight flat group colors identify categories as small square chips and pale tile fills. Numbers are tabular and right-aligned everywhere. The dark theme follows the OS setting: graphite ground, near-black slips with a hairline border instead of a shadow, and lifted red and green.

The one motion is the print: a newly saved row reveals top-down inside today's slip (240ms, exponential ease-out) and does not move at all under reduced motion.

**Key Characteristics:**
- Every grouped list is a slip: white paper, 2px corners, a 4px invoice-red band on the top edge, a red title, an ink total, a dashed red tear line.
- One accent (invoice red) with a strict job list; income green is a data color, not a second accent.
- Group colors appear only as flat squares, bar fills and 12% tile tints, never as text or as button fills.
- CJK system sans for everything; amounts tabular, right-aligned, bold.
- Flat surfaces with one soft paper shadow; no gradients, no glass.

## Colors

A cool graphite-on-gray paper palette with a single receipt red and a family of eight muted, flat group hues.

### Primary
- **Invoice Red** (`invoice`): the slip's top band, slip titles, the tear line (at 70%), the 記一筆 save button, the active expense segment, the active nav item and its underline, the selected ledger option, the 看全部明細 link, the focus ring, the text caret and (at 20% alpha) text selection. Dark theme lifts it to #E0566C.
- **On Invoice** (`on-invoice`): text on any filled invoice-red or income-green control. White in light, near-black #1A0B0E in dark.

### Secondary
- **Ledger Teal-Green** (`income`): income amounts (with a leading `+`), the income bar and the active income segment. Never decorative. Dark theme #4CC39A.
- **Overrun Red** (`over`): the same value as invoice red, kept as its own role. It fills the over-budget bar segment and colors 超支 text, the danger settings row and error lines, always paired with words that say what happened.

### Tertiary: group palette
- **Group hues** (`g1` blue, `g2` orange, `g3` green, `g4` purple, `g5` rose, `g6` olive, `g7` cyan, `g8` brown): one per category group, identical in both themes. Used as 10px and 12px square chips, bar fills, and as a 12% tint mixed into `slip` for category tiles. Income categories use `income` as their group color.

### Neutral
- **Counter Gray** (`ground`): the app background behind slips; also the hover fill for rows and secondary buttons, and the empty track behind compare and share bars. Dark #16181B.
- **Thermal White** (`slip`): slips, the entry panel, top bar, bottom nav, popover and inputs. Dark #1F2226.
- **Graphite Ink** (`ink`): primary text, all amounts, the amount field's 2px underline, the selected tile outline, the expense compare bar. Dark #E8EAED.
- **Pencil Gray** (`ink-2`): notes, secondary values, inactive nav, the NT$ prefix, idle segments, the demo-data line. Holds 4.5:1 on `slip`. Dark #A3AAB2.
- **Faint Gray** (`ink-3`): the amount field's placeholder `0` only (40px, weight 400). Dark #737A82.
- **Hairline** (`rule`): row dividers, control borders, top bar and bottom nav edges, the remaining part of budget bars, the disabled save button fill, dark-theme slip borders. Dark #353A40.

### Named Rules
**The Red Has A Job List Rule.** Invoice red appears only in the roles listed above. It is never a background panel, a decorative stripe or a heading color outside slip titles.

**The Group Colors Are Marks Rule.** Group hues are fills for squares, bars and 12% tints. They never color text and never fill a button.

**The Words With Red Rule.** Every use of `over` sits next to text that names the state (超支, 登出, an error sentence). Color alone never carries the meaning.

## Typography

**Body Font:** PingFang TC (with Noto Sans TC, Microsoft JhengHei, system-ui, sans-serif)

**Character:** One CJK system sans for every role, the way a receipt printer has one face. Hierarchy comes from weight and size, not from a second family; numbers use tabular figures and right alignment.

### Hierarchy
- **Amount** (700, 40px, line-height 1, tabular): the amount entry field only. Its placeholder drops to weight 400 in `ink-3`; entered digits are `ink` at 700. The NT$ prefix beside it is 600, 20px, `ink-2`.
- **Wordmark** (700, 18px, -0.01em): 「個人記帳」 in the top bar.
- **Slip header** (700, 14px, line-height 1.3): slip title in `invoice` on the left, total in `ink` on the right with tabular figures.
- **Row** (500, 15px): category names in slip rows, category tile labels, settings rows, desktop nav links, segmented buttons (600). Row amounts are 600, 15px, tabular, right-aligned. The save button is 600, 16px.
- **Body** (400, 14px, line-height 1.5): form inputs, the date button (500), slip empty states, login copy, budget and compare labels.
- **Note** (400, 13px): transaction notes (truncated with an ellipsis), budget usage values (500), the demo-data line. Share percentages are 12px.
- **Label** (500, 11px): bottom-nav labels under 22px icons; active is 600 in `invoice`.

### Named Rules
**The Tabular Ledger Rule.** Every amount, total, percentage and budget figure uses `font-variant-numeric: tabular-nums` and is right-aligned.

**The One Face Rule.** No second family, no monospace, no italic, no letter-spaced uppercase labels.

## Layout

Phone first (below 1024px): content centered at max 560px with 16px side padding, a 56px sticky top bar (wordmark, ledger switcher), and a fixed 56px bottom nav plus the safe-area inset. The home screen stacks the entry panel, today's slip and the 看全部明細 link.

Desktop (1024px and up) is its own page, not a stretched phone: a 64px top bar with wordmark and ledger switcher on the left and five text nav links on the right; body max 1280px with 24px gutters; a CSS grid of `360px 1fr` with a 24px gap. The left column holds the entry panel, sticky at 88px from the top. The right column is a single stack of slips with 16px between them: budget, 收支, 支出分布, then the recent day slips. The 收支 and 支出分布 slips stay stacked at every desktop width; they never sit side by side.

Secondary pages (settings, placeholders) use a centered column of 560px (680px on desktop) with the same 16px stack gap.

Spacing runs on 4 / 8 / 12 / 16 / 24 px, with 6px used inside tight controls (segment gap, chip-to-label gap) and 10px in the header's bottom padding. Rows are 12px by 16px; slip-to-slip gaps are 16px; desktop gutters and the column gap are 24px.

## Elevation & Depth

Paper on a counter: light theme slips carry one soft, low shadow; nothing else lifts. The dark theme drops the shadow and outlines slips with a 1px `rule` border instead. Depth is never used for hover; hover is a `ground` fill or a darker border.

### Shadow Vocabulary
- **Slip paper** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.06), 0 4px 12px rgb(0 0 0 / 0.05)`): slips, the entry panel and the ledger popover, which are all paper. Dark theme: `none`, with `1px solid` `rule` border.

### Named Rules
**The Paper Only Rule.** Only slip-material surfaces (slips, the entry panel, the popover) carry the paper shadow. Buttons, tiles, inputs and bars are flat.

## Shapes

Near-square paper. Slips and the entry panel have 2px corners. Buttons, inputs, segments, the ledger switcher and category tiles have 6px corners; nothing is pill-shaped. Bars are 8px tall with 4px ends. Row and share chips are 10px squares with 2px corners; the chip on a category tile is a 12px square with sharp corners. Dividers are 1px solid `rule`. The tear line under each slip header is a 1px dashed line in `invoice` at 70%, inset 12px from each side.

**The Top Band Rule.** The 4px `invoice` band on the top edge belongs to slips and nothing else. The entry panel, tiles, buttons, popovers and the top bar never get a colored top band, and no surface gets a colored left or right stripe.

## Components

### Buttons
- **Shape:** gently squared (6px).
- **Primary (記一筆):** full width, 52px tall, `invoice` fill, `on-invoice` text, 600 at 16px. Hover drops opacity to 0.92, active to 0.85. Disabled (until an amount and a category are chosen) is a `rule` fill with `ink-2` text.
- **Secondary (Google sign-in, ledger switcher, date button):** `slip` fill, `ink` text, 1px `rule` border; hover darkens the border to `ink-2` and may fill with `ground`. 48px tall in forms.
- **Focus:** every interactive element shows a 2px `invoice` outline at 2px offset.

### Segmented control (支出 / 收入)
Two equal 40px buttons with a 6px gap, 1px `rule` border, `ink-2` text at 600/15px when idle. Active expense fills `invoice`; active income fills `income`; both use `on-invoice` text. State is exposed with `aria-pressed`.

### Category tiles
A four-column grid with 8px gaps; each tile is at least 64px tall, borderless, filled with its group color mixed 12% into `slip`, with a 12px flat square of the full group color at the top-left (6px inset) and the category name centered in `ink` (500, 15px). Selected adds a 2px `ink` outline at 2px offset and a 14px check icon at the top-right. Hover lowers opacity to 0.9. Only categories of the selected kind are shown.

### Inputs / Fields
- **Amount:** no box. A 2px `ink` underline, NT$ prefix on the left, digits right-aligned at 40px. Placeholder `0` in `ink-3` at weight 400; entered value in `ink` at weight 700.
- **Note:** 48px, `slip` fill, 1px `rule` border, 6px corners, 14px padding, placeholder in `ink-2`. Hover border `ink-2`; focus border `invoice`.
- **Date:** a secondary button showing 今天 or `11/08（六）`, with the native date input layered invisibly over it.

### Navigation
- **Phone bottom nav:** fixed, `slip` fill, 1px `rule` top edge, five equal items with a 22px line icon over an 11px label. Inactive `ink-2`, hover `ink`, active `invoice` at 600.
- **Desktop top nav:** five text links, 500/15px `ink-2`, 24px apart; active is `invoice` at 600 with a 2px underline 6px below the text.
- **Ledger switcher:** a secondary button with the ledger name (600/14px) and a 14px chevron that rotates when open; it opens a paper popover of options, with the current one in `invoice` with a check.
- **Icons:** inline SVG line icons, 24 viewBox, 1.75 stroke, round caps and joins.

### Slip (signature component)
The receipt. `slip` fill, 2px corners, paper shadow (border in dark), and a 4px `invoice` band on the top edge. The header is white, 12px 16px 10px padding: title on the left in `invoice` (700, 14px), total or a right-side value on the right in `ink` (700, tabular). A dashed `invoice` tear line at 70% follows, inset 12px. Body rows are separated by 1px `rule`:
- **Transaction row:** 12px 16px; a 10px group-color square, category (500/15px `ink`), an ellipsized note (13px `ink-2`), and the amount right-aligned (600/15px, tabular). Income amounts are `income` with a leading `+`.
- **Budget row:** name and 已用 / 預算 on one line, an 8px bar below. All budget bars share one scale (the largest budget or usage is full width): used part in the group color, remaining part in `rule`, and an overrun continuing past the budget mark in `over`, with the right text switching to 超支 and the amount in `over`.
- **Compare row (收支):** label and amount, then an 8px bar on a `ground` track; income in `income`, expense in `ink`, both on one shared scale.
- **Group share row (支出分布):** a grid of chip and name, bar, percentage (12px `ink-2`) and amount (600/14px). Bars scale to the largest group, so the top group fills the track.
- **Empty state:** one centered line in `ink-2` (14px), e.g. 今天還沒有記錄.
- **Print-in:** a newly saved row reveals with `clip-path: inset(0 0 100% 0)` to `inset(0 0 0 0)` over 240ms `cubic-bezier(0.16, 1, 0.3, 1)`; no animation under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:
- **Do** put every grouped list in a slip: white header with the 4px `invoice` top band, red 700 title, ink 700 total, dashed red tear line at 70%.
- **Do** keep amounts tabular, right-aligned and bold, with income in `income` and a leading `+`.
- **Do** draw every bar group on one shared scale inside its slip; budget overruns extend past the budget mark in `over` and say 超支.
- **Do** show group identity as a flat square chip (10px in rows, 12px on tiles) and a 12% tint, never as text color.
- **Do** keep the 收支 and 支出分布 slips stacked in a single column on desktop.
- **Do** swap the paper shadow for a 1px `rule` border in the dark theme.

### Don't:
- **Don't** give any surface other than a slip a colored top band, and don't use colored left or right stripes anywhere.
- **Don't** use cream or off-white backgrounds, italic accent words in headings, numbered 01/02/03 labels, monospace labels or pill-shaped buttons.
- **Don't** put eyebrow or kicker text above headings.
- **Don't** add gradients, glass, or shadows on buttons, tiles or inputs.
- **Don't** use emoji or Unicode symbols as icons; use inline SVG line icons at 1.75 stroke.
- **Don't** introduce a second accent color; teal-green is reserved for income.
