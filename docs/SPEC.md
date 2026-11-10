# 個人記帳 Web App — 規格書 (v0.1 草稿)

狀態：v1 範圍已確認（2026-11-10），開發中。
標記說明：**[假設]** 表示我先採用的預設值，尚未經使用者確認。

## 1. 目標與範圍

給一個家庭（最多 5 人）在手機瀏覽器上使用的記帳工具，核心是「快速記一筆」與「看得出錢花去哪」。每個人有自己的個人帳本，另有家人共用的家庭帳本。

v1 範圍內：

- Google 登入（僅限白名單內的家人帳號）
- 帳本：個人帳本（僅本人可見）與共用帳本（成員皆可讀寫）
- 記錄、修改、刪除收入與支出
- 自訂分類（兩層：群組 → 分類），每個帳本各自一套，完全由使用者定義
- 每月預算（針對群組或分類）
- 週期性項目（房租、訂閱、薪資）自動產生交易
- 圖表分析（圓餅圖、折線圖；週 / 月 / 年），自繪 SVG
- CSV 匯出（v1 唯一的備份手段）
- 可安裝成 PWA（加到手機主畫面）

v1 範圍外（列為 v2 候選）：每週自動備份、離線記帳、收據照片、付款方式 / 資金帳戶（現金 / 信用卡 / 銀行）、多幣別、發票載具匯入。

## 2. 技術架構

| 層 | 選擇 | 說明 |
|---|---|---|
| 前端框架 | React + TypeScript，以 Vite 建置 | 純靜態輸出（SPA），可直接放 Cloudflare Pages |
| 路由 | React Router | 用戶端路由；Cloudflare Pages 以 `_redirects` 做 SPA fallback |
| 後端 | Supabase Cloud Free：Postgres + Auth + PostgREST | 不寫自有後端服務；商業邏輯放在 SQL (RLS、RPC function) |
| Supabase client | 官方 `@supabase/supabase-js` | 處理 Google 登入 (PKCE)、session 保存、token 自動更新、資料讀寫 |
| 伺服器狀態 | TanStack Query | 快取、重新抓取、樂觀更新 |
| 部署 | Cloudflare Pages 的 Git 整合，build command `npm run build`，輸出目錄 `dist` | 推送到 `main` 即自動建置與部署 |
| CI | GitHub Actions 只做檢查（型別檢查、lint、測試、build） | 不負責部署 |
| 圖表 | 以 React 元件直接輸出 SVG（已確認） | 見 2.2 |

### 2.1 前端框架選擇紀錄

2026-11-10 確認前端使用 React（最初文件誤寫為 Rust，已建立的 Leptos 骨架作廢）。React 與 Vue 都能滿足需求；選 React 的理由：Supabase 官方文件與範例以 React 為主、生態系與可用元件最多、coding agent 對 React 的產出品質最穩定。

使用官方 `supabase-js` 後，原本「自行實作 Auth client」的風險不存在。M1 仍需實機驗證 iOS Safari 與 PWA standalone 模式下的 Google 登入跳轉。

### 2.2 圖表方案

只需要圓餅圖與折線圖兩種。採自繪 SVG：無額外相依、bundle 小、樣式完全可控；代價是 tooltip 與觸控互動要自己寫。
若日後互動需求變多，可改用 Recharts（React 生態的圖表庫），不影響資料層。

### 2.3 環境變數

前端只需要兩個公開值，以 Vite 環境變數注入：`VITE_SUPABASE_URL`、`VITE_SUPABASE_PUBLISHABLE_KEY`。兩者設計上即為公開，直接提交在 `.env` 檔中；任何 secret key 不得以 `VITE_` 開頭或進入 repo。

## 3. 資料模型

資料以「帳本 (ledger)」為歸屬單位。所有業務資料表都有 `ledger_id`，並啟用 RLS：只有該帳本的成員可讀寫。成員判斷用一個 `security definer` function `is_ledger_member(ledger_id)`，避免 policy 查詢 `ledger_members` 時遞迴觸發 RLS。

