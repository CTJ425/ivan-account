use leptos::prelude::*;

#[component]
pub fn ChartsPage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"圖表分析"</h1>
            </header>

            <div class="tab-header">
                <button type="button" class="tab-btn active">"週"</button>
                <button type="button" class="tab-btn">"月"</button>
                <button type="button" class="tab-btn">"年"</button>
            </div>

            <div class="card">
                <div class="chart-header">
                    <span class="chart-title">"支出分布"</span>
                </div>
                <div class="chart-canvas-placeholder">
                    <svg viewBox="0 0 100 100" class="placeholder-svg" aria-label="圓餅圖佔位">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" stroke-width="16" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#2563eb" stroke-width="16" stroke-dasharray="60 190" stroke-dashoffset="0" />
                    </svg>
                    <p class="placeholder-text">"自繪 SVG 圓餅圖與折線圖將於 M4 實作"</p>
                </div>
            </div>

            <section class="section">
                <h2 class="section-title">"支出明細排行"</h2>
                <div class="empty-placeholder">
                    <p class="placeholder-text">"尚無統計數據"</p>
                </div>
            </section>
        </div>
    }
}
