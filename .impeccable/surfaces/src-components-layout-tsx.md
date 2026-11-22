---
version: 1
slug: "src-components-layout-tsx"
primary_target: "src/components/Layout.tsx"
related_targets: ["src/pages/Home.tsx","src/App.tsx"]
---

# App shell and 記帳 home (mobile + desktop)

Mode: operate. Scope: the app shell (navigation, ledger switcher) and the 記帳 home screen at phone and desktop sizes; 明細、圖表、預算、設定、登入 inherit this Drafting Grid world.

Audience and job: family adults (≤5) on a phone at the counter recording one amount in about three actions (zero extra taps); on desktop the same people both record and review the month's essentials (本月預算/剩餘 + 最近交易 — detailed breakdowns live on 圖表頁). Keep the current unconnected empty states without fake demo data.

## Direction contract

THESIS: A deep blueprint-navy architectural shell anchors the active ledger while a zero-shadow 1px drafting-grid workspace replaces the discarded 統一發票 receipt slip system and refuses the category default of soft-shadowed rounded SaaS cards.

OWN-WORLD: Deep blueprint-navy shell (`#152942` light / `#0D1929` dark) paired with cool alabaster-blue drafting ground (`#F3F6FA` / `#11161D`), pure white work sheets (`#FFFFFF` / `#181F28`), architectural cobalt (`#1D56B8` / `#5B94F5`) primary CTA, ledger emerald (`#0F7B5F` / `#3CC89F`) for income, vermilion (`#C8372D` / `#F0645A`) for overrun, and 1px structural rules (`#D4DEE9` / `#2A3544`). Ledger identity marks (`#3B82F6` personal / `#D97706` shared) sync across the ledger switcher and entry header bar. CJK system sans at strictly two primary weights (500/700), tabular right-aligned numerals on fixed vertical plumb lines, crisp 4px corners, zero shadows, zero pills, zero cream, zero monospace labels, zero kickers.

STORY: The visitor sees their active ledger immediately from the navy shell and ledger identity strip, enters an amount, picks a category, and saves in three actions; on desktop they scan monthly budget status and recent transactions beside the entry sheet without leaving the page.

FIRST VIEWPORT: Phone (<1024px): 56px deep blueprint-navy sticky top bar (wordmark + ledger switcher with color square mark); zero-scroll quick-entry drafting sheet (ledger identity strip, 支出/收入 segment, large tabular amount field, category grid area, date + note row, full-width cobalt 記一筆 button); compact today feedback sheet below; 56px 5-tab bottom nav. Desktop (>=1024px): fixed 220px deep blueprint-navy left navigation rail (wordmark, ledger switcher, 5 vertical nav links); right workspace (`380px 1fr` grid, 24px gap) with sticky quick-entry sheet on the left and two stacked overview sheets on the right (本月預算 + 今日/最近交易).

FORM: 建築方眼藍圖 (Drafting Grid), position 7 on the ordered list (assigned by roll), seed:b5e9eb1323f14371. Raised by fixed-column tabular alignment (split-flap), two-weight neutral hierarchy (monochrome), 1px structural rule precision (centre-rail), and persistent state highlight on ledger/overrun change (boarding-pass).

SIGNATURE: Switching between 個人帳本 and 家庭 shifts the ledger identity bar (personal blue vs. shared amber-orange) across both the navigation shell and the entry sheet header with a crisp 180ms transition, while newly recorded rows reveal cleanly inside today's sheet (`clip-path`, 220ms exponential ease-out; disabled under `prefers-reduced-motion`).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Constraints

- Maintain unconnected empty states until M2 connects ledgers (no synthetic demo data); show clear status line 「尚未連接帳本，記帳功能將在下一版開放」.
- Light and dark themes follow system `prefers-color-scheme` (no manual toggle).
- Initial JS under 200 KB gzip; plain CSS, no UI library.
