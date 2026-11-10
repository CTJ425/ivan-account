use leptos::prelude::*;

#[component]
pub fn CategoriesPage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"分類管理"</h1>
            </header>

            <div class="tab-header">
                <button type="button" class="tab-btn active">"支出分類"</button>
                <button type="button" class="tab-btn">"收入分類"</button>
            </div>

            <div class="card">
                <div class="category-group">
                    <div class="group-title">"餐食"</div>
                    <ul class="item-list">
                        <li class="item-row">"早餐"</li>
                        <li class="item-row">"午餐"</li>
                        <li class="item-row">"晚餐"</li>
                    </ul>
                </div>

                <div class="category-group">
                    <div class="group-title">"交通"</div>
                    <ul class="item-list">
                        <li class="item-row">"大眾運輸"</li>
                        <li class="item-row">"加油 / 停車"</li>
                    </ul>
                </div>

                <div class="category-group">
                    <div class="group-title">"居住"</div>
                    <ul class="item-list">
                        <li class="item-row">"房租"</li>
                        <li class="item-row">"水電瓦斯"</li>
                    </ul>
                </div>
            </div>

            <div class="note-box">
                <p>"兩層分類架構（群組 → 分類）與封存功能將於 M3 實作。"</p>
            </div>
        </div>
    }
}
