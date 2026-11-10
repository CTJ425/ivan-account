use leptos::prelude::*;

#[component]
pub fn HomePage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"記帳"</h1>
                <span class="badge">"個人帳本"</span>
            </header>

            <div class="card">
                <div class="type-toggle">
                    <button type="button" class="type-btn active">"支出"</button>
                    <button type="button" class="type-btn">"收入"</button>
                </div>

                <div class="form-group">
                    <label class="form-label">"金額"</label>
                    <div class="amount-display">
                        <span class="currency-prefix">"NT$"</span>
                        <span class="amount-val">"0"</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">"常用分類"</label>
                    <div class="category-grid">
                        <span class="category-chip">"早餐"</span>
                        <span class="category-chip">"午餐"</span>
                        <span class="category-chip">"晚餐"</span>
                        <span class="category-chip">"交通"</span>
                        <span class="category-chip">"日用品"</span>
                        <span class="category-chip">"娛樂"</span>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">"備註"</label>
                    <input type="text" class="text-input" placeholder="選填，最多 200 字" disabled=true />
                </div>

                <button type="button" class="primary-button" disabled=true>
                    "儲存交易（M2 啟用）"
                </button>
            </div>

            <section class="section">
                <h2 class="section-title">"今日明細"</h2>
                <div class="empty-placeholder">
                    <p class="placeholder-text">"目前尚無交易記錄"</p>
                </div>
            </section>
        </div>
    }
}
