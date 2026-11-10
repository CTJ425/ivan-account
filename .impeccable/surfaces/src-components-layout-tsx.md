---
version: 1
slug: "src-components-layout-tsx"
primary_target: "src/components/Layout.tsx"
related_targets: ["src/pages/Home.tsx","src/App.tsx"]
---

# App shell and 記帳 home (mobile + desktop)

Mode: operate. Scope: the app shell (navigation, ledger switcher) and the 記帳 home screen at phone and desktop sizes; 明細、圖表、預算、設定 inherit this world later.

Audience and job: family adults on a phone at the counter recording one amount in about three actions; on desktop the same people both record and review the month (remaining budget, spending by group, income vs expense, recent transactions — all four requested on desktop home). Must not feel cute or gamified, flashy, or like banking/report software.

## Direction contract

THESIS: Every day is one 統一發票 slip: transactions print onto the day's slip and the slip's red header carries the date and the day total. Refuses the category default of a dashboard of same-size rounded cards with a hero metric.

OWN-WORLD: White thermal-paper slips on a cool light-gray ground (dark theme: graphite ground, near-black slips), graphite ink, one invoice red that owns slip header bands and the primary action, teal-green for income, eight flat group colors as borderless chips. CJK system sans, tabular right-aligned numerals, a dashed tear line under each header. No cream, no pills, no monospace labels, no kickers.

STORY: The visitor sees which ledger they are in, enters an amount, taps a group-colored category, saves, and watches the line print onto today's slip; on desktop they also read what is left this month and where it went without leaving the page.

FIRST VIEWPORT: Phone: top bar with ledger switcher; expense/income segmented control; large right-aligned amount field; category chip grid; date and note row; full-width red save button; today's slip begins below; five-item bottom nav. Desktop (>=1024px): top bar with app name, ledger switcher and five nav tabs; left sticky 360px entry panel; right column: budget slip (header 本月預算 · 剩餘 amount, bars on one shared scale, overrun extends past the limit in red), income vs expense slip, spending-by-group slip, recent day slips.

FORM: 統一發票 slip system, position 1 on the ordered list (the pick card), seed key 320cf424.

SIGNATURE: on save the new row prints into today's slip with a top-down clip reveal (about 240ms, exponential ease-out); no motion under prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

- Demo data only until M2 connects ledgers; any screen showing demo figures carries one visible line 「示範資料，尚未連接帳本」.
- Light and dark themes follow the system setting (no manual toggle).
- Initial JS under 200 KB gzip; plain CSS, no UI library.
