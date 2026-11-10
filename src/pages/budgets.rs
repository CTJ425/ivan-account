use leptos::prelude::*;

#[component]
pub fn BudgetsPage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"預算管理"</h1>
            </header>

            <div class="card">
                <div class="budget-header-row">
                    <span class="budget-label">"當月總預算"</span>
                    <span class="budget-amount">"NT$ 30,000"</span>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: 0%;"></div>
                </div>
                <div class="budget-meta">
                    <span>"已使用 NT$ 0"</span>
                    <span>"剩餘 NT$ 30,000"</span>
                </div>
            </div>

            <section class="section">
                <h2 class="section-title">"群組預算進度"</h2>
                <div class="empty-placeholder">
                    <p class="placeholder-text">"預算設定與超支警示功能將於 M3 實作"</p>
                </div>
            </section>
        </div>
    }
}
