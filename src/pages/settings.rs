use leptos::prelude::*;
use leptos_router::components::A;

#[component]
pub fn SettingsPage() -> impl IntoView {
    view! {
        <div class="page-container">
            <header class="page-header">
                <h1 class="page-title">"設定"</h1>
            </header>

            <div class="card">
                <div class="settings-group">
                    <div class="group-title">"帳號與驗證"</div>
                    <div class="settings-row">
                        <span>"登入狀態"</span>
                        <A href="/login" attr:class="link-btn">"前往登入頁面"</A>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="group-title">"帳本管理"</div>
                    <div class="settings-row">
                        <span>"目前帳本"</span>
                        <span class="settings-val">"個人帳本"</span>
                    </div>
                    <div class="settings-row">
                        <span>"共用帳本"</span>
                        <span class="settings-val">"尚未加入"</span>
                    </div>
                </div>

                <div class="settings-group">
                    <div class="group-title">"資料匯出與備份"</div>
                    <div class="settings-row">
                        <span>"CSV 交易匯出"</span>
                        <button type="button" class="secondary-button" disabled=true>"匯出 CSV"</button>
                    </div>
                </div>
            </div>

            <div class="note-box">
                <p>"帳本管理、白名單與自動備份功能將於後續里程碑實作。"</p>
            </div>
        </div>
    }
}
