use leptos::prelude::*;
use leptos_router::components::A;

#[component]
pub fn LoginPage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"登入"</h1>
            </header>

            <div class="card login-card">
                <p class="login-desc">
                    "請使用已加入白名單的 Google 帳號登入個人記帳系統。"
                </p>

                <button type="button" class="primary-button" disabled=true>
                    "使用 Google 帳號登入（M1 實作）"
                </button>

                <div class="login-footer">
                    <A href="/" attr:class="link-btn">"返回首頁"</A>
                </div>
            </div>

            <div class="note-box">
                <p>"Supabase Auth 與 PKCE 登入流程將於 Milestone M1 驗證與實作。"</p>
            </div>
        </div>
    }
}