```
allowed_emails                      -- 登入白名單
  email text pk, added_by uuid null, created_at timestamptz

profiles                            -- 首次登入時由 trigger 建立
  user_id uuid pk -> auth.users, display_name text, email text,
  is_admin boolean default false

ledgers
  id uuid pk, name text, kind text ('personal'|'shared'),
  created_by uuid, created_at timestamptz

ledger_members
  ledger_id fk, user_id fk, role text ('owner'|'member'),
  pk (ledger_id, user_id)

category_groups
  id uuid pk, ledger_id fk, name text, kind text ('expense'|'income'),
  sort_order int, archived_at timestamptz null

categories
  id uuid pk, ledger_id fk, group_id fk -> category_groups,
  name text, sort_order int, archived_at timestamptz null

transactions
  id uuid pk, ledger_id fk, category_id fk -> categories,
  amount integer (> 0，單位：新台幣元),
  occurred_on date,
  note text null (長度上限 200),
  created_by uuid (記錄是誰記的),
  recurring_rule_id fk null (由週期性規則產生時填入),
  created_at timestamptz, updated_at timestamptz
  index (ledger_id, occurred_on desc)
  unique (recurring_rule_id, occurred_on)   -- 防止同一規則同一天重複產生

budgets
  id uuid pk, ledger_id fk,
  group_id fk null, category_id fk null   -- 至多一個非 null；皆為 null 代表「每月總預算」
  amount integer,
  effective_from date (當月 1 號)
  unique (ledger_id, group_id, category_id, effective_from)

recurring_rules
  id uuid pk, ledger_id fk, category_id fk,
  amount integer, note text null,
  frequency text ('weekly'|'monthly'|'yearly'),
  start_on date, end_on date null,
  next_run_on date, active boolean,
  created_by uuid
```

帳本與成員規則：

- 每位使用者首次登入時自動取得一本個人帳本（`kind = 'personal'`，只有本人是成員，不可加入其他人）。
- 共用帳本由任一使用者建立，建立者為 owner；owner 可從已登入過的家人中加入 / 移除成員。成員可記帳、改分類、改預算；只有 owner 可改帳本名稱、管理成員、刪除帳本。
- 個人帳本的內容其他家人看不到，包含管理員（已確認）。
- 共用帳本內所有成員可修改或刪除任何一筆交易（已確認）；每筆交易顯示記錄者。
- App 上方有帳本切換器，記住上次使用的帳本。記帳、分類、預算、圖表都以「目前帳本」為範圍。

設計決定與理由：

- **兩層分類**：需求是「早、午、晚餐」各自是分類，但預算是「餐食費」整體。所以需要群組（餐食）→ 分類（早餐 / 午餐 / 晚餐），預算可以設在群組層級。
- **金額用 integer**：新台幣沒有小數，避免浮點誤差。收入 / 支出由群組的 `kind` 決定，金額一律正數。
- **日期用 `date` 而非 `timestamptz`**：記帳的「哪一天」是使用者當地的日曆日，用 timestamp 在跨時區或午夜前後會被分到錯的月份。
- **分類只封存不刪除**（`archived_at`）：刪除會讓歷史交易失去分類；封存後不出現在記帳選單，但歷史報表仍顯示。
- **預算用 `effective_from`**：設定一次後沿用到之後每個月，直到新增一筆更晚的設定。某月的有效預算 = `effective_from <= 該月` 中最新的一筆。不必每個月重設，也保留歷史預算。

- **分類屬於帳本，不屬於個人**：個人帳本與家庭帳本的分類可以完全不同；共用帳本的成員共用同一套分類。

新建帳本時帶入一組起始分類作為範本（支出：餐食〔早餐 / 午餐 / 晚餐〕、交通、居住、娛樂、其他；收入：薪資、其他），全部可改名、封存、重排或新增，沒有任何寫死的分類。

## 4. 功能規格

### 4.1 登入

- 只提供 Google 登入。未登入時所有頁面導向登入頁。
- **限制可登入的帳號**：Supabase 預設任何 Google 帳號都能註冊進這個專案。做法：在 `auth.users` 上加 `before insert` trigger，email 不在 `allowed_emails` 內就拒絕。
- 管理員（第一位使用者，email 由 migration 的 seed 寫入白名單並標為 `is_admin`）可在設定頁新增 / 移除白名單 email。白名單上限 5 筆。
- 從白名單移除某人時，同時停用其登入；其在共用帳本中記的交易保留。

### 4.2 記帳（最常用的畫面，首頁）

- 流程目標：打開 App 到存檔完成不超過 3 個操作 — 輸入金額 → 點分類 → 儲存。
- 畫面上方切換「支出 / 收入」，預設支出；分類格只顯示對應種類的分類。
- 日期預設今天，可改。備註選填。
- 金額輸入用 App 內建的數字鍵盤（不依賴系統鍵盤）。
- 分類以格狀按鈕呈現，依最近使用頻率排序 **[假設]**。
- 首頁下方顯示今日與最近的交易列表；點一筆可編輯或刪除。

### 4.3 分類管理

- 新增、改名、排序、封存群組與分類。
- 封存有交易的分類時提示「歷史紀錄會保留」。

### 4.4 預算

- 可設定：每月總預算、各群組預算、各分類預算。
- 預算頁顯示當月每項的「已用 / 預算」進度條與剩餘金額；超過 80% 變警示色、超過 100% 變超支色 **[假設]**。
- 首頁顯示當月總預算的剩餘金額。
- 不做結轉（上月剩餘不滾入下月）、不做推播通知。

### 4.5 圖表分析

- 期間切換：週 / 月 / 年，可前後翻頁。週以星期一為起始 **[假設]**。
- 圓餅圖：所選期間內各群組的支出占比；點群組可下鑽看該群組內各分類。
- 折線圖：
  - 月檢視 → 每日支出（可疊加預算線）
  - 年檢視 → 每月支出，可依群組分線
  - 週檢視 → 每日支出
- 圖表下方附排序過的明細表（分類、金額、占比），因為手機上圓餅圖的小扇區很難點。
- 彙總在資料庫做：以 Postgres function（透過 `/rest/v1/rpc/`）回傳彙總結果，前端不下載全部交易自行計算。

- 圖表預設顯示支出；可切換為收入，或看「收入 vs 支出」的每月對照與結餘。

### 4.6 週期性項目

- 可為目前帳本建立規則：分類、金額、備註、頻率（每週 / 每月 / 每年）、開始日、結束日（選填）。
- 產生方式：Supabase 的 `pg_cron` 每天執行一次 SQL function，把 `next_run_on <= 今天` 的規則各產生一筆交易並推進 `next_run_on`。若中間漏跑（例如專案被暫停），下次執行時補齊所有漏掉的期數。
- 每月規則遇到該月沒有那一天（例如 31 號）時，用該月最後一天。
- 自動產生的交易在列表中有標記，可像一般交易一樣修改或刪除；改規則只影響之後產生的交易。

### 4.7 匯出與備份

- 設定頁提供「匯出目前帳本的全部交易為 CSV」（UTF-8 with BOM，Excel 可直接開）。
- v1 不做自動備份；使用者需自行定期匯出 CSV。

### 4.8 PWA

- 提供 `manifest.json` 與圖示，可加到主畫面並以全螢幕開啟。
- Service worker 只快取 App 外殼（HTML / JS / CSS）；資料讀寫需要網路。離線時顯示明確提示，不靜默失敗。

## 5. 非功能需求

- 目標裝置：手機瀏覽器（iOS Safari、Android Chrome），直向，寬度 360–430 px。桌機可用但不特別最佳化。
- 首次載入：JS 經 gzip 壓縮後目標 < 200 KB；圖表與設定等非首頁畫面以路由層級的 code splitting 延後載入。
- 介面語言：繁體中文。
- 安全：前端只持有 Supabase anon key（本來就是公開的）；資料安全完全靠 RLS，所以每張表都要有 RLS policy 與對應測試。`service_role` key 不得出現在前端或 repo。

## 6. 免費額度與容量估算

### 6.1 額度（2026-11 查詢；數字來自第三方整理，動工前請以官方 pricing 頁為準）

| 項目 | Supabase Free | 對本專案的影響 |
|---|---|---|
| 資料庫大小 | 500 MB / 專案 | 見 6.2，實務上用不完 |
| 檔案儲存 | 1 GB | v1 不存檔案，用量 0 |
| 流量 (egress) | 5 GB / 月 | 單人使用遠低於此 |
| Auth 月活躍用戶 | 50,000 | 只有 1 人 |
| 專案數 | 2 個 active | 若已有其他免費專案需留意 |
| 閒置暫停 | 約 7 天無活動即暫停，需手動恢復 | **真正的風險**，見 6.3 |
| 備份 | 無 | **真正的風險**，見 6.3 |

| 項目 | Cloudflare Pages Free | 對本專案的影響 |
|---|---|---|
| Build 次數 | 500 次 / 月 | 每次推送到 `main` 用一次，個人專案用不完 |
| 單檔大小 | 25 MiB | JS bundle 遠小於此，沒問題 |
| 檔案數 | 20,000 | 只有數十個檔案 |
| 靜態請求 / 流量 | 不計量 | 無影響 |

### 6.2 資料庫容量估算

每筆交易佔用空間（估算值，上線後可用 `pg_total_relation_size` 實測修正）：

- 資料列：tuple header 24 + 三個 uuid 48 + amount 4 + date 4 + 兩個 timestamptz 16 + 備註平均約 30 + 行指標與對齊 ≈ **140 bytes**
- 索引：主鍵 (uuid) 約 45 + `(user_id, occurred_on)` 約 55 ≈ **100 bytes**
- 合計約 250 bytes，保守取 **300 bytes / 筆**

新建的 Supabase 專案本身（auth、storage 等系統 schema）約佔 30 MB，可用約 470 MB：

| 使用強度 | 每年筆數 | 每年用量 | 用完 470 MB 需要 |
|---|---|---|---|
| 每天 5 筆 | 1,825 | 約 0.55 MB | 約 850 年 |
| 每天 10 筆 | 3,650 | 約 1.1 MB | 約 430 年 |
| 每天 30 筆 | 10,950 | 約 3.3 MB | 約 140 年 |

470 MB 約可放 **150 萬筆**交易。上表是單人用量；5 人各自每天 10 筆加上家庭帳本，合計約每天 60 筆、每年約 6.6 MB，仍可用約 70 年。純文字記帳不可能用完資料庫額度。

會讓額度變緊的只有檔案：若日後加入收據照片，每張壓縮到約 300 KB，1 GB 約可放 3,300 張（每天 1 張約 9 年）。這是 v1 不做照片的原因之一。

### 6.3 真正需要處理的兩個風險

1. **閒置暫停**：連續約 7 天沒有任何請求（例如出國、生病），專案會被暫停，App 無法使用，需登入 Supabase 後台手動恢復；暫停過久（約 90 天）可能無法直接恢復。對策：GitHub Actions 排程每 2–3 天對資料庫發一個輕量查詢。
2. **沒有備份**：Free 方案不提供備份，誤刪或專案出事就沒有了。v1 對策只有 (a) App 內 CSV 匯出，由使用者自行定期執行。(b) 每週自動 `pg_dump` 加密備份已決定延到 v2，以下為屆時的方案紀錄。

   v2 備份存放位置候選（未決定）：

   | 方案 | 位置 | 保留 | 優點 | 缺點 |
   |---|---|---|---|---|
   | A | GitHub Actions artifact（同一個私有 repo） | 最長 90 天，滾動約 12 份 | 不需新服務、不需額外金鑰 | 超過 90 天的舊版本不保留；與程式碼同在 GitHub |
   | B | Cloudflare R2（免費 10 GB） | 自訂，可長期保留 | 與 Pages 同帳號；可留多年歷史 | 啟用 R2 需在 Cloudflare 綁定付款方式；多一組 API token |
   | C | 另一個私有 GitHub repo（commit 加密檔） | 永久 | 有完整歷史 | repo 會持續變大；需跨 repo 的 token |

   單次 dump 預期小於數 MB。解密用的 `age` 私鑰只存在使用者自己手上（密碼管理器），不放 GitHub；CI 只持有公鑰。還原流程需寫成文件並實際演練一次。

## 7. 部署與環境

- Repo：`https://github.com/CTJ425/ivan-account.git`
- Supabase 專案 URL：`https://pysleyxwaqdomjzokntz.supabase.co`
- Supabase publishable key：`sb_publishable_pXwvglK65TMuzEEVQ0O2fQ_5ZDMUs5j`（設計上即為公開金鑰，可放進前端與 repo；secret / `service_role` key 不得放入）
- Supabase schema 以 migration 檔管理（`supabase/migrations/`），用 Supabase CLI 套用。
- 環境：本機開發使用 `supabase start`（需 Docker）或直接連雲端專案 **[待決]**；正式環境一個。
- Google Cloud Console 需建立 OAuth client，授權重新導向 URI 設為 `https://<project-ref>.supabase.co/auth/v1/callback`；Supabase Auth 的 Redirect URLs 需加入正式網域與 `http://localhost:<port>`。這些是後台操作，需由使用者本人執行。

## 8. 里程碑

| # | 內容 | 完成條件 |
|---|---|---|
| M0 | 專案骨架：React + TypeScript + Vite、路由與頁面空殼、CI 檢查、Cloudflare Pages 以 `npm run build` 部署 | 正式網址可開啟空白 App |
| M1 | `supabase-js` 整合 + Google 登入 + 白名單 | 在 iOS Safari、Android Chrome、PWA 模式皆可登入、重新整理後維持登入、token 自動更新 |
| M2 | Schema、RLS、帳本與成員、起始分類；收支 CRUD | 可新增 / 修改 / 刪除交易；RLS 測試通過（非成員讀不到、寫不進別人的帳本） |
| M3 | 分類管理、預算、共用帳本成員管理、白名單管理 | 預算進度正確反映當月支出；兩個帳號可在同一共用帳本互見交易 |
| M4 | 圖表（圓餅、折線；週 / 月 / 年；收入 / 支出） | 圖表數字與明細表、SQL 查詢結果一致 |
| M5 | 週期性項目（`pg_cron`） | 規則到期自動產生交易；漏跑後可補齊且不重複 |
| M6 | CSV 匯出、PWA、防暫停排程 | 可安裝到主畫面；排程執行成功；匯出的 CSV 可用 Excel 開啟且筆數正確 |

## 9. 已知風險

| 風險 | 影響 | 處理 |
|---|---|---|
| iOS PWA standalone 模式的 OAuth 跳轉 | 部分 iOS 版本跳轉後回不到 PWA 或 session 不共用 | M1 實機測試；若失敗，退回「在 Safari 中使用」 |
| RLS policy 寫錯 | 家人看到彼此的個人帳本，或非成員可寫入 | M2 為每張表寫 RLS 測試（成員 / 非成員 / 未登入） |
| Supabase 免費專案閒置暫停 | App 無法使用，需手動恢復 | M6 的防暫停排程 |
| v1 沒有自動備份 | 誤刪或專案出事無法還原 | 使用者定期匯出 CSV；v2 加自動備份 |

## 10. 待決事項

已決定（2026-11-10）：家人共用最多 5 人、含個人與共用帳本；收支都做；不做付款方式；圖表用 SVG；不做離線；要做週期性項目；分類完全自訂；先用 `*.pages.dev`，日後換自有網域（換網域時需更新 Supabase Auth 的 Redirect URLs）。

另已決定：v1 不做自動備份（延到 v2）；家人看不到彼此的個人帳本；共用帳本成員可修改 / 刪除他人記的交易；共用帳本可建立多本。

目前沒有待決事項。標為 **[假設]** 的介面細節（分類排序、預算警示門檻、週起始日）採預設值，實作後可調整。
