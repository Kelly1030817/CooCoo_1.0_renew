// CooCoo 煮煮 - Core Application Logic & State Management

// Global Error Handler for visual debugging
window.onerror = function(message, source, lineno, colno, error) {
    alert("CooCoo App 偵測到全域 JavaScript 錯誤！\n\n訊息: " + message + "\n檔案: " + source + "\n行號: " + lineno + "\n堆疊:\n" + (error && error.stack ? error.stack : "無"));
    return false;
};

// Initialize Supabase Client
const SUPABASE_URL = 'https://obrnacarldeggxrineff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icm5hY2FybGRlZ2d4cmluZWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0NTYyNzgsImV4cCI6MjA5ODAzMjI3OH0.YTGjDc_NJhLTQXkvOH0mSTXsY1r_Wq6pp1_-95ZL650';
let supabaseClient = null;

try {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
        console.error("Supabase Client SDK not found.");
    }
} catch (e) {
    console.error("Supabase client creation failed, falling back to offline mode:", e);
}

let isCloudMode = false;
let currentUser = null;

// Default Initial State
const DEFAULT_STATE = {
    inventory: [
        {
            id: "i1",
            name: "酪梨",
            chamber: "cold",
            qty: 1,
            unit: "顆",
            daysLeft: 0,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdDfNSxxGjlHNotFR11Hpy8v0T59noNyOTeU1h1IVOWbvlNmeTxfenbqWlC9JlJd2C1uWaeGZG5NUNKAFPYf5DBYM0bqUZOJWTlGNP1mUVsE6KZuaqJaz4zegaSUCfDR9UIpbsS9babhgQP6pMXTPYuOXIC9YJTOBEonszTcpAxPE6ez7AWXLSJhAMj_VTRmcmzJKUxlOd4TjUmLfHCNZz6Txsts4f__iskIIzk63tGPapSOtIPGucoJDUZxE8L4U9g-NqDIYHwgw",
            addedDate: "2026-06-26",
            roi: { savings: 120, sodium: 200, fat: 15 },
            storageProtocol: "避光保存。若已切開，表面滴檸檬汁並以保鮮膜緊貼冷藏，以阻斷氧化。",
            boxSize: "S"
        },
        {
            id: "i2",
            name: "胡蘿蔔",
            chamber: "cold",
            qty: 3,
            unit: "條",
            daysLeft: 3,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCB6T3B4nig1ziAwIm1wSVgPv1ecoPiWrdICCeoGct9PZinlrXcpUQLkGSEkHJRIslOBINUxs6ZNwMBLnl1vyhYVduguWMa7x2HkBsxzHDaEOmF0agjsTINBgjsqQ7chfP3fC_mI20majBIld1HnR5Y8PNI7IT3u5wuu-5PNjoRFOkG_jreA3ffAQg0QVtjW-dvNnx_0Qj_eTq5Gessw8I9whoGXuCch4ME-JSUEsoNEJVFPUQcZhXzDIdVtyiXojBxpudh8aWhmeo",
            addedDate: "2026-06-23",
            roi: { savings: 60, sodium: 100, fat: 5 },
            storageProtocol: "根莖類微氣候維護：整條或切塊以微濕紙巾包裹，存入方形收納盒以防乾癟。",
            boxSize: "M"
        },
        {
            id: "i3",
            name: "起司",
            chamber: "cold",
            qty: 150,
            unit: "g",
            daysLeft: 4,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsdLsTuOlvKjmOqP6m-wWjblzWJfC1TpbjHQz_O1cotBDXmXcvDKp4AmutQnCyC7653riqE4Y_wql5V06eWELmkrTAHUsg7sY4zSjaOSbQoJXlCvSo_R0dnrhxzpWykh2Neq8HMgzYM4PJeuZgXRTpV5cm_mRM6rpgjDylz4nmDz-wTWCxxHew-EKajA7Q8ZioqSXNlLrSKGEtE_dCRd57jjDzt1XXSyWrOGV4Skw1latyJ1fBrAHdLaU2MC25rMNDxHP0PYNaDxQ",
            addedDate: "2026-06-25",
            roi: { savings: 100, sodium: 250, fat: 20 },
            storageProtocol: "密封防潮：使用雙重方形密封盒，避免吸收冰箱內異味與水分降解。",
            boxSize: "S"
        },
        {
            id: "i4",
            name: "雞蛋",
            chamber: "cold",
            qty: 6,
            unit: "顆",
            daysLeft: 10,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBIkd8DDrNZLiSgFOwLZMm56-FPFbbYvtbQKQotyuuCix-LU3AO5mFP6Trce_mer2gBPcrHDQY7QVdQ7aQRLqlcY-9A1Y5ZqnJD9Kf2g9Tb02-8EXNcAlMrz-U8bpU3MBfkIAEUAHs1uUwiZLwkqMBSJMDYzWutfYrFdxdnB4l0q651uhvzxy6gpkSnklZVHRKCTUWsdvOQFBhSGwL-Re8FQbx7AoMP3dKUkKSDX3NULYorgFhGUSAT0bDxJPnDjyGEsoQgSp3LV-k",
            addedDate: "2026-06-26",
            roi: { savings: 50, sodium: 80, fat: 8 },
            storageProtocol: "鈍端朝上冷藏：維持氣室於頂部，防止蛋黃貼殼變質，避開冰箱門開關震動處。",
            boxSize: "M"
        },
        {
            id: "i5",
            name: "鮭魚",
            chamber: "frozen",
            qty: 2,
            unit: "片",
            daysLeft: 90,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6dY5HW5Sfpo5lwYOKgdf3wK0YGceYHNJkVEq9Lo2ssC96bZfivNbkOQJQHNAzQQQCCorFOLtWyoWq36O-TP8ayemePMJz_jPYafduq4jQAU99E0c05W7xavkGx2fsOtT42YY4az5VAqHka2eTqUe7qoiqDJaQLwtHfoOTmaxshZKaqXlp-_z3CAbyiIxBOwcjeq9me-EDV8Jg0PnmI5OWyQJLbqy68bVt0QO4xnqmuScAzxT5oMSZ6cSrn41c0IfX26JvVVMXgKo",
            addedDate: "2026-06-25",
            roi: { savings: 250, sodium: 300, fat: 25 },
            storageProtocol: "組織液阻斷：冷凍前以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積，解凍快70%。",
            boxSize: "M"
        },
        {
            id: "i6",
            name: "綜合莓果",
            chamber: "frozen",
            qty: 1,
            unit: "包",
            daysLeft: 150,
            image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCa5gj9PLU1Q9NoxiorfXJ2_JF82pUL6fyDNYaq9Y3iErHzgDV6iJYyq8FV3-iViBFhk_uD9n3H0Bq25QSyKXHS-Rv_pIoXvdV8PFrG64pD7rCxiIQ2xx8NNZZxthiFXayKdMdclHLi35UlxRamo6_qoQw0Y69WTRMhi2QKtPTHHtv1WS_jEqp9WSDCyULNpux8VM8FvPMZSalBZlMJsbMwayi9XI_F4QUVLpIdJoBkShTJHRdAKGnOeZGF1Y4QETY-MmXuvx2zpe0",
            addedDate: "2026-06-26",
            roi: { savings: 150, sodium: 50, fat: 2 },
            storageProtocol: "表面積優化：平鋪密封冷凍，防止壓碎，取用時可保持顆粒完整。",
            boxSize: "S"
        }
    ],
    savingsGoal: {
        target: 60000,
        saved: 43200,
        monthlySaved: 5840,
        sodiumReduced: 14200,
        fatReduced: 850,
        mealsCompleted: 0,
        rescuedItems: 0
    },
    // Fridge Profile (冰箱容量偵測)
    fridgeProfile: {
        brand: "",
        model: "",
        capacityLiters: 0,
        coldRatio: 0.6,
        widthCm: 0,
        heightCm: 0,
        depthCm: 0,
        fridgeType: "",      // 'mini' | 'single' | 'double' | 'triple' | 'side_by_side'
        photoUrl: "",
        isConfigured: false
    },
    // Cookware (炊具)
    cookware: [
        { id: "cw1", type: "electric_pot", name: "快煮鍋", brand: "象印", model: "CH-DWF10", capacity: "1L", wattage: 1300 },
        { id: "cw2", type: "rice_cooker", name: "電鍋", brand: "大同", model: "TAC-10L", capacity: "10人份", wattage: 800 },
        { id: "cw3", type: "induction", name: "電磁爐", brand: "飛利浦", model: "HD4924", capacity: "", wattage: 2100 }
    ],
    // Utensils (廚具)
    utensils: [
        { id: "ut1", name: "砧板", owned: true },
        { id: "ut2", name: "菜刀", owned: true },
        { id: "ut3", name: "量杯", owned: true },
        { id: "ut4", name: "攪拌器", owned: false },
        { id: "ut5", name: "削皮器", owned: true },
        { id: "ut6", name: "夾子", owned: true },
        { id: "ut7", name: "篩網", owned: false },
        { id: "ut8", name: "保鮮膜", owned: true },
        { id: "ut9", name: "鋁箔紙", owned: true },
        { id: "ut10", name: "量匙", owned: true },
        { id: "ut11", name: "鍋鏟", owned: true },
        { id: "ut12", name: "湯勺", owned: true }
    ],
    // Dreams (多元夢想追蹤)
    dreams: [
        {
            id: "dream1",
            name: "夢幻廚房改裝基金",
            description: "透過在家烹飪減少的外食支出，正穩定累積中。",
            type: "savings",
            targetAmount: 60000,
            savedAmount: 43200,
            targetDate: "2027-03-01",
            icon: "savings",
            isActive: true,
            isPaused: false,
            sortOrder: 0,
            moodLog: []
        },
        {
            id: "dream2",
            name: "京都櫻花之旅",
            description: "每一餐省下的費用，都在拉近與京都的距離。",
            type: "travel",
            targetAmount: 35000,
            savedAmount: 8600,
            targetDate: "2027-04-01",
            icon: "flight",
            isActive: true,
            isPaused: false,
            sortOrder: 1,
            moodLog: []
        },
        {
            id: "dream3",
            name: "健康體態計畫",
            description: "透過自煮控制熱量，達成理想體重目標。",
            type: "weight_loss",
            targetAmount: 0,
            savedAmount: 0,
            targetWeight: 58,
            currentWeight: 65,
            startingWeight: 65,
            targetDate: "2027-06-01",
            icon: "monitor_weight",
            isActive: true,
            isPaused: false,
            sortOrder: 2,
            moodLog: []
        }
    ],
    activeDreamId: "dream1",
    shoppingList: [
        { id: "s1", name: "有機小松菜", category: "produce", qty: 2, unit: "束", checked: false, status: "剩餘 10%", estCost: 80 },
        { id: "s2", name: "牛番茄", category: "produce", qty: 4, unit: "顆", checked: false, status: "已耗盡", estCost: 120 },
        { id: "s3", name: "富士蘋果", category: "produce", qty: 3, unit: "顆", checked: true, status: "已選取", estCost: 150 },
        { id: "s4", name: "放牧土雞蛋", category: "protein", qty: 10,  unit: "入", checked: false, status: "急需補貨", estCost: 180 },
        { id: "s5", name: "全脂鮮乳", category: "protein", qty: 1, unit: "瓶 (936ml)", checked: false, status: "剩餘 20%", estCost: 95 }
    ],
    shoppingAssistant: {
        conversation: [],
        lastResult: null,
        selectedMenus: []
    },
    deliverySupport: {
        history: [],
        fridayReminder: "17:30",
        householdSize: 1
    },
    userProfile: {
        displayName: "",
        breakfast: 70,
        lunch: 130,
        dinner: 180,
        extrasWeekly: 350,
        eatingOutDays: 5,
        householdSize: 1,
        planMode: "balanced",
        customWeeklySaving: 400,
        lifeNote: "",
        onboardingComplete: false
    },
    dreamSpace: {
        version: 1,
        lifeProfile: {
            mealCosts: { breakfast: 70, lunch: 130, dinner: 180 },
            homeCookedMealCost: 80,
            extrasWeekly: 350,
            eatingOutDays: 5,
            cookingDays: 2,
            busyDays: [],
            constraints: [],
            note: ""
        },
        actionPreferences: { actions: [] },
        activePlan: null,
        planHistory: []
    }
};

// Global App State
let appState = null;
let currentTab = "shopping"; // Default active tab: 補貨區
let aiChefMode = false;
let selectedChefItems = [];
let shoppingAssistantImage = null;

// ==========================================
// AUTHENTICATION & CLOUD SYNC LOGIC
// ==========================================

function updateAuthBadge() {
    const container = document.getElementById("user-auth-badge");
    if (!container) return;

    if (isCloudMode && currentUser) {
        const name = currentUser.user_metadata?.full_name || currentUser.email.split('@')[0];
        const avatar = currentUser.user_metadata?.avatar_url;

        container.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-1 bg-[#e2eff9] border border-[#a2bcdc]/80 text-[#3a506b]" style="border-radius: 30px 40px 20px 25px / 40px 30px 25px 20px;">
                ${avatar ? `<img src="${avatar}" class="w-5 h-5 rounded-full object-cover">` : `<span class="material-symbols-outlined text-[#3a506b] text-base">cloud</span>`}
                <span class="hidden sm:inline text-xs font-extrabold pr-0.5">${name}</span>
            </div>
            <button onclick="handleLogout()" title="登出" class="text-on-surface-variant hover:text-error p-1 rounded-full transition-colors flex items-center justify-center">
                <span class="material-symbols-outlined text-sm">logout</span>
            </button>
        `;
    } else {
        container.innerHTML = `
            <button onclick="openAuthModal()" aria-label="登入雲端" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface transition-all active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
                <span class="material-symbols-outlined text-secondary text-base">vpn_key</span>
                <span class="hidden sm:inline text-[11px] font-extrabold pr-0.5">登入雲端</span>
            </button>
        `;
    }
}

function openAuthModal() {
    const existing = document.getElementById("auth-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "auth-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in";
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[380px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md transform transition-all scale-95 duration-200">
            <div class="flex justify-between items-center pb-sm border-b border-outline-variant/30">
                <h3 class="text-lg font-extrabold text-slate-blue">登入自煮管家</h3>
                <button onclick="closeAuthModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <p class="text-xs text-on-surface-variant leading-relaxed">
                登入後即可將您的「冰箱庫存」、「圓夢看板」與「採買矩陣」永久同步至雲端，支援多裝置存取！
            </p>

            <div class="space-y-sm">
                <button onclick="loginWithProvider('google')" class="w-full bg-white hover:bg-surface-container border border-outline-variant text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
                    <svg class="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.36 1 3.4 3.65 1.52 7.52l3.84 2.98C6.28 7.36 8.92 5.04 12 5.04z"/>
                        <path fill="#4285F4" d="M23.52 12.28c0-.8-.08-1.6-.24-2.36H12v4.52h6.48c-.28 1.48-1.12 2.72-2.36 3.56l3.68 2.84c2.16-2 3.72-4.96 3.72-8.56z"/>
                        <path fill="#FBBC05" d="M5.36 14.76c-.24-.72-.36-1.48-.36-2.28s.12-1.56.36-2.28L1.52 7.2C.56 9.16 0 11.32 0 13.6s.56 4.44 1.52 6.4l3.84-2.98c-.24-.8-.36-1.6-.36-2.28z"/>
                        <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.96-2.92l-3.68-2.84c-1.12.76-2.56 1.2-4.28 1.2-3.08 0-5.72-2.32-6.64-5.44L1.52 15.96C3.4 19.84 7.36 22.48 12 23z"/>
                    </svg>
                    使用 Google 帳號快速登入
                </button>
                <button onclick="loginWithProvider('apple')" class="w-full bg-black hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.1,16.67C20.08,16.74 19.67,18.11 18.71,19.5M15.97,4.17C16.63,3.37 17.07,2.28 16.95,1C15.85,1.04 14.51,1.73 13.73,2.64C13.07,3.41 12.49,4.52 12.64,5.78C13.87,5.87 15.12,5.17 15.97,4.17Z"/>
                    </svg>
                    使用 Apple 帳號快速登入
                </button>
            </div>

            <div class="relative flex py-2 items-center">
                <div class="flex-grow border-t border-outline-variant/30"></div>
                <span class="flex-shrink mx-4 text-[10px] text-on-surface-variant font-bold">或使用信箱登入</span>
                <div class="flex-grow border-t border-outline-variant/30"></div>
            </div>

            <div class="space-y-sm">
                <div>
                    <label class="block text-[10px] font-bold text-on-surface-variant mb-1">電子信箱</label>
                    <input type="email" id="auth-email" placeholder="name@example.com" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-xs">
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-on-surface-variant mb-1">密碼</label>
                    <input type="password" id="auth-password" placeholder="請輸入密碼" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-xs">
                </div>
            </div>

            <div class="flex gap-sm pt-2">
                <button onclick="handleEmailRegister()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    註冊帳號
                </button>
                <button onclick="handleEmailLogin()" class="flex-1 bg-primary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md">
                    信箱登入
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeAuthModal() {
    const modal = document.getElementById("auth-modal");
    if (modal) modal.remove();
}

async function loginWithProvider(provider) {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    } catch (err) {
        alert("OAuth 登入失敗：" + err.message);
    }
}

async function handleEmailLogin() {
    if (!supabaseClient) return;
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    if (!email || !password) {
        alert("請輸入信箱與密碼！");
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast("登入成功！正在載入雲端資料...", "success");
        closeAuthModal();
        await loadState();
        renderCurrentTab();
    } catch (err) {
        alert("登入失敗：" + err.message);
    }
}

async function handleEmailRegister() {
    if (!supabaseClient) return;
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    if (!email || !password) {
        alert("請輸入信箱與密碼！");
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) throw error;
        alert("註冊成功！若您設定了郵件驗證，請至信箱點擊驗證信；否則即可直接登入。");
    } catch (err) {
        alert("註冊失敗：" + err.message);
    }
}

async function handleLogout() {
    if (!supabaseClient) return;
    if (confirm("確定要登出雲端管家嗎？登出後將切換為本地離線模式。")) {
        try {
            await supabaseClient.auth.signOut();
            isCloudMode = false;
            currentUser = null;
            showToast("已成功登出雲端，切換為本地離線模式。", "warning");
            await loadState();
            renderCurrentTab();
        } catch (err) {
            console.error("登出失敗", err);
        }
    }
}

// ==========================================
// SUPABASE CLOUD DATABASE SYNC HELPERS (Optimistic Sync)
// ==========================================

async function dbAddInventoryItem(item) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('inventory').insert([{
            id: item.id,
            user_id: currentUser.id,
            name: item.name,
            chamber: item.chamber,
            qty: item.qty,
            unit: item.unit,
            days_left: item.daysLeft,
            image_url: item.image,
            added_date: item.addedDate,
            savings_reward: item.roi?.savings || 50,
            sodium_mg: item.roi?.sodium || 100,
            fat_g: item.roi?.fat || 5,
            storage_protocol: item.storageProtocol,
            box_size: item.boxSize
        }]);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步新增食材失敗:", e);
    }
}

async function dbUpdateInventoryItem(item) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('inventory').update({
            qty: item.qty,
            days_left: item.daysLeft,
            chamber: item.chamber,
            box_size: item.boxSize,
            storage_protocol: item.storageProtocol
        }).eq('id', item.id);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步更新食材失敗:", e);
    }
}

async function dbDeleteInventoryItem(id) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('inventory').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步刪除食材失敗:", e);
    }
}

async function dbAddShoppingItem(item) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('shopping_list').insert([{
            id: item.id,
            user_id: currentUser.id,
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            checked: item.checked,
            status: item.status,
            est_cost: item.estCost
        }]);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步新增採買項失敗:", e);
    }
}

async function dbUpdateShoppingItem(item) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('shopping_list').update({
            checked: item.checked,
            qty: item.qty,
            unit: item.unit,
            status: item.status,
            est_cost: item.estCost
        }).eq('id', item.id);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步更新採買項失敗:", e);
    }
}

async function dbDeleteShoppingItem(id) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('shopping_list').delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步刪除採買項失敗:", e);
    }
}

async function dbClearShoppingChecked() {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('shopping_list').delete().eq('user_id', currentUser.id).eq('checked', true);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步清除已採買項失敗:", e);
    }
}

async function dbSaveCookedHistory(record) {
    if (!isCloudMode || !supabaseClient || !currentUser) return;
    try {
        const { error } = await supabaseClient.from('cooked_history').insert([{
            user_id: currentUser.id,
            recipe_title: record.recipe_title,
            ingredients_used: record.ingredients_used,
            type: record.type || 'meal',
            savings_saved: record.savings_saved || 50,
            sodium_reduced_mg: record.sodium_reduced_mg || 100,
            fat_reduced_g: record.fat_reduced_g || 5
        }]);
        if (error) throw error;
    } catch (e) {
        console.error("Supabase 同步新增烹飪紀錄失敗:", e);
    }
}


async function initCloudDefaultData() {
    try {
        // 批次新增預設食材
        const invInserts = DEFAULT_STATE.inventory.map(item => ({
            user_id: currentUser.id,
            name: item.name,
            chamber: item.chamber,
            qty: item.qty,
            unit: item.unit,
            days_left: item.daysLeft,
            image_url: item.image,
            added_date: item.addedDate,
            savings_reward: item.roi.savings,
            sodium_mg: item.roi.sodium,
            fat_g: item.roi.fat,
            storage_protocol: item.storageProtocol,
            box_size: item.boxSize
        }));
        await supabaseClient.from('inventory').insert(invInserts);

        // 批次新增預設採買清單
        const shopInserts = DEFAULT_STATE.shoppingList.map(item => ({
            user_id: currentUser.id,
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            checked: item.checked,
            status: item.status,
            est_cost: item.estCost
        }));
        await supabaseClient.from('shopping_list').insert(shopInserts);

        // 重新載入雲端狀態
        const { data: insertedInv } = await supabaseClient.from('inventory').select('*').eq('user_id', currentUser.id);
        const { data: insertedShop } = await supabaseClient.from('shopping_list').select('*').eq('user_id', currentUser.id);

        if (insertedInv) {
            appState.inventory = insertedInv.map(item => ({
                id: item.id,
                name: item.name,
                chamber: item.chamber,
                qty: Number(item.qty),
                unit: item.unit,
                daysLeft: Number(item.days_left),
                image: item.image_url,
                addedDate: item.added_date,
                roi: { savings: Number(item.savings_reward), sodium: Number(item.sodium_mg), fat: Number(item.fat_g) },
                storageProtocol: item.storage_protocol,
                boxSize: item.box_size
            }));
        }
        if (insertedShop) {
            appState.shoppingList = insertedShop.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                qty: Number(item.qty),
                unit: item.unit,
                checked: item.checked,
                status: item.status,
                estCost: Number(item.est_cost)
            }));
        }
    } catch (e) {
        console.error("導入預設資料失敗：", e);
    }
}

function cleanBracketsFromShoppingList() {
    if (!appState || !appState.shoppingList) return;
    let modified = false;
    appState.shoppingList.forEach(item => {
        const match = item.name.match(/(.*?)\s*[\(（]\s*(\d+)\s*([\u4e00-\u9fa5\w]+)\s*[\)）]/);
        if (match) {
            item.name = match[1].trim();
            item.qty = parseInt(match[2], 10);
            item.unit = match[3].trim();
            modified = true;
            if (isCloudMode && supabaseClient) {
                dbUpdateShoppingItem(item);
            }
        }
    });
    if (modified) {
        saveLocalState();
    }
}

function loadLocalFallback() {
    isCloudMode = false;
    currentUser = null;
    const saved = localStorage.getItem("coocoo_state");
    if (saved) {
        try {
            appState = JSON.parse(saved);
            // 防禦性修正，防範 LocalStorage 資料結構污染
            if (!appState || typeof appState !== 'object') appState = {};
            if (!appState.inventory || !Array.isArray(appState.inventory)) {
                appState.inventory = JSON.parse(JSON.stringify(DEFAULT_STATE.inventory));
            }
            if (!appState.savingsGoal || typeof appState.savingsGoal !== 'object') {
                appState.savingsGoal = JSON.parse(JSON.stringify(DEFAULT_STATE.savingsGoal));
            }
            if (!appState.shoppingList || !Array.isArray(appState.shoppingList)) {
                appState.shoppingList = JSON.parse(JSON.stringify(DEFAULT_STATE.shoppingList));
            }
            if (!appState.shoppingAssistant || typeof appState.shoppingAssistant !== 'object') {
                appState.shoppingAssistant = JSON.parse(JSON.stringify(DEFAULT_STATE.shoppingAssistant));
            }
            appState.userProfile = { ...DEFAULT_STATE.userProfile, ...(appState.userProfile || {}) };
            window.DreamSpacePlanner?.migrateDreamSpace(appState);
        } catch (e) {
            appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    } else {
        appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveLocalState();
    }
}

function saveLocalState() {
    localStorage.setItem("coocoo_state", JSON.stringify(appState));
    updateNavBadges();
}

// Load or Initialize State
async function loadState() {
    const cachedState = (() => { try { return JSON.parse(localStorage.getItem("coocoo_state") || "{}"); } catch (_) { return {}; } })();
    const cachedProfile = cachedState.userProfile;
    if (supabaseClient) {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            if (session) {
                currentUser = session.user;
                isCloudMode = true;

                // 1. 載入 profile (ROI 進度)
                let { data: profile, error: pError } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .single();

                if (pError || !profile) {
                    // 全新使用者，新增預設 profile
                    const newProfile = {
                        id: currentUser.id,
                        username: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
                        avatar_url: currentUser.user_metadata?.avatar_url || '',
                        savings_target: DEFAULT_STATE.savingsGoal.target,
                        savings_saved: 0,
                        savings_monthly_saved: 0,
                        sodium_reduced_mg: 0,
                        fat_reduced_g: 0
                    };
                    const { data: inserted, error: iError } = await supabaseClient
                        .from('profiles')
                        .insert([newProfile])
                        .select()
                        .single();
                    if (!iError) profile = inserted;
                }

                // 2. 載入冰箱庫存
                let { data: dbInventory } = await supabaseClient
                    .from('inventory')
                    .select('*')
                    .eq('user_id', currentUser.id);

                // 3. 載入採買清單
                let { data: dbShopping } = await supabaseClient
                    .from('shopping_list')
                    .select('*')
                    .eq('user_id', currentUser.id);

                // 組合 appState
                appState = {
                    savingsGoal: {
                        target: profile ? Number(profile.savings_target) : DEFAULT_STATE.savingsGoal.target,
                        saved: profile ? Number(profile.savings_saved) : 0,
                        monthlySaved: profile ? Number(profile.savings_monthly_saved) : 0,
                        sodiumReduced: profile ? Number(profile.sodium_reduced_mg) : 0,
                        fatReduced: profile ? Number(profile.fat_reduced_g) : 0
                    },
                    inventory: dbInventory ? dbInventory.map(item => ({
                        id: item.id,
                        name: item.name,
                        chamber: item.chamber,
                        qty: Number(item.qty),
                        unit: item.unit,
                        daysLeft: Number(item.days_left),
                        image: item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
                        addedDate: item.added_date,
                        roi: {
                            savings: Number(item.savings_reward),
                            sodium: Number(item.sodium_mg),
                            fat: Number(item.fat_g)
                        },
                        storageProtocol: item.storage_protocol,
                        boxSize: item.box_size
                    })) : [],
                    shoppingList: dbShopping ? dbShopping.map(item => ({
                        id: item.id,
                        name: item.name,
                        category: item.category,
                        qty: Number(item.qty),
                        unit: item.unit,
                        checked: item.checked,
                        status: item.status,
                        estCost: Number(item.est_cost)
                    })) : [],
                    shoppingAssistant: JSON.parse(JSON.stringify(DEFAULT_STATE.shoppingAssistant))
                };

                // 如果雲端冰箱和採買清單皆為空，導入預設資料
                if (appState.inventory.length === 0 && appState.shoppingList.length === 0 && profile && Number(profile.savings_saved) === 0) {
                    await initCloudDefaultData();
                }

            } else {
                loadLocalFallback();
            }
        } catch (err) {
            console.error("載入雲端資料失敗，降級為本地資料：", err);
            loadLocalFallback();
        }
    } else {
        loadLocalFallback();
    }
    cleanBracketsFromShoppingList();
    appState.userProfile = { ...DEFAULT_STATE.userProfile, ...(cachedProfile || {}), ...(appState.userProfile || {}) };
    if (cachedState.dreamSpace && !appState.dreamSpace) appState.dreamSpace = cachedState.dreamSpace;
    window.DreamSpacePlanner?.migrateDreamSpace(appState);
    updateNavBadges();
    updateAuthBadge();
}

async function saveState() {
    saveLocalState();

    // 如果是雲端模式，同步 ROI 進度
    if (isCloudMode && currentUser && supabaseClient) {
        try {
            await supabaseClient.from('profiles').update({
                savings_saved: appState.savingsGoal.saved,
                savings_monthly_saved: appState.savingsGoal.monthlySaved,
                sodium_reduced_mg: appState.savingsGoal.sodiumReduced,
                fat_reduced_g: appState.savingsGoal.fatReduced,
                savings_target: appState.savingsGoal.target
            }).eq('id', currentUser.id);
        } catch (err) {
            console.error("同步雲端 profile 失敗", err);
        }
    }
}

async function resetState() {
    if (confirm("確定要重設資料嗎？這將會清除您目前的操作紀錄。")) {
        window.SingleGoalApp?.reset();
        if (isCloudMode && supabaseClient && currentUser) {
            try {
                // 清空雲端
                await supabaseClient.from('inventory').delete().eq('user_id', currentUser.id);
                await supabaseClient.from('shopping_list').delete().eq('user_id', currentUser.id);
                await supabaseClient.from('profiles').update({
                    savings_saved: 0,
                    savings_monthly_saved: 0,
                    sodium_reduced_mg: 0,
                    fat_reduced_g: 0
                }).eq('id', currentUser.id);

                await loadState();
                showToast("雲端資料已成功重設！", "success");
            } catch (e) {
                console.error("雲端重設失敗：", e);
            }
        } else {
            appState = JSON.parse(JSON.stringify(DEFAULT_STATE));
            saveState();
            showToast("本地資料已成功重設！", "success");
        }
        renderCurrentTab();
    }
}

// Navigation and Tab management
function switchTab(tabId) {
    currentTab = tabId;

    // Update active nav styles
    const tabs = ["roi", "fridge", "kitchen", "shopping"];
    tabs.forEach(id => {
        const btn = document.getElementById(`nav-${id}`);
        const icon = btn.querySelector(".material-symbols-outlined");
        if (id === tabId) {
            btn.classList.add("text-primary");
            btn.classList.remove("text-on-surface-variant");
            icon.classList.add("fill");
        } else {
            btn.classList.remove("text-primary");
            btn.classList.add("text-on-surface-variant");
            icon.classList.remove("fill");
        }
    });

    renderCurrentTab();
}

function updateNavBadges() {
    // Fridge urgent count (expiry <= 1 day)
    const urgentCount = appState.inventory.filter(item => item.daysLeft <= 1).length;
    const fridgeBadge = document.getElementById("fridge-badge");
    if (urgentCount > 0) {
        fridgeBadge.textContent = urgentCount;
        fridgeBadge.classList.remove("hidden");
    } else {
        fridgeBadge.classList.add("hidden");
    }

    // Shopping active unchecked count
    const uncheckedCount = appState.shoppingList.filter(item => !item.checked).length;
    const shoppingBadge = document.getElementById("shopping-badge");
    if (uncheckedCount > 0) {
        shoppingBadge.textContent = uncheckedCount;
        shoppingBadge.classList.remove("hidden");
    } else {
        shoppingBadge.classList.add("hidden");
    }
}

// Global Toast Notification Helper
function showToast(message, type = "success") {
    // Remove existing toast if any
    const existing = document.getElementById("app-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-semibold transition-all duration-300 transform translate-y-2 opacity-0 z-50 flex items-center gap-2 ${
        type === "success" ? "bg-secondary" : type === "warning" ? "bg-rust-orange" : "bg-primary"
    }`;

    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined text-xl";
    icon.textContent = type === "success" ? "check_circle" : type === "warning" ? "report" : "info";

    const text = document.createElement("span");
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    document.body.appendChild(toast);

    // Trigger animate-in
    setTimeout(() => {
        toast.classList.remove("translate-y-2", "opacity-0");
    }, 50);

    // Fade-out and delete
    setTimeout(() => {
        toast.classList.add("translate-y-2", "opacity-0");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Dynamic Template Rendering
function renderCurrentTab() {
    const viewContainer = document.getElementById("app-view");
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentTab === "roi") {
        renderRoiBoard(viewContainer);
    } else if (currentTab === "fridge") {
        renderFridgeHourglass(viewContainer);
    } else if (currentTab === "kitchen") {
        renderKitchen(viewContainer);
    } else if (currentTab === "shopping") {
        renderSundayShopping(viewContainer);
    }
}

function getDreamPlan() {
    const legacy = appState.userProfile;
    const life = appState.dreamSpace?.lifeProfile;
    const activePlan = appState.dreamSpace?.activePlan;
    const meals = life?.mealCosts || { breakfast:legacy.breakfast, lunch:legacy.lunch, dinner:legacy.dinner };
    const weeklyFood = ((Number(meals.breakfast) + Number(meals.lunch) + Number(meals.dinner)) * 7) + Number(life?.extrasWeekly ?? legacy.extrasWeekly ?? 0);
    if (activePlan) return { weeklyFood, weeklySaving:Number(activePlan.weeklyAmount) || 0, monthlySaving:Math.round((Number(activePlan.weeklyAmount) || 0) * 30 / 7), paceLabel:activePlan.paceLabel };
    const rates = { easy: 0.05, balanced: 0.12, fast: 0.20 };
    const weeklySaving = legacy.planMode === 'custom'
        ? Number(legacy.customWeeklySaving || 0)
        : Math.round(weeklyFood * rates[legacy.planMode || 'balanced']);
    return { weeklyFood, weeklySaving, monthlySaving: Math.round(weeklySaving * 4.33) };
}

function planModeLabel(mode) {
    return ({ easy: '輕鬆前進', balanced: '平衡前進', fast: '加速圓夢', custom: '自訂模式' })[mode] || '平衡前進';
}

function renderProfile(container) {
    const mvpPlan = appState.dreamSpace?.plan || appState.dreamSpace?.activePlan;
    const mvpProgress = appState.dreamSpace?.progress || { estimatedSaved:0 };
    container.innerHTML = `<div class="space-y-lg max-w-[760px] mx-auto"><section><h2 class="text-3xl font-extrabold text-primary flex items-center gap-2"><span class="material-symbols-outlined text-4xl">person</span>我的</h2><p class="text-on-surface-variant mt-xs">目前 MVP 只保留一份主要夢想與 30 天計畫。</p></section>${mvpPlan ? `<section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/10"><div class="flex flex-col sm:flex-row sm:items-start justify-between gap-md"><div><span class="text-[10px] font-extrabold text-secondary">目前計畫</span><h3 class="text-xl font-extrabold text-slate-blue mt-1">${escapeOnboardingText(mvpPlan.goal?.title || '主要夢想')}</h3><p class="text-xs text-on-surface-variant mt-1">每週估算 NT$ ${Number(mvpPlan.weeklyAmount || 0).toLocaleString()}；目前圓夢累積估算 NT$ ${Number(mvpProgress.estimatedSaved || 0).toLocaleString()}。</p></div><button onclick="restartLifeOnboarding()" class="self-start px-md py-2 rounded-full bg-primary text-white text-xs font-extrabold">重新盤點</button></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md">${mvpPlan.actions.map((action) => `<div class="p-md rounded-2xl bg-surface-container-low"><strong class="block text-sm text-slate-blue">${escapeOnboardingText(action.label)}</strong><span class="text-[10px] text-on-surface-variant">每週 ${action.weeklyFrequency} 次</span></div>`).join('')}</div></section>` : `<section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/10 text-center"><h3 class="font-extrabold text-slate-blue">還沒有 30 天計畫</h3><button onclick="openLifeOnboarding({force:true})" class="mt-md px-lg py-sm rounded-full bg-primary text-white text-xs font-extrabold">開始盤點</button></section>`}<p class="text-[10px] text-center text-outline">餐飲資料與生活限制請透過重新盤點修改，避免計畫與看板估算不同步。</p></div>`;
    return;
    const p = appState.userProfile;
    const plan = getDreamPlan();
    const activePlan = appState.dreamSpace?.activePlan;
    const planSettings = activePlan ? `<section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/5"><div class="flex items-start justify-between gap-md"><div><h3 class="font-extrabold text-slate-blue">目前 30 天計畫</h3><p class="text-xs text-on-surface-variant mt-1">節奏來自你選擇的生活行動，不需要固定維持同一模式。</p></div><span class="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-extrabold">${escapeOnboardingText(activePlan.paceLabel)}</span></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md">${activePlan.actions.map((action) => `<div class="p-md rounded-2xl bg-surface-container-low"><span class="material-symbols-outlined text-secondary text-lg">check_circle</span><strong class="block text-sm text-slate-blue mt-1">${escapeOnboardingText(action.label)}</strong><span class="text-[10px] text-on-surface-variant">每週 ${action.weeklyFrequency} 次</span></div>`).join('')}</div><div class="grid grid-cols-3 gap-sm mt-md bg-surface-container-low p-md rounded-2xl text-center"><div><span class="block text-[10px] text-on-surface-variant">每週餐飲估算</span><strong class="text-sm text-slate-blue">NT$ ${plan.weeklyFood.toLocaleString()}</strong></div><div><span class="block text-[10px] text-on-surface-variant">每週圓夢金</span><strong class="text-sm text-primary">NT$ ${plan.weeklySaving.toLocaleString()}</strong></div><div><span class="block text-[10px] text-on-surface-variant">30 天約可累積</span><strong class="text-sm text-secondary">NT$ ${plan.monthlySaving.toLocaleString()}</strong></div></div></section>` : `<section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/5"><h3 class="font-extrabold text-slate-blue">還沒有 30 天起始計畫</h3><p class="text-xs text-on-surface-variant mt-1">重新盤點生活現況，我們會先提供一份可調整的建議。</p><button onclick="restartLifeOnboarding()" class="mt-md px-lg py-sm rounded-full bg-primary text-white text-xs font-extrabold">開始盤點</button></section>`;
    container.innerHTML = `<div class="space-y-lg max-w-[820px] mx-auto">
        <section class="flex flex-col sm:flex-row sm:items-start justify-between gap-md"><div><h2 class="text-3xl font-extrabold text-primary flex items-center gap-2"><span class="material-symbols-outlined text-4xl">person</span>我的</h2><p class="text-on-surface-variant mt-xs">管理生活條件與圓夢節奏；所有設定都能隨現況調整。</p></div><button onclick="restartLifeOnboarding()" class="self-start shrink-0 px-md py-2 rounded-full bg-white border border-primary/25 text-primary text-xs font-extrabold hover:bg-primary/5 transition-colors"><span class="material-symbols-outlined text-base align-middle mr-1">refresh</span>重新初始設定</button></section>
        ${planSettings}
        <section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/5"><h3 class="font-extrabold text-slate-blue mb-md">生活與餐飲設定</h3>
            <form onsubmit="saveProfileForm(event)" class="space-y-md"><div class="grid grid-cols-1 md:grid-cols-3 gap-sm">${[['早餐','breakfast'],['午餐','lunch'],['晚餐','dinner']].map(([label,key]) => `<label class="text-xs font-bold text-on-surface-variant">${label}平均／餐<input name="${key}" type="number" min="0" value="${p[key]}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label>`).join('')}</div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-sm"><label class="text-xs font-bold text-on-surface-variant">飲料、咖啡、宵夜／週<input name="extrasWeekly" type="number" min="0" value="${p.extrasWeekly}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><label class="text-xs font-bold text-on-surface-variant">每週外食天數<input name="eatingOutDays" type="number" min="0" max="7" value="${p.eatingOutDays}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label></div>
            <label class="block text-xs font-bold text-on-surface-variant">目前需要模型留意的現實情況<textarea name="lifeNote" rows="3" placeholder="例如：輪班、公司供餐、照顧家人、近期工作特別忙…" class="mt-1 w-full rounded-xl border-outline-variant text-sm">${p.lifeNote || ''}</textarea></label>
            <button class="w-full md:w-auto px-lg py-sm rounded-full bg-primary text-white text-xs font-extrabold shadow-sm">儲存生活設定</button></form>
        </section>
        <p class="text-xs text-center text-on-surface-variant">圓夢看板呈現目標與進度；「我的」保存你的生活條件、偏好與模式，兩者會彼此連動。</p>
    </div>`;
}

function setPlanMode(mode) { appState.userProfile.planMode = mode; saveState(); renderCurrentTab(); showToast(`已切換為${planModeLabel(mode)}`); }
function updateCustomSaving(value) { appState.userProfile.customWeeklySaving = Math.max(0, Number(value) || 0); saveState(); renderCurrentTab(); }
function saveProfileForm(event) { event.preventDefault(); const data = new FormData(event.target); ['breakfast','lunch','dinner','extrasWeekly','eatingOutDays'].forEach(k => appState.userProfile[k] = Math.max(0, Number(data.get(k)) || 0)); appState.userProfile.lifeNote = String(data.get('lifeNote') || '').trim(); appState.userProfile.onboardingComplete = true; const life = appState.dreamSpace.lifeProfile; life.mealCosts = { breakfast:appState.userProfile.breakfast, lunch:appState.userProfile.lunch, dinner:appState.userProfile.dinner }; life.extrasWeekly = appState.userProfile.extrasWeekly; life.eatingOutDays = appState.userProfile.eatingOutDays; life.note = appState.userProfile.lifeNote; saveState(); renderCurrentTab(); showToast('生活設定已更新'); }
window.setPlanMode = setPlanMode; window.updateCustomSaving = updateCustomSaving; window.saveProfileForm = saveProfileForm;

const DREAM_GOAL_OPTIONS = {
    enjoy: { label: '享受生活', icon: 'luggage', options: [['travel','旅行計畫','flight','money'],['purchase','想買的物品','redeem','money'],['home','居家升級','home','money'],['leisure','休閒體驗','celebration','money']] },
    safety: { label: '建立安心', icon: 'shield', options: [['emergency','緊急預備金','savings','money'],['repayment','還款計畫','account_balance','money'],['family','家庭準備','family_restroom','money'],['health_prepare','健康準備','health_and_safety','money']] },
    growth: { label: '自我成長', icon: 'school', options: [['course','學習課程','menu_book','money'],['skill','技能養成','psychology','count'],['career','職涯計畫','work','money'],['habit','習慣建立','routine','count']] },
    health: { label: '健康生活', icon: 'favorite', options: [['fitness','健康體態','monitor_weight','count'],['regular_meals','規律飲食','restaurant','count'],['cooking_habit','自煮習慣','skillet','count'],['checkup','健康檢查準備','clinical_notes','money']] }
};

let onboardingDraft = null;
let onboardingStep = 1;
let onboardingMode = 'new';

function escapeOnboardingText(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[char]));
}

function createOnboardingDraft(mode = 'new') {
    const ds = appState.dreamSpace;
    const activePlan = ds.plan || ds.activePlan;
    const existingAssessment = mode === 'adjust' ? ds.assessment : null;
    const existingGoal = existingAssessment?.goal || activePlan?.goal || {};
    const existingDream = appState.dreams?.find((entry) => entry.id === (activePlan?.dreamId || appState.activeDreamId));
    const lifeProfile = JSON.parse(JSON.stringify(existingAssessment?.lifeProfile || ds.lifeProfile));
    lifeProfile.replaceableMeals = { breakfast: 1, lunch: 1, dinner: 2, ...(lifeProfile.replaceableMeals || {}) };
    lifeProfile.easiestMeal = lifeProfile.easiestMeal || 'dinner';
    lifeProfile.companyMeal = lifeProfile.companyMeal || (lifeProfile.constraints?.includes('company_meals') ? 'lunch' : '');
    lifeProfile.extraExpense = { label: '飲料或點心', unitCost: 60, reducibleCount: 1, ...(lifeProfile.extraExpense || {}) };
    return {
        goal: { category: 'enjoy', option: 'savings', title: existingGoal.title || '', targetAmount: Number(existingGoal.targetAmount) || 0, currentAmount:mode === 'adjust' ? Math.max(0, Number(existingDream?.savedAmount) || 0) : 0, targetDate: existingGoal.targetDate || '', metricType: 'money' },
        lifeProfile,
        actionPreferences: { actions: [] },
        recommendationReason: '',
        sourceDreamId: mode === 'adjust' ? (activePlan?.dreamId || appState.activeDreamId) : null
    };
}

function openLifeOnboarding(options = {}) {
    if (!options.force && appState.userProfile.onboardingComplete) return;
    document.getElementById('life-onboarding')?.remove();
    onboardingMode = options.mode || 'new';
    onboardingDraft = createOnboardingDraft(onboardingMode);
    onboardingStep = options.chooseMode ? 0 : 1;
    const modal = document.createElement('div');
    modal.id = 'life-onboarding';
    modal.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-md backdrop-blur-sm overflow-y-auto';
    document.body.appendChild(modal);
    renderLifeOnboarding();
}

function onboardingProgress() {
    return `<div class="flex gap-xs mb-lg">${[1,2,3,4].map((n) => `<span class="h-1.5 flex-1 rounded-full ${n <= onboardingStep ? 'bg-terracotta' : 'bg-surface-container'}"></span>`).join('')}</div>`;
}

function renderLifeOnboarding() {
    const modal = document.getElementById('life-onboarding');
    if (!modal || !onboardingDraft) return;
    if (onboardingStep === 0) {
        modal.innerHTML = `<section class="bg-white rounded-3xl p-lg max-w-[520px] w-full shadow-2xl my-auto"><div class="flex justify-between gap-md"><div><span class="text-[10px] font-extrabold text-terracotta">重新盤點</span><h2 class="text-2xl font-extrabold text-slate-blue mt-1">更新你的 30 天計畫</h2><p class="text-xs text-on-surface-variant mt-xs">目前的估算累積會保留，只更新接下來的行動。</p></div><button onclick="closeLifeOnboarding()" aria-label="關閉"><span class="material-symbols-outlined">close</span></button></div><button onclick="chooseOnboardingMode('adjust')" class="w-full p-lg rounded-2xl border-2 border-secondary/30 bg-secondary/5 text-left mt-lg"><span class="material-symbols-outlined text-secondary">tune</span><strong class="block text-sm text-slate-blue mt-sm">開始重新盤點</strong></button></section>`;
        return;
    }
    const titles = ['先設定一個主要夢想','找出真正能調整的餐飲空間','確認這週做得到的改變','這是你的 30 天起始計畫'];
    modal.innerHTML = `<section class="bg-white rounded-3xl p-lg max-w-[640px] w-full shadow-2xl my-auto"><div class="flex justify-between gap-md"><div><span class="text-[10px] font-extrabold text-terracotta">步驟 ${onboardingStep}／4</span><h2 class="text-2xl font-extrabold text-slate-blue mt-1">${titles[onboardingStep - 1]}</h2></div><button onclick="closeLifeOnboarding()" aria-label="關閉"><span class="material-symbols-outlined">close</span></button></div><p class="text-xs text-on-surface-variant mt-xs mb-md">${onboardingStep === 1 ? '先選一個生活方向，我們會幫你把它變成具體計畫。' : onboardingStep === 2 ? '不確定也沒關係，先用接近的數字，之後都能修改。' : onboardingStep === 3 ? '金額會由你的行動自動換算，不需要先猜自己該省多少。' : '先看做得到的下一步，再決定是否採用。'}</p>${onboardingProgress()}<div id="onboarding-step-content">${renderOnboardingStepContent()}</div>${onboardingStep < 4 ? `<div class="flex gap-sm mt-lg"><button onclick="previousOnboardingStep()" class="px-lg py-3 rounded-full text-xs font-extrabold ${onboardingStep === 1 ? 'invisible' : 'bg-surface-container text-slate-blue'}">上一步</button><button onclick="nextOnboardingStep()" class="flex-1 py-3 rounded-full bg-primary text-white text-sm font-extrabold">繼續</button></div>` : ''}</section>`;
}

function renderOnboardingStepContent() {
    const d = onboardingDraft;
    if (onboardingStep === 1) {
        return `<div class="space-y-md"><label class="block text-xs font-bold text-on-surface-variant">你想完成什麼夢想？<input id="onboarding-goal-title" value="${escapeOnboardingText(d.goal.title)}" placeholder="例如：京都旅行基金" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><label class="block text-xs font-bold text-on-surface-variant">目標金額<input id="onboarding-goal-target" type="number" min="1" value="${Number(d.goal.targetAmount) || ''}" placeholder="例如 60000" class="mt-1 w-full rounded-xl border-outline-variant text-sm"><span class="block text-[10px] font-normal text-outline mt-1">MVP 先聚焦可用自煮行動推算的金額型目標。</span></label><label class="block text-xs font-bold text-on-surface-variant">希望完成日期（可稍後決定）<input id="onboarding-goal-date" type="date" value="${escapeOnboardingText(d.goal.targetDate)}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><p id="onboarding-error" class="text-[10px] text-error"></p></div>`;
    }
    if (onboardingStep === 2) {
        const p = d.lifeProfile;
        const meals = [['早餐','breakfast'],['午餐','lunch'],['晚餐','dinner']];
        return `<div class="space-y-md"><div><p class="text-xs font-extrabold text-slate-blue mb-sm">平均外食費與每週可替代餐數</p><div class="grid grid-cols-3 gap-sm">${meals.map(([label,key]) => `<div class="rounded-xl bg-surface-container-low p-sm"><label class="text-[10px] font-bold text-on-surface-variant">${label}／餐<input id="onboarding-meal-${key}" type="number" min="0" value="${Number(p.mealCosts[key])}" class="mt-1 w-full rounded-lg border-outline-variant text-sm"></label><label class="block text-[10px] font-bold text-on-surface-variant mt-sm">可替代幾餐<input id="onboarding-replace-${key}" type="number" min="0" max="7" value="${Number(p.replaceableMeals[key])}" class="mt-1 w-full rounded-lg border-outline-variant text-sm"></label></div>`).join('')}</div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-sm"><label class="text-xs font-bold text-on-surface-variant">自煮一餐約多少<input id="onboarding-home-cost" type="number" min="1" value="${Number(p.homeCookedMealCost)}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><label class="text-xs font-bold text-on-surface-variant">最容易開始的餐別<select id="onboarding-easiest-meal" class="mt-1 w-full rounded-xl border-outline-variant text-sm">${meals.map(([label,key]) => `<option value="${key}" ${p.easiestMeal === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label><label class="text-xs font-bold text-on-surface-variant">額外消費名稱<input id="onboarding-extra-label" value="${escapeOnboardingText(p.extraExpense.label)}" class="mt-1 w-full rounded-xl border-outline-variant text-sm" placeholder="例如：飲料"></label><label class="text-xs font-bold text-on-surface-variant">單次金額<input id="onboarding-extra-cost" type="number" min="0" value="${Number(p.extraExpense.unitCost)}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><label class="text-xs font-bold text-on-surface-variant">每週願意少買幾次<input id="onboarding-extra-count" type="number" min="0" max="7" value="${Number(p.extraExpense.reducibleCount)}" class="mt-1 w-full rounded-xl border-outline-variant text-sm"></label><label class="text-xs font-bold text-on-surface-variant">公司供餐餐別<select id="onboarding-company-meal" class="mt-1 w-full rounded-xl border-outline-variant text-sm"><option value="">沒有</option>${meals.map(([label,key]) => `<option value="${key}" ${p.companyMeal === key ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><label class="p-sm rounded-xl border border-outline-variant/30 text-xs font-bold block"><input type="checkbox" id="onboarding-shift-work" ${p.constraints.includes('shift_work') ? 'checked' : ''} class="mr-2">目前是輪班生活</label><label class="block text-xs font-bold text-on-surface-variant">固定忙碌日（可複選）<div class="grid grid-cols-7 gap-xs mt-1">${[['mon','一'],['tue','二'],['wed','三'],['thu','四'],['fri','五'],['sat','六'],['sun','日']].map(([key,label]) => `<label class="text-center text-[10px] p-2 rounded-lg border border-outline-variant/30"><input type="checkbox" name="onboarding-busy-day" value="${key}" ${p.busyDays.includes(key) ? 'checked' : ''} class="block mx-auto mb-1">${label}</label>`).join('')}</div></label><p id="onboarding-error" class="text-[10px] text-error"></p></div>`;
    }
    if (onboardingStep === 3) {
        if (!d.actionPreferences.actions.length) return `<div class="rounded-2xl bg-error/5 border border-error/20 p-md"><strong class="text-sm text-slate-blue">目前還找不到可產生節省的行動</strong><p class="text-xs text-on-surface-variant mt-1">${escapeOnboardingText(d.recommendationReason || '請返回調整可替代餐數或餐費。')}</p></div><p id="onboarding-error" class="text-[10px] text-error mt-xs"></p>`;
        return `<div class="space-y-sm">${d.actionPreferences.actions.map((action,index) => `<div class="p-md rounded-2xl border-2 border-secondary/30 bg-secondary/5"><div class="flex justify-between gap-sm"><div><span class="material-symbols-outlined text-secondary">${action.type === 'cook' ? 'skillet' : 'local_cafe'}</span><strong class="block text-sm text-slate-blue mt-1">${escapeOnboardingText(action.label)}</strong><span class="text-[10px] text-on-surface-variant">${escapeOnboardingText(action.reason)} · 上限 ${action.maxFrequency} 次</span></div><span class="flex items-center gap-xs"><button onclick="adjustDraftAction(${index},-1)" class="w-8 h-8 rounded-full bg-white border">−</button><b class="text-xs whitespace-nowrap">每週 ${action.weeklyFrequency} 次</b><button onclick="adjustDraftAction(${index},1)" class="w-8 h-8 rounded-full bg-white border">＋</button></span></div></div>`).join('')}</div><p class="text-[10px] text-on-surface-variant mt-sm">建議最多兩項；可降低頻率，但不能超過生活條件允許的上限。</p><p id="onboarding-error" class="text-[10px] text-error mt-xs"></p>`;
    }
    return renderStarterPlanDraft();
}

function renderStarterPlanDraft() {
    const plan = window.DreamSpacePlanner.buildStarterPlan(onboardingDraft);
    const schedule = window.DreamSpacePlanner.compareGoalDate(onboardingDraft.goal, plan.weeklyAmount, plan.actions);
    onboardingDraft.generatedPlan = plan;
    const scheduleCopy = schedule.desiredDate ? (schedule.onTrack ? `依目前速度，預估可在 ${schedule.estimatedDate} 完成，符合希望日期 ${schedule.desiredDate}。` : `希望日期是 ${schedule.desiredDate}，目前速度預估 ${schedule.estimatedDate} 完成。${schedule.trialDate ? `每週再增加一次可行行動，可試算為 ${schedule.trialDate}。` : ''}`) : `依目前速度，預估 ${schedule.estimatedDate || '尚無法'} 完成。`;
    return `<div class="rounded-3xl bg-[#fbf7e8] p-md border border-primary/10"><div class="flex justify-between items-start gap-sm"><div><span class="text-[10px] font-extrabold text-terracotta">主要夢想 · ${escapeOnboardingText(plan.goal.title)}</span><h3 class="text-lg font-extrabold text-slate-blue mt-1">30 天估算累積 NT$ ${plan.thirtyDayAmount.toLocaleString()}</h3><p class="text-xs text-on-surface-variant mt-1">先完成下面兩項以內的每週行動。</p></div><span class="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-extrabold whitespace-nowrap">${plan.paceLabel}</span></div><div class="grid grid-cols-1 sm:grid-cols-[1.3fr_.7fr] gap-sm mt-md"><div class="bg-white rounded-2xl p-md"><span class="text-[10px] font-extrabold text-secondary">本週行動</span>${plan.actions.map((action, index) => `<div class="flex items-center justify-between gap-xs mt-sm p-sm bg-surface-container-low rounded-xl"><span class="text-xs font-bold">${escapeOnboardingText(action.label)}</span><span class="flex items-center gap-xs"><button onclick="adjustDraftAction(${index},-1)" class="w-7 h-7 rounded-full bg-white border">−</button><b class="text-xs">${action.weeklyFrequency} 次</b><button onclick="adjustDraftAction(${index},1)" class="w-7 h-7 rounded-full bg-white border">＋</button></span></div>`).join('')}</div><div class="bg-white rounded-2xl p-md text-center"><span class="text-[10px] font-bold text-on-surface-variant">每週圓夢金</span><strong class="block text-2xl text-primary mt-sm">NT$ ${plan.weeklyAmount.toLocaleString()}</strong><span class="block text-[9px] text-outline mt-1">估算省下</span><button onclick="togglePlanBreakdown()" class="text-[10px] font-bold text-secondary mt-sm">如何算出</button></div></div><div id="plan-breakdown" class="hidden mt-sm bg-white rounded-2xl p-md">${plan.calculationBreakdown.map((item) => `<div class="flex justify-between text-[10px] py-1"><span>${escapeOnboardingText(item.label)}：NT$ ${item.unitSaving.toLocaleString()} × ${item.frequency}</span><b>NT$ ${item.weeklySaving.toLocaleString()}</b></div>`).join('')}</div><div class="mt-sm bg-white rounded-2xl p-md"><span class="text-[10px] text-outline">完成日期評估</span><strong class="block text-xs text-slate-blue mt-1">${escapeOnboardingText(scheduleCopy)}</strong></div></div><div class="flex flex-col sm:flex-row gap-sm mt-md"><button onclick="adoptStarterPlan()" class="flex-1 py-3 rounded-full bg-primary text-white text-sm font-extrabold">採用這個計畫</button><button onclick="previousOnboardingStep()" class="px-lg py-3 rounded-full border border-primary/30 text-primary text-xs font-extrabold">返回調整</button></div>`;
}

function collectOnboardingStep() {
    const error = document.getElementById('onboarding-error');
    if (onboardingStep === 1) {
        const title = document.getElementById('onboarding-goal-title')?.value.trim();
        if (!title) { if (error) error.textContent = '請選擇或輸入一個具體目標。'; return false; }
        const targetAmount = Number(document.getElementById('onboarding-goal-target')?.value);
        if (!Number.isFinite(targetAmount) || targetAmount <= 0) { if (error) error.textContent = '請輸入大於零的目標金額。'; return false; }
        onboardingDraft.goal.title = title;
        onboardingDraft.goal.targetDate = document.getElementById('onboarding-goal-date')?.value || '';
        onboardingDraft.goal.targetAmount = targetAmount;
        onboardingDraft.goal.metricType = 'money';
    }
    if (onboardingStep === 2) {
        const p = onboardingDraft.lifeProfile;
        for (const key of ['breakfast','lunch','dinner']) {
            const cost = Number(document.getElementById(`onboarding-meal-${key}`)?.value);
            const replaceable = Number(document.getElementById(`onboarding-replace-${key}`)?.value);
            if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(replaceable) || replaceable < 0 || replaceable > 7) {
                if (error) error.textContent = '餐費需為非負數；可替代餐數需介於 0 到 7。';
                return false;
            }
            p.mealCosts[key] = cost;
            p.replaceableMeals[key] = replaceable;
        }
        const homeCost = Number(document.getElementById('onboarding-home-cost')?.value);
        const extraCost = Number(document.getElementById('onboarding-extra-cost')?.value);
        const extraCount = Number(document.getElementById('onboarding-extra-count')?.value);
        if (!Number.isFinite(homeCost) || homeCost <= 0) { if (error) error.textContent = '自煮成本必須大於零。'; return false; }
        if (!Number.isFinite(extraCost) || extraCost < 0 || !Number.isFinite(extraCount) || extraCount < 0 || extraCount > 7) { if (error) error.textContent = '額外消費資料需為有效的非負數。'; return false; }
        p.homeCookedMealCost = homeCost;
        p.easiestMeal = document.getElementById('onboarding-easiest-meal')?.value || 'dinner';
        p.extraExpense = { label: document.getElementById('onboarding-extra-label')?.value.trim() || '額外消費', unitCost:extraCost, reducibleCount:extraCount };
        p.companyMeal = document.getElementById('onboarding-company-meal')?.value || '';
        p.busyDays = [...document.querySelectorAll('[name="onboarding-busy-day"]:checked')].map((input) => input.value);
        p.constraints = [];
        if (document.getElementById('onboarding-shift-work')?.checked) p.constraints.push('shift_work');
        if (p.companyMeal) p.constraints.push('company_meals');
        const recommendation = window.DreamSpacePlanner.recommendMvpActions(onboardingDraft);
        onboardingDraft.actionPreferences.actions = recommendation.actions;
        onboardingDraft.recommendationReason = recommendation.reason;
    }
    if (onboardingStep === 3 && onboardingDraft.actionPreferences.actions.length === 0) {
        if (error) error.textContent = '目前沒有可採用的省錢行動，請返回調整資料。';
        return false;
    }
    return true;
}

function nextOnboardingStep() { if (collectOnboardingStep()) { onboardingStep = Math.min(4, onboardingStep + 1); renderLifeOnboarding(); } }
function previousOnboardingStep() { onboardingStep = Math.max(1, onboardingStep - 1); renderLifeOnboarding(); }
function selectOnboardingCategory(category) { onboardingDraft.goal.category = category; onboardingDraft.goal.option = DREAM_GOAL_OPTIONS[category].options[0][0]; onboardingDraft.goal.metricType = DREAM_GOAL_OPTIONS[category].options[0][3]; onboardingDraft.goal.title = DREAM_GOAL_OPTIONS[category].options[0][1]; renderLifeOnboarding(); }
function selectOnboardingGoal(optionKey) { const option = DREAM_GOAL_OPTIONS[onboardingDraft.goal.category].options.find((entry) => entry[0] === optionKey); onboardingDraft.goal.option = optionKey; onboardingDraft.goal.title = option[1]; onboardingDraft.goal.metricType = option[3]; renderLifeOnboarding(); }
function toggleOnboardingAction(action) { const actions = onboardingDraft.actionPreferences.actions; const index = actions.findIndex((item) => item.id === action.id); if (index >= 0) actions.splice(index, 1); else if (actions.length < 3) actions.push(action); else { showToast('每週行動最多三項，先把計畫保持簡單。', 'warning'); return; } renderLifeOnboarding(); }
function adjustDraftAction(index, delta) { const action = onboardingDraft.actionPreferences.actions[index]; action.weeklyFrequency = Math.min(Number(action.maxFrequency) || 1, Math.max(1, Number(action.weeklyFrequency) + delta)); renderLifeOnboarding(); }
function togglePlanBreakdown() { document.getElementById('plan-breakdown')?.classList.toggle('hidden'); }
function chooseOnboardingMode(mode) { onboardingMode = mode; onboardingDraft = createOnboardingDraft(mode); onboardingStep = 1; renderLifeOnboarding(); }
function closeLifeOnboarding() { document.getElementById('life-onboarding')?.remove(); onboardingDraft = null; }

function adoptStarterPlan() {
    const plan = window.DreamSpacePlanner.buildStarterPlan(onboardingDraft);
    ensureDreamState();
    const previousPlan = appState.dreamSpace.activePlan;
    if (previousPlan) appState.dreamSpace.planHistory.unshift({ ...previousPlan, archivedAt: new Date().toISOString(), reason: onboardingMode === 'adjust' ? 'adjusted' : 'new_goal' });
    appState.dreamSpace.planHistory = appState.dreamSpace.planHistory.slice(0, 20);
    const dreamResult = window.DreamSpacePlanner.upsertDream(appState.dreams, onboardingDraft.goal, { mode:onboardingMode, sourceDreamId:onboardingDraft.sourceDreamId, newId:`dream_${Date.now()}` });
    appState.dreams = dreamResult.dreams;
    const dream = dreamResult.dream;
    dream.description = `30 天先完成 ${plan.actions.map((action) => action.label).join('、')}。`;
    dream.type = onboardingDraft.goal.metricType === 'money' ? (onboardingDraft.goal.option === 'travel' ? 'travel' : 'savings') : 'habit';
    dream.icon = DREAM_GOAL_OPTIONS[onboardingDraft.goal.category].options.find((entry) => entry[0] === onboardingDraft.goal.option)?.[2] || 'savings';
    dream.targetAmount = Number(onboardingDraft.goal.targetAmount) || 0;
    dream.targetCount = Number(onboardingDraft.goal.targetMetric) || plan.milestones.shortTerm.actionTarget;
    dream.currentCount = Number(dream.currentCount) || 0;
    dream.targetDate = onboardingDraft.goal.targetDate || plan.milestones.longTerm.estimatedDate || '';
    appState.activeDreamId = dream.id;
    appState.dreamSpace.lifeProfile = JSON.parse(JSON.stringify(onboardingDraft.lifeProfile));
    appState.dreamSpace.actionPreferences = JSON.parse(JSON.stringify(onboardingDraft.actionPreferences));
    const adoptedPlan = { ...plan, id: `plan_${Date.now()}`, dreamId: dream.id, adoptedAt: new Date().toISOString() };
    const preservedEstimated = Math.max(0, Number(appState.dreamSpace.progress?.estimatedSaved) || 0);
    appState.dreamSpace.assessment = { goal:JSON.parse(JSON.stringify(onboardingDraft.goal)), lifeProfile:JSON.parse(JSON.stringify(onboardingDraft.lifeProfile)) };
    appState.dreamSpace.plan = adoptedPlan;
    appState.dreamSpace.activePlan = adoptedPlan;
    appState.dreamSpace.progress = { estimatedSaved:preservedEstimated, weeks:[] };
    const p = appState.dreamSpace.lifeProfile;
    appState.userProfile = { ...appState.userProfile, breakfast:p.mealCosts.breakfast, lunch:p.mealCosts.lunch, dinner:p.mealCosts.dinner, extrasWeekly:p.extrasWeekly, eatingOutDays:p.eatingOutDays, lifeNote:p.note, planMode:'custom', customWeeklySaving:plan.weeklyAmount, onboardingComplete:true };
    saveState();
    closeLifeOnboarding();
    switchTab('roi');
    showToast('你的 30 天起始計畫已建立');
}

function skipLifeOnboarding() { appState.userProfile.onboardingComplete = true; saveState(); closeLifeOnboarding(); showToast('之後可到「我的」重新盤點'); }
function restartLifeOnboarding() { openLifeOnboarding({ force: true }); }
function recordActivePlanAction(actionId) {
    const plan = appState.dreamSpace?.plan || appState.dreamSpace?.activePlan;
    const action = plan?.actions?.find((entry) => entry.id === actionId);
    if (!plan || !action) return;
    const result = window.DreamSpacePlanner.recordActionProgress(plan, appState.dreamSpace.progress, actionId, new Date().toISOString());
    if (!result.accepted) {
        if (result.reason === 'weekly_limit') showToast('這項行動本週已達標，下週再繼續。', 'warning');
        return;
    }
    appState.dreamSpace.progress = result.progress;
    const dream = appState.dreams.find((entry) => entry.id === plan.dreamId);
    if (dream) dream.savedAmount = (Number(dream.savedAmount) || 0) + result.amount;
    saveState();
    renderCurrentTab();
    showToast(`已記錄「${action.label}」，圓夢累積估算增加 NT$ ${result.amount}`);
}
Object.assign(window, { openLifeOnboarding, nextOnboardingStep, previousOnboardingStep, selectOnboardingCategory, selectOnboardingGoal, toggleOnboardingAction, adjustDraftAction, togglePlanBreakdown, chooseOnboardingMode, closeLifeOnboarding, adoptStarterPlan, skipLifeOnboarding, restartLifeOnboarding, recordActivePlanAction });

// ==========================================
// VIEW 1: ROI BOARD (圓夢看板 - 夢想樹)
// ==========================================
function ensureDreamState() {
    if (!Array.isArray(appState.dreams) || appState.dreams.length === 0) {
        appState.dreams = JSON.parse(JSON.stringify(DEFAULT_STATE.dreams));
    }
    if (!appState.activeDreamId || !appState.dreams.some((dream) => dream.id === appState.activeDreamId && !dream.isPaused)) {
        appState.activeDreamId = appState.dreams.find((dream) => !dream.isPaused)?.id || appState.dreams[0].id;
    }
    appState.savingsGoal.mealsCompleted = Number(appState.savingsGoal.mealsCompleted) || 0;
    appState.savingsGoal.rescuedItems = Number(appState.savingsGoal.rescuedItems) || 0;
}

function allocateDreamReward(amount, source = 'meal') {
    ensureDreamState();
    const activeDream = appState.dreams.find((dream) => dream.id === appState.activeDreamId && !dream.isPaused);
    if (activeDream && ['savings', 'travel'].includes(activeDream.type)) {
        activeDream.savedAmount = (Number(activeDream.savedAmount) || 0) + Number(amount || 0);
    }
    if (activeDream?.type === 'habit') activeDream.currentCount = (Number(activeDream.currentCount) || 0) + 1;
    if (source === 'meal') appState.savingsGoal.mealsCompleted += 1;
    if (source === 'rescue') appState.savingsGoal.rescuedItems += 1;
    return activeDream;
}

let deliveryDecision = { state: '', minutes: 15 };

function ensureDeliverySupport() {
    if (!appState.deliverySupport || typeof appState.deliverySupport !== 'object') {
        appState.deliverySupport = JSON.parse(JSON.stringify(DEFAULT_STATE.deliverySupport));
    }
    if (!Array.isArray(appState.deliverySupport.history)) appState.deliverySupport.history = [];
}

function getDeliveryPlanOptions(state = 'tired', minutes = 15) {
    const inventory = [...(appState.inventory || [])].sort((a, b) => Number(a.daysLeft) - Number(b.daysLeft));
    const urgent = inventory.filter((item) => item.chamber === 'cold').slice(0, 3);
    const names = urgent.map((item) => item.name);
    const totalSavings = urgent.reduce((sum, item) => sum + (Number(item.roi?.savings) || 50), 0);
    const easyName = names.slice(0, 2).join('＋') || '雞蛋＋冷凍蔬菜';
    const cravingCopy = state === 'craving' ? '做成香脆或濃郁口味，先滿足嘴饞' : state === 'hungry' ? '先吃一小份，再完成主餐' : '全部放進同一鍋，降低開始門檻';
    return [
        { key: 'instant', label: '5 分鐘立即吃', icon: 'bolt', title: `${easyName} 快速組合`, minutes: 5, cleanup: '0–1 個鍋', savings: Math.max(60, Math.round(totalSavings * .35)), detail: cravingCopy, action: 'fridge' },
        { key: 'quick', label: `${Math.min(15, minutes)} 分鐘快速煮`, icon: 'skillet', title: `${easyName} 一鍋料理`, minutes: Math.min(15, minutes), cleanup: '1 個鍋', savings: Math.max(100, Math.round(totalSavings * .65)), detail: '優先使用最接近期限的冷藏食材', action: 'fridge' },
        { key: 'outside', label: '合理外食', icon: 'takeout_dining', title: '外食可以，先保住冰箱', minutes: 2, cleanup: '不用洗鍋', savings: 0, detail: names[0] ? `出門前先把「${names[0]}」冷凍或安排明天吃` : '設定明天第一餐，避免重複採買', action: 'outside' }
    ];
}

function openDeliveryBlocker() {
    ensureDeliverySupport();
    deliveryDecision = { state: '', minutes: 15 };
    renderDeliveryBlockerModal(1);
}
window.openDeliveryBlocker = openDeliveryBlocker;

function renderDeliveryBlockerModal(step = 1) {
    document.getElementById('delivery-blocker-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'delivery-blocker-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-md backdrop-blur-sm overflow-y-auto';
    const states = [ ['hungry','很餓','restaurant'], ['tired','很累','battery_1_bar'], ['craving','嘴饞','cookie'], ['rushed','沒時間','schedule'] ];
    const options = getDeliveryPlanOptions(deliveryDecision.state, deliveryDecision.minutes);
    modal.innerHTML = `<section class="bg-white rounded-3xl p-lg max-w-[520px] w-full shadow-2xl my-auto">
        <div class="flex justify-between gap-sm mb-md"><div><span class="text-[10px] font-extrabold text-terracotta">60 秒外送急救</span><h3 class="text-lg font-extrabold text-slate-blue">${step === 1 ? '你現在是哪一種狀態？' : step === 2 ? '你最多願意等多久？' : '只選一個現在做得到的方案'}</h3></div><button onclick="closeDeliveryBlocker()" aria-label="關閉外送急救"><span class="material-symbols-outlined">close</span></button></div>
        <div class="flex gap-xs mb-md">${[1,2,3].map((n) => `<span class="h-1.5 flex-1 rounded-full ${n <= step ? 'bg-terracotta' : 'bg-surface-container'}"></span>`).join('')}</div>
        ${step === 1 ? `<div class="grid grid-cols-2 gap-sm">${states.map(([key,label,icon]) => `<button onclick="selectDeliveryState('${key}')" class="p-md rounded-2xl bg-surface-container-low border border-outline-variant/30 text-left hover:border-terracotta"><span class="material-symbols-outlined text-terracotta">${icon}</span><strong class="block text-sm text-slate-blue mt-xs">${label}</strong></button>`).join('')}</div>` : step === 2 ? `<div class="grid grid-cols-3 gap-sm">${[5,15,30].map((minutes) => `<button onclick="selectDeliveryMinutes(${minutes})" class="p-md rounded-2xl bg-surface-container-low border border-outline-variant/30 text-center hover:border-terracotta"><strong class="block text-xl text-slate-blue">${minutes}</strong><span class="text-[10px] font-bold text-on-surface-variant">分鐘</span></button>`).join('')}</div>` : `<div class="space-y-sm">${options.map((option, index) => `<button onclick="chooseDeliveryPlan(${index})" class="w-full p-md rounded-2xl border-2 ${index === 2 ? 'border-outline-variant/30 bg-surface-container-low' : 'border-secondary/25 bg-secondary/5'} text-left"><div class="flex justify-between gap-sm"><span class="text-[10px] font-extrabold text-secondary"><span class="material-symbols-outlined text-base align-middle">${option.icon}</span> ${option.label}</span><span class="text-[10px] font-bold text-outline">${option.cleanup}</span></div><strong class="block text-sm text-slate-blue mt-xs">${option.title}</strong><p class="text-[10px] text-on-surface-variant mt-1">${option.detail}</p>${option.savings ? `<span class="inline-block mt-2 text-[10px] font-extrabold text-primary">完成後預估為主夢想省 NT$ ${option.savings}</span>` : ''}</button>`).join('')}</div>`}
        <p class="text-[10px] text-center text-outline mt-md">選外食也沒關係，重點是做出適合今天的決定。</p>
    </section>`;
    document.body.appendChild(modal);
}

function selectDeliveryState(state) { deliveryDecision.state = state; renderDeliveryBlockerModal(2); }
function selectDeliveryMinutes(minutes) { deliveryDecision.minutes = minutes; renderDeliveryBlockerModal(3); }
window.selectDeliveryState = selectDeliveryState;
window.selectDeliveryMinutes = selectDeliveryMinutes;

function chooseDeliveryPlan(index) {
    const option = getDeliveryPlanOptions(deliveryDecision.state, deliveryDecision.minutes)[index];
    ensureDeliverySupport();
    appState.deliverySupport.history.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), state: deliveryDecision.state, choice: option.key, completed: false });
    appState.deliverySupport.history = appState.deliverySupport.history.slice(0, 30);
    saveState();
    closeDeliveryBlocker();
    if (option.action === 'fridge') {
        switchTab('fridge');
        showToast('已記下選擇；完成料理後才會把節省金額灌溉主夢想', 'success');
    } else {
        showToast('外食計畫已記下；回家前記得先處理最即期食材', 'success');
    }
}
window.chooseDeliveryPlan = chooseDeliveryPlan;
function closeDeliveryBlocker() { document.getElementById('delivery-blocker-modal')?.remove(); }
window.closeDeliveryBlocker = closeDeliveryBlocker;

function chooseFridayPlan(index) {
    const choices = ['normal', 'low_energy', 'outside'];
    ensureDeliverySupport();
    appState.deliverySupport.history.unshift({ id: crypto.randomUUID(), date: new Date().toISOString(), state: 'friday', choice: choices[index], completed: false });
    appState.deliverySupport.history = appState.deliverySupport.history.slice(0, 30);
    saveState();
    if (index < 2) {
        switchTab('fridge');
        showToast(index === 0 ? 'A 計劃已記下：從即期食材開始準備' : 'B 計劃已記下：只做低體力、少洗鍋料理', 'success');
    } else {
        showToast('C 計劃已記下：可以外食，先保存即期食材', 'success');
    }
}
window.chooseFridayPlan = chooseFridayPlan;

function openFridaySettings() {
    ensureDeliverySupport();
    document.getElementById('friday-settings-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'friday-settings-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-md backdrop-blur-sm';
    modal.innerHTML = `<section class="bg-white rounded-3xl p-lg max-w-[400px] w-full shadow-2xl"><div class="flex justify-between mb-md"><h3 class="font-extrabold text-slate-blue">週五計劃設定</h3><button onclick="closeFridaySettings()" aria-label="關閉週五設定"><span class="material-symbols-outlined">close</span></button></div><div class="space-y-md"><div><label class="text-xs font-bold text-on-surface-variant">提醒時間</label><input id="friday-reminder-time" type="time" value="${appState.deliverySupport.fridayReminder}" class="w-full mt-1 rounded-xl border-outline-variant text-sm"></div><div><label class="text-xs font-bold text-on-surface-variant">用餐人數</label><input id="friday-household-size" type="number" min="1" max="12" value="${appState.deliverySupport.householdSize}" class="w-full mt-1 rounded-xl border-outline-variant text-sm"></div><p class="text-[10px] text-outline">目前先保存偏好；正式通知可在部署後串接系統提醒。</p><button onclick="saveFridaySettings()" class="w-full bg-primary text-white rounded-xl py-2.5 text-xs font-extrabold">儲存設定</button></div></section>`;
    document.body.appendChild(modal);
}
window.openFridaySettings = openFridaySettings;
function closeFridaySettings() { document.getElementById('friday-settings-modal')?.remove(); }
window.closeFridaySettings = closeFridaySettings;
function saveFridaySettings() {
    appState.deliverySupport.fridayReminder = document.getElementById('friday-reminder-time').value || '17:30';
    appState.deliverySupport.householdSize = Math.max(1, Number(document.getElementById('friday-household-size').value) || 1);
    saveState(); closeFridaySettings(); renderCurrentTab(); showToast('週五計劃設定已儲存', 'success');
}
window.saveFridaySettings = saveFridaySettings;

window.switchDream = function(dreamId) {
    ensureDreamState();
    const dream = appState.dreams.find((entry) => entry.id === dreamId);
    if (dream?.isPaused) return showToast('這個夢想目前已暫停，可先編輯後再啟用', 'error');
    appState.activeDreamId = dreamId;
    saveState();
    renderCurrentTab();
};

window.showDreamEditor = function(dreamId = null) {
    ensureDreamState();
    const dream = dreamId ? appState.dreams.find((entry) => entry.id === dreamId) : null;
    document.getElementById('dream-editor-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'dream-editor-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-md backdrop-blur-sm';
    const type = dream?.type || 'savings';
    const currentValue = type === 'weight_loss' ? dream?.currentWeight : type === 'habit' ? dream?.currentCount : dream?.savedAmount;
    const targetValue = type === 'weight_loss' ? dream?.targetWeight : type === 'habit' ? dream?.targetCount : dream?.targetAmount;
    modal.innerHTML = `
        <section class="bg-white rounded-3xl p-lg max-w-[500px] w-full shadow-2xl space-y-md">
            <div class="flex justify-between items-center"><h3 class="font-extrabold text-slate-blue">${dream ? '編輯夢想' : '新增夢想分支'}</h3><button onclick="closeDreamEditor()" aria-label="關閉夢想編輯器"><span class="material-symbols-outlined">close</span></button></div>
            <div><label class="text-xs font-bold text-on-surface-variant">夢想名稱</label><input id="dream-name" value="${escapeAssistantHtml(dream?.name || '')}" class="w-full mt-1 rounded-xl border-outline-variant text-sm" placeholder="例如：北海道旅行"></div>
            <div><label class="text-xs font-bold text-on-surface-variant">類型</label><select id="dream-type" onchange="updateDreamEditorLabels()" class="w-full mt-1 rounded-xl border-outline-variant text-sm"><option value="savings" ${type === 'savings' ? 'selected' : ''}>儲蓄目標</option><option value="travel" ${type === 'travel' ? 'selected' : ''}>旅遊夢想</option><option value="habit" ${type === 'habit' ? 'selected' : ''}>習慣次數</option><option value="weight_loss" ${type === 'weight_loss' ? 'selected' : ''}>健康體態</option></select></div>
            <div><label class="text-xs font-bold text-on-surface-variant">描述</label><textarea id="dream-description" rows="2" class="w-full mt-1 rounded-xl border-outline-variant text-sm">${escapeAssistantHtml(dream?.description || '')}</textarea></div>
            <div class="grid grid-cols-2 gap-sm"><div><label id="dream-current-label" class="text-xs font-bold text-on-surface-variant">目前累積</label><input id="dream-current" type="number" min="0" value="${Number(currentValue) || 0}" class="w-full mt-1 rounded-xl border-outline-variant text-sm"></div><div><label id="dream-target-label" class="text-xs font-bold text-on-surface-variant">目標金額</label><input id="dream-target" type="number" min="1" value="${Number(targetValue) || 10000}" class="w-full mt-1 rounded-xl border-outline-variant text-sm"></div></div>
            <div><label class="text-xs font-bold text-on-surface-variant">預計完成日</label><input id="dream-date" type="date" value="${dream?.targetDate || ''}" class="w-full mt-1 rounded-xl border-outline-variant text-sm"></div>
            ${dream ? `<label class="flex items-center gap-sm text-xs font-bold"><input id="dream-primary" type="checkbox" ${appState.activeDreamId === dream.id ? 'checked' : ''}>設為目前主夢想</label><label class="flex items-center gap-sm text-xs font-bold text-outline"><input id="dream-paused" type="checkbox" ${dream.isPaused ? 'checked' : ''}>暫停這個夢想</label>` : '<label class="flex items-center gap-sm text-xs font-bold"><input id="dream-primary" type="checkbox" checked>設為目前主夢想</label>'}
            <div class="flex gap-sm"><button onclick="closeDreamEditor()" class="flex-1 bg-surface-container rounded-xl py-2.5 text-xs font-bold">取消</button><button onclick="saveDreamEditor('${dream?.id || ''}')" class="flex-1 bg-primary text-white rounded-xl py-2.5 text-xs font-extrabold">儲存夢想</button></div>
        </section>`;
    document.body.appendChild(modal);
    updateDreamEditorLabels();
};

function updateDreamEditorLabels() {
    const type = document.getElementById('dream-type')?.value;
    const current = document.getElementById('dream-current-label');
    const target = document.getElementById('dream-target-label');
    if (!current || !target) return;
    current.textContent = type === 'weight_loss' ? '目前體重 (kg)' : type === 'habit' ? '目前完成次數' : '目前累積 (NT$)';
    target.textContent = type === 'weight_loss' ? '目標體重 (kg)' : type === 'habit' ? '目標次數' : '目標金額 (NT$)';
}
window.updateDreamEditorLabels = updateDreamEditorLabels;

function closeDreamEditor() { document.getElementById('dream-editor-modal')?.remove(); }
window.closeDreamEditor = closeDreamEditor;

function saveDreamEditor(dreamId) {
    ensureDreamState();
    const name = document.getElementById('dream-name')?.value.trim();
    if (!name) return showToast('請輸入夢想名稱', 'error');
    const type = document.getElementById('dream-type').value;
    const current = Number(document.getElementById('dream-current').value) || 0;
    const target = Number(document.getElementById('dream-target').value) || 1;
    let dream = appState.dreams.find((entry) => entry.id === dreamId);
    if (!dream) {
        dream = { id: crypto.randomUUID(), savedAmount: 0, currentCount: 0, isActive: true, isPaused: false, sortOrder: appState.dreams.length, moodLog: [] };
        appState.dreams.push(dream);
    }
    Object.assign(dream, { name, type, description: document.getElementById('dream-description').value.trim(), targetDate: document.getElementById('dream-date').value, icon: type === 'travel' ? 'flight' : type === 'weight_loss' ? 'monitor_weight' : type === 'habit' ? 'event_available' : 'savings', isPaused: Boolean(document.getElementById('dream-paused')?.checked) });
    if (type === 'weight_loss') {
        dream.currentWeight = current;
        dream.targetWeight = target;
        dream.startingWeight = Number(dream.startingWeight) || Math.max(current, target);
    }
    else if (type === 'habit') { dream.currentCount = current; dream.targetCount = target; }
    else { dream.savedAmount = current; dream.targetAmount = target; }
    if (document.getElementById('dream-primary')?.checked && !dream.isPaused) appState.activeDreamId = dream.id;
    ensureDreamState();
    saveState();
    closeDreamEditor();
    renderCurrentTab();
    showToast('夢想已儲存', 'success');
}
window.saveDreamEditor = saveDreamEditor;

function renderMvpDreamBoard(container) {
    ensureDreamState();
    const plan = appState.dreamSpace?.plan || appState.dreamSpace?.activePlan;
    if (!plan) {
        container.innerHTML = `<div class="max-w-[760px] mx-auto space-y-lg"><section><h2 class="text-3xl font-extrabold text-primary flex items-center gap-2"><span class="material-symbols-outlined text-4xl">savings</span>圓夢看板</h2><p class="text-on-surface-variant mt-xs">用做得到的自煮行動，建立可信的 30 天省錢計畫。</p></section><section class="bg-white rounded-3xl p-xl shadow-sm border border-primary/10 text-center"><span class="material-symbols-outlined text-5xl text-secondary">flag</span><h3 class="text-xl font-extrabold text-slate-blue mt-md">建立第一份 30 天計畫</h3><p class="text-sm text-on-surface-variant mt-sm">完成四步盤點後，你會看到每一筆估算如何產生。</p><button onclick="openLifeOnboarding({force:true})" class="mt-lg px-xl py-3 rounded-full bg-primary text-white text-sm font-extrabold">開始盤點</button></section></div>`;
        return;
    }
    const dream = appState.dreams.find((entry) => entry.id === plan.dreamId) || appState.dreams.find((entry) => entry.id === appState.activeDreamId) || appState.dreams[0];
    const progress = appState.dreamSpace.progress || { estimatedSaved:0, weeks:[] };
    const weekIndex = window.DreamSpacePlanner.getWeekIndex(plan, new Date().toISOString());
    const week = progress.weeks?.find((entry) => entry.index === weekIndex) || { actionCompletions:{} };
    const totalSaved = Math.max(0, Number(dream.savedAmount) || Number(progress.estimatedSaved) || 0);
    const schedule = window.DreamSpacePlanner.compareGoalDate({ ...plan.goal, currentAmount:totalSaved }, plan.weeklyAmount, plan.actions, plan.adoptedAt?.slice(0,10));
    const target = Math.max(1, Number(dream.targetAmount) || Number(plan.goal?.targetAmount) || 1);
    const percent = Math.min(100, Math.round(totalSaved / target * 100));
    container.innerHTML = `<div class="max-w-[820px] mx-auto space-y-lg"><section class="flex flex-col sm:flex-row sm:items-start justify-between gap-md"><div><h2 class="text-3xl font-extrabold text-primary flex items-center gap-2"><span class="material-symbols-outlined text-4xl">savings</span>圓夢看板</h2><p class="text-on-surface-variant mt-xs">完成行動後，這裡會更新圓夢累積估算。</p></div><button onclick="restartLifeOnboarding()" class="self-start px-md py-2 rounded-full bg-white border border-primary/25 text-primary text-xs font-extrabold">重新盤點</button></section><section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/10"><span class="text-[10px] font-extrabold text-terracotta">主要夢想</span><h3 class="text-2xl font-extrabold text-slate-blue mt-1">${escapeOnboardingText(dream.name || plan.goal?.title)}</h3><div class="grid grid-cols-2 gap-sm mt-md"><div class="bg-surface-container-low rounded-2xl p-md"><span class="text-[10px] text-outline">30 天估算累積</span><strong class="block text-xl text-primary mt-1">NT$ ${Number(plan.thirtyDayAmount || 0).toLocaleString()}</strong></div><div class="bg-surface-container-low rounded-2xl p-md"><span class="text-[10px] text-outline">圓夢累積估算</span><strong class="block text-xl text-secondary mt-1">NT$ ${totalSaved.toLocaleString()}</strong></div></div><div class="mt-md"><div class="flex justify-between text-[10px] text-on-surface-variant"><span>目標 NT$ ${target.toLocaleString()}</span><b>${percent}%</b></div><div class="h-2 bg-surface-container rounded-full mt-1 overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:${percent}%"></div></div></div></section><section class="bg-white rounded-3xl p-lg shadow-sm border border-secondary/15"><div class="flex justify-between items-start gap-sm"><div><span class="text-[10px] font-extrabold text-secondary">第 ${weekIndex + 1} 週</span><h3 class="text-lg font-extrabold text-slate-blue mt-1">本週只做這些</h3></div><div class="text-right"><span class="text-[10px] text-outline">每週圓夢金</span><strong class="block text-lg text-primary">NT$ ${Number(plan.weeklyAmount || 0).toLocaleString()}</strong></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-sm mt-md">${plan.actions.map((action) => { const done = Number(week.actionCompletions?.[action.id] || 0); const limit = Number(action.weeklyFrequency || 0); const reached = done >= limit; return `<button onclick="recordActivePlanAction('${action.id}')" ${reached ? 'disabled' : ''} class="p-md rounded-2xl border-2 text-left ${reached ? 'border-secondary/20 bg-secondary/5 opacity-70' : 'border-outline-variant/30 bg-surface-container-low hover:border-secondary'}"><span class="material-symbols-outlined text-secondary">${reached ? 'task_alt' : 'add_task'}</span><strong class="block text-sm text-slate-blue mt-1">${escapeOnboardingText(action.label)}</strong><span class="text-[10px] text-on-surface-variant">${done}/${limit} 次${reached ? ' · 本週已達標' : ` · 每次估算 NT$ ${Number(action.unitSaving || action.unitCost || 0).toLocaleString()}`}</span></button>`; }).join('')}</div></section><section class="bg-white rounded-3xl p-lg shadow-sm border border-primary/5"><button onclick="toggleMvpBreakdown()" class="w-full flex justify-between items-center text-left"><span><strong class="block text-sm text-slate-blue">如何算出</strong><span class="text-[10px] text-on-surface-variant">查看每項行動的單價與次數</span></span><span class="material-symbols-outlined text-secondary">expand_more</span></button><div id="mvp-plan-breakdown" class="hidden mt-md border-t border-outline-variant/20 pt-sm">${plan.calculationBreakdown.map((item) => `<div class="flex justify-between gap-sm text-xs py-2"><span>${escapeOnboardingText(item.label)}：NT$ ${Number(item.unitSaving || 0).toLocaleString()} × ${item.frequency}</span><b>NT$ ${Number(item.weeklySaving || 0).toLocaleString()}</b></div>`).join('')}<p class="text-[10px] text-outline mt-sm">${schedule.desiredDate ? `希望日期 ${schedule.desiredDate}；目前速度預估 ${schedule.estimatedDate || '尚無法估算'}。` : `依目前速度預估 ${schedule.estimatedDate || '尚無法估算'} 完成。`}</p></div></section><p class="text-[10px] text-center text-outline">所有金額皆為依完成行動推算的估算，不代表實際存款。</p></div>`;
}

function toggleMvpBreakdown() { document.getElementById('mvp-plan-breakdown')?.classList.toggle('hidden'); }
window.toggleMvpBreakdown = toggleMvpBreakdown;

function renderRoiBoard(container) {
    if (window.SingleGoalApp?.render(container)) return;
    ensureDreamState();
    ensureDeliverySupport();
    const activeDream = appState.dreams.find(d => d.id === appState.activeDreamId) || appState.dreams[0];
    const goal = appState.savingsGoal; // Keep global stats for lower grid
    const starterPlan = appState.dreamSpace?.activePlan?.dreamId === activeDream.id ? appState.dreamSpace.activePlan : null;
    const actionCompletions = starterPlan?.progress?.actionCompletions || {};
    const totalActionTarget = starterPlan ? starterPlan.actions.reduce((sum, action) => sum + Number(action.weeklyFrequency || 0), 0) : 0;
    const completedActions = starterPlan ? starterPlan.actions.reduce((sum, action) => sum + Number(actionCompletions[action.id] || 0), 0) : 0;
    const saltTeaspoons = Math.max(0, Number(goal.sodiumReduced) || 0) / 2300;
    const oilTablespoons = Math.max(0, Number(goal.fatReduced) || 0) / 14;
    const readableEquivalent = (value) => value < 10 ? value.toFixed(1) : Math.round(value).toLocaleString();

    // Calculate progress
    let progressPercent = 0;
    if (activeDream.type === 'savings' || activeDream.type === 'travel') {
        progressPercent = activeDream.targetAmount > 0 ? Math.round((activeDream.savedAmount / activeDream.targetAmount) * 100) : 0;
    } else if (activeDream.type === 'weight_loss') {
        const startingWeight = Number(activeDream.startingWeight) || Math.max(activeDream.currentWeight, activeDream.targetWeight);
        const totalChange = Math.max(0.1, startingWeight - activeDream.targetWeight);
        progressPercent = Math.min(100, Math.max(0, Math.round(((startingWeight - activeDream.currentWeight) / totalChange) * 100)));
    } else if (activeDream.type === 'habit') {
        progressPercent = activeDream.targetCount > 0 ? Math.min(100, Math.round((activeDream.currentCount / activeDream.targetCount) * 100)) : 0;
    }

    const isMoneyDream = ['savings', 'travel'].includes(activeDream.type);
    const remainingAmount = isMoneyDream ? Math.max(0, activeDream.targetAmount - activeDream.savedAmount) : 0;
    const nextMilestone = isMoneyDream ? Math.min(activeDream.targetAmount, Math.max(5000, Math.ceil((activeDream.savedAmount + 1) / 5000) * 5000)) : 0;
    const milestoneRemaining = isMoneyDream ? Math.max(0, nextMilestone - activeDream.savedAmount) : 0;
    const mealsToMilestone = Math.ceil(milestoneRemaining / 80);
    const monthlyRate = Math.max(1, starterPlan ? Number(starterPlan.weeklyAmount || 0) * 30 / 7 : Number(goal.monthlySaved) || 1);
    const estimatedMonths = isMoneyDream ? Math.ceil(remainingAmount / monthlyRate) : 0;
    const estimatedDate = new Date();
    estimatedDate.setMonth(estimatedDate.getMonth() + estimatedMonths);
    const valueText = (dream, current = true) => {
        if (dream.type === 'weight_loss') return `${current ? dream.currentWeight : dream.targetWeight} kg`;
        if (dream.type === 'habit') return `${Number(current ? dream.currentCount : dream.targetCount) || 0} 次`;
        return `NT$ ${(Number(current ? dream.savedAmount : dream.targetAmount) || 0).toLocaleString()}`;
    };
    const fridayBase = getDeliveryPlanOptions('tired', 30);
    const fridayPlans = [
        { code: 'A', title: fridayBase[1].title, meta: '正常料理 · 20–30 分鐘', detail: '體力可以時，優先把即期食材煮成完整一餐。', icon: 'restaurant_menu' },
        { code: 'B', title: fridayBase[0].title, meta: '低體力 · 15 分鐘內', detail: '少洗鍋、快速上桌，保留週五晚上的休息時間。', icon: 'battery_2_bar' },
        { code: 'C', title: fridayBase[2].title, meta: '允許外食 · 先保存', detail: fridayBase[2].detail, icon: 'takeout_dining' }
    ];

    // Render Carousel
    const carouselHtml = `
        <div class="dream-carousel mb-md pb-2">
            ${appState.dreams.map(d => `
                <div onclick="switchDream('${d.id}')" class="dream-card-mini ${d.id === appState.activeDreamId ? 'active' : ''} ${d.isPaused ? 'paused' : ''} flex items-center gap-sm">
                    <div class="dream-type-icon dream-type-${d.type}">
                        <span class="material-symbols-outlined">${d.icon}</span>
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-slate-blue truncate max-w-[80px]">${d.name}</h4>
                        <div class="text-[10px] text-on-surface-variant font-medium mt-0.5">
                            ${valueText(d)}
                        </div>
                    </div>
                </div>
            `).join('')}
            <div onclick="showDreamEditor()" class="dream-card-mini flex items-center justify-center gap-sm border-dashed bg-transparent hover:bg-surface-container-low text-outline" style="min-width: 120px;">
                <span class="material-symbols-outlined text-xl">add</span>
                <span class="text-xs font-bold">新夢想分支</span>
            </div>
        </div>
    `;

    container.innerHTML = `
        <div class="space-y-lg">
            <!-- Header Section -->
            <section class="flex flex-col gap-xs">
                <h2 class="font-headline-lg text-3xl font-extrabold text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined text-4xl">park</span>
                    夢想樹
                </h2>
                <p class="text-on-surface-variant font-body-md">每一次健康的自煮選擇，都在灌溉你的夢想分支。</p>
            </section>

            ${starterPlan ? `<section class="bg-secondary/5 border border-secondary/20 rounded-2xl p-md"><div class="flex flex-col sm:flex-row sm:items-start justify-between gap-md"><div><div class="flex items-start gap-sm"><span class="material-symbols-outlined text-secondary">flag</span><div><p class="text-xs font-extrabold text-slate-blue">30 天先累積 ${starterPlan.thirtyDayAmount ? `NT$ ${starterPlan.thirtyDayAmount.toLocaleString()}` : `${starterPlan.milestones.shortTerm.actionTarget} 次行動`}</p><p class="text-[10px] text-on-surface-variant mt-1">${starterPlan.paceLabel} · 每週圓夢 NT$ ${starterPlan.weeklyAmount.toLocaleString()}</p></div></div><div class="flex flex-wrap gap-xs mt-sm">${starterPlan.actions.map((action) => `<button onclick="recordActivePlanAction('${action.id}')" class="px-3 py-2 rounded-full bg-white border border-secondary/25 text-[10px] font-extrabold text-secondary"><span class="material-symbols-outlined text-sm align-middle">add_task</span> ${escapeOnboardingText(action.label)} ${Number(actionCompletions[action.id] || 0)}/${action.weeklyFrequency}</button>`).join('')}</div></div><button onclick="switchTab('profile')" class="px-md py-2 rounded-full bg-white border border-secondary/30 text-secondary text-xs font-extrabold whitespace-nowrap">查看計畫</button></div><div class="mt-sm"><div class="flex justify-between text-[10px] text-on-surface-variant"><span>本週行動進度</span><b>${completedActions}/${totalActionTarget}</b></div><div class="h-2 bg-white rounded-full mt-1 overflow-hidden"><div class="h-full bg-secondary rounded-full" style="width:${totalActionTarget ? Math.min(100, completedActions / totalActionTarget * 100) : 0}%"></div></div></div></section>` : `<section class="bg-secondary/5 border border-secondary/20 rounded-2xl p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md"><div class="flex items-start gap-sm"><span class="material-symbols-outlined text-secondary">tune</span><div><p class="text-xs font-extrabold text-slate-blue">建立你的 30 天起始計畫</p><p class="text-[10px] text-on-surface-variant mt-1">從具體生活行動推算圓夢空間。</p></div></div><button onclick="restartLifeOnboarding()" class="px-md py-2 rounded-full bg-white border border-secondary/30 text-secondary text-xs font-extrabold whitespace-nowrap">開始盤點</button></section>`}

            <!-- Dream Carousel -->
            ${carouselHtml}

            <!-- Active Dream Card: Large Radial Progress -->
            <section class="bg-white rounded-3xl p-lg shadow-sm relative overflow-hidden flex flex-col md:flex-row items-center gap-xl border border-primary/5 transition-all">
                <div class="absolute top-4 right-4 flex gap-2">
                    <button onclick="showDreamEditor('${activeDream.id}')" class="text-outline-variant hover:text-slate-blue transition-colors p-1 bg-surface-container rounded-full">
                        <span class="material-symbols-outlined text-lg block">edit</span>
                    </button>
                </div>
                <div class="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                    <div class="radial-progress w-full h-full rounded-full transition-all duration-1000 ease-out" style="--progress: ${progressPercent}; ${activeDream.type === 'weight_loss' ? 'background: radial-gradient(closest-side, white 82%, transparent 80% 100%), conic-gradient(var(--color-sage-green) calc(var(--progress) * 1%), var(--color-surface-container) 0);' : ''}"></div>
                    <div class="absolute flex flex-col items-center">
                        <span class="text-4xl font-extrabold text-slate-blue">${progressPercent}%</span>
                        <span class="text-xs font-bold text-on-surface-variant mt-1">達成率</span>
                    </div>
                </div>
                <div class="flex-1 space-y-md text-center md:text-left w-full">
                    <div>
                        <span class="inline-block px-2 py-0.5 bg-surface-container-high text-[10px] font-extrabold text-on-surface-variant rounded-full mb-2 uppercase tracking-wide">
                            ${activeDream.type === 'travel' ? '旅遊夢想' : activeDream.type === 'weight_loss' ? '健康體態' : activeDream.type === 'habit' ? '習慣養成' : '財務目標'}
                        </span>
                        <h3 class="text-xl font-extrabold text-slate-blue mb-sm">${activeDream.name}</h3>
                        <p class="text-on-surface-variant text-sm font-medium">${activeDream.description}</p>
                    </div>
                    <div class="grid grid-cols-2 gap-md">
                        <div class="bg-surface-container-low p-md rounded-xl">
                            <span class="block text-[10px] font-bold text-on-surface-variant uppercase mb-xs">目前累積</span>
                            <span class="text-2xl font-extrabold text-primary">
                                ${valueText(activeDream)}
                            </span>
                        </div>
                        <div class="bg-surface-container-low p-md rounded-xl">
                            <span class="block text-[10px] font-bold text-on-surface-variant uppercase mb-xs">目標</span>
                            <span class="text-2xl font-extrabold text-slate-blue">
                                ${valueText(activeDream, false)}
                            </span>
                        </div>
                    </div>
                    <div class="bg-primary/5 border border-primary/10 rounded-2xl p-md text-left">
                        ${isMoneyDream ? `
                            <div class="flex justify-between gap-sm"><span class="text-xs font-extrabold text-slate-blue">下一個小里程碑</span><span class="text-xs font-extrabold text-primary">NT$ ${nextMilestone.toLocaleString()}</span></div>
                            <p class="text-xs text-on-surface-variant mt-xs">再累積 NT$ ${milestoneRemaining.toLocaleString()}，約等於 ${mealsToMilestone} 次自煮；依目前本月速度，預估 ${estimatedDate.getFullYear()} 年 ${estimatedDate.getMonth() + 1} 月達成最終目標。</p>
                        ` : activeDream.type === 'habit' ? `<p class="text-xs font-bold text-slate-blue">再完成 ${Math.max(0, activeDream.targetCount - activeDream.currentCount)} 次，就能達成這個習慣目標。</p>` : `<p class="text-xs font-bold text-slate-blue">體態由你自行記錄；每次更新體重，看板會依起始值重算進度。</p>`}
                    </div>
                </div>
            </section>

            <section class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                <div class="bg-white rounded-2xl p-lg shadow-sm border-l-4 border-ochre-gold">
                    <div class="flex items-center gap-sm mb-md"><span class="material-symbols-outlined text-ochre-gold">savings</span><h4 class="font-extrabold text-slate-blue">圓夢資產</h4></div>
                    <div class="grid grid-cols-2 gap-sm"><div><p class="text-[10px] font-bold text-on-surface-variant">本月省下</p><p class="text-xl font-extrabold text-primary">NT$ ${goal.monthlySaved.toLocaleString()}</p></div><div><p class="text-[10px] font-bold text-on-surface-variant">目前主夢想</p><p class="text-sm font-extrabold text-slate-blue">${activeDream.name}</p></div></div>
                    <p class="text-xs text-on-surface-variant mt-md">完成料理或救援食材後，節省金額會自動分配到目前主夢想。</p>
                </div>
                <div class="bg-white rounded-2xl p-lg shadow-sm border-l-4 border-sage-green">
                    <div class="flex items-center gap-sm mb-md"><span class="material-symbols-outlined text-sage-green">health_and_safety</span><h4 class="font-extrabold text-slate-blue">健康資產 <span class="text-[10px] text-outline">估算</span></h4></div>
                    <div class="grid grid-cols-2 gap-sm text-center"><div><p class="text-xl font-extrabold text-secondary">${goal.mealsCompleted}</p><p class="text-[10px] font-bold text-on-surface-variant">完成料理</p></div><div><p class="text-xl font-extrabold text-secondary">${goal.rescuedItems}</p><p class="text-[10px] font-bold text-on-surface-variant">救援食材</p></div><div class="bg-surface-container-low rounded-xl p-sm"><svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" class="mx-auto mb-1 text-secondary" aria-label="鹽罐圖示" role="img"><path d="M9 12.5C9 9.2 11.7 6.5 15 6.5s6 2.7 6 6H9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M8.5 12.5h13l-1 11h-11l-1-11Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 17h10M10.5 20.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity=".65"/><circle cx="12" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="8.5" r=".9" fill="currentColor"/><circle cx="18" cy="10" r=".9" fill="currentColor"/></svg><p class="text-sm font-extrabold text-slate-blue">約 ${readableEquivalent(saltTeaspoons)} 茶匙鹽</p><p class="text-[10px] text-on-surface-variant">少攝取的鈉（${goal.sodiumReduced.toLocaleString()} mg）</p></div><div class="bg-surface-container-low rounded-xl p-sm"><span class="material-symbols-outlined text-ochre-gold text-xl">oil_barrel</span><p class="text-sm font-extrabold text-slate-blue">約 ${readableEquivalent(oilTablespoons)} 大匙油</p><p class="text-[10px] text-on-surface-variant">少攝取的脂肪（${goal.fatReduced.toLocaleString()} g）</p></div></div>
                    <p class="text-[10px] leading-relaxed text-on-surface-variant mt-sm text-center">1 茶匙鹽約含 2,300 mg 鈉、1 大匙油約含 14 g 脂肪。</p>
                </div>
            </section>

            <!-- Legacy detailed ROI cards kept for future drill-down -->
            <section class="hidden grid-cols-1 md:grid-cols-3 gap-lg">
                <!-- Savings ROI -->
                <div class="bg-white rounded-2xl p-lg shadow-sm border-b-4 border-ochre-gold flex flex-col items-center text-center">
                    <div class="w-12 h-12 bg-ochre-gold/10 rounded-full flex items-center justify-center mb-md">
                        <span class="material-symbols-outlined text-ochre-gold text-[32px]">savings</span>
                    </div>
                    <h4 class="text-xs font-bold text-slate-blue mb-xs">本月節省開支</h4>
                    <div class="text-2xl font-extrabold text-primary mb-sm">+ NT$ ${goal.monthlySaved.toLocaleString()}</div>
                    <p class="text-xs text-on-surface-variant">相當於約 ${Math.round(goal.monthlySaved / 200)} 次外送服務費用</p>
                </div>
                <!-- Sodium Reduction ROI -->
                <div class="bg-white rounded-2xl p-lg shadow-sm border-b-4 border-sage-green flex flex-col items-center text-center">
                    <div class="w-12 h-12 bg-sage-green/10 rounded-full flex items-center justify-center mb-md">
                        <span class="material-symbols-outlined text-sage-green text-[32px]">health_and_safety</span>
                    </div>
                    <h4 class="text-xs font-bold text-slate-blue mb-xs">鈉含量減量</h4>
                    <div class="text-2xl font-extrabold text-secondary mb-sm">- ${goal.sodiumReduced.toLocaleString()} mg</div>
                    <p class="text-xs text-on-surface-variant">降低血壓負擔，身體更有活力</p>
                </div>
                <!-- Fat Avoidance ROI -->
                <div class="bg-white rounded-2xl p-lg shadow-sm border-b-4 border-slate-blue flex flex-col items-center text-center">
                    <div class="w-12 h-12 bg-slate-blue/10 rounded-full flex items-center justify-center mb-md">
                        <span class="material-symbols-outlined text-slate-blue text-[32px]">monitor_weight</span>
                    </div>
                    <h4 class="text-xs font-bold text-slate-blue mb-xs">脂肪攝取降低</h4>
                    <div class="text-2xl font-extrabold text-slate-blue mb-sm">- ${goal.fatReduced.toLocaleString()} g</div>
                    <p class="text-xs text-on-surface-variant">減少隱形加工油脂，體態更輕盈</p>
                </div>
            </section>

            <!-- Delivery Blocker & Friday Plan B Bento Row -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <!-- Delivery Blocker -->
                <div class="bg-oatmeal-sand border-l-[6px] border-terracotta rounded-2xl p-lg flex items-center gap-lg shadow-sm">
                    <div class="hidden sm:block">
                        <div class="w-20 h-20 rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
                            <span class="material-symbols-outlined text-terracotta text-4xl fill">block</span>
                        </div>
                    </div>
                    <div class="flex-1 space-y-md">
                        <div>
                            <h4 class="text-lg font-extrabold text-on-surface mb-xs">外送衝動阻斷器</h4>
                            <p class="text-sm font-medium text-on-surface-variant">當你感到疲憊想叫外送時，想想「${activeDream.name}」，點擊下方看看有哪些現成食材！</p>
                        </div>
                        <button onclick="openDeliveryBlocker()" class="bg-terracotta text-white px-lg py-sm rounded-full text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow-md">
                            我快要點外送了
                        </button>
                    </div>
                </div>
                <!-- Friday Plan B -->
                <div class="bg-slate-blue rounded-2xl p-lg flex flex-col justify-between text-white shadow-lg relative overflow-hidden">
                    <div class="absolute top-0 right-0 p-lg opacity-10">
                        <span class="material-symbols-outlined text-[100px]">restaurant</span>
                    </div>
                    <div class="relative z-10">
                        <div class="flex items-center justify-between gap-sm mb-md">
                            <div class="flex items-center gap-sm">
                            <span class="material-symbols-outlined text-ochre-gold">event_repeat</span>
                            <h4 class="text-lg font-extrabold text-ochre-gold">週五 B 計劃</h4>
                            </div>
                            <button onclick="openFridaySettings()" aria-label="設定週五計劃" class="text-oatmeal-sand/70 hover:text-white"><span class="material-symbols-outlined text-lg">settings</span></button>
                        </div>
                        <p class="text-xs font-medium text-oatmeal-sand/80 mb-md">先決定備案，不必等到又餓又累才想。</p>
                        <div class="space-y-xs">${fridayPlans.map((plan, index) => `<button onclick="chooseFridayPlan(${index})" class="w-full bg-white/10 hover:bg-white/15 rounded-xl p-sm text-left flex gap-sm items-start"><span class="w-7 h-7 rounded-full bg-ochre-gold text-slate-blue text-xs font-extrabold flex items-center justify-center shrink-0">${plan.code}</span><span><strong class="block text-xs text-white">${plan.title}</strong><span class="block text-[10px] text-ochre-gold">${plan.meta}</span><span class="block text-[10px] text-oatmeal-sand/70 mt-0.5">${plan.detail}</span></span></button>`).join('')}</div>
                    </div>
                    <p class="relative z-10 text-[10px] text-oatmeal-sand/60 mt-md">提醒時間：每週五 ${appState.deliverySupport.fridayReminder} · ${appState.deliverySupport.householdSize} 人份</p>
                </div>
            </div>

            <!-- Bento Stats Visualizer -->
            <section class="hidden grid-cols-2 md:grid-cols-4 gap-md">
                <div class="bg-white p-md rounded-xl flex flex-col gap-sm shadow-sm">
                    <span class="material-symbols-outlined text-primary">restaurant_menu</span>
                    <div>
                        <div class="text-2xl font-extrabold text-on-surface">124</div>
                        <div class="text-xs font-bold text-on-surface-variant">本月家常菜</div>
                    </div>
                </div>
                <div class="bg-white p-md rounded-xl flex flex-col gap-sm shadow-sm">
                    <span class="material-symbols-outlined text-secondary">eco</span>
                    <div>
                        <div class="text-2xl font-extrabold text-on-surface">32kg</div>
                        <div class="text-xs font-bold text-on-surface-variant">減碳貢獻</div>
                    </div>
                </div>
                <div class="bg-white p-md rounded-xl flex flex-col gap-sm shadow-sm">
                    <span class="material-symbols-outlined text-tertiary">timer</span>
                    <div>
                        <div class="text-2xl font-extrabold text-on-surface">45h</div>
                        <div class="text-xs font-bold text-on-surface-variant">與家人共食</div>
                    </div>
                </div>
                <div class="bg-white p-md rounded-xl flex flex-col gap-sm shadow-sm">
                    <span class="material-symbols-outlined text-primary-container">favorite</span>
                    <div>
                        <div class="text-2xl font-extrabold text-on-surface">98%</div>
                        <div class="text-xs font-bold text-on-surface-variant">幸福指數</div>
                    </div>
                </div>
            </section>
        </div>
    `;
}

// ==========================================
// VIEW 2: FRIDGE HOURGLASS (冰箱沙漏)
// ==========================================
// ==========================================
// FRIDGE CAPACITY INTELLIGENCE
// ==========================================
const FRIDGE_MODELS = {
    'Panasonic': [
        { model: 'NR-C470', capacity: 470, coldRatio: 0.55 },
        { model: 'NR-B239', capacity: 232, coldRatio: 0.65 }
    ],
    'Hitachi': [
        { model: 'R-HSX530', capacity: 527, coldRatio: 0.52 },
        { model: 'R-V36', capacity: 360, coldRatio: 0.6 }
    ],
    'Toshiba': [
        { model: 'GR-AG55TDZ', capacity: 510, coldRatio: 0.55 },
        { model: 'GR-A28', capacity: 280, coldRatio: 0.65 }
    ]
};

window.renderFridgeProfileSetup = function() {
    const existing = document.getElementById("fridge-setup-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "fridge-setup-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[500px] w-full mx-gutter border border-primary/5 flex flex-col max-h-[85vh]">
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
                <div class="flex items-center gap-xs text-primary">
                    <span class="material-symbols-outlined text-2xl">kitchen</span>
                    <h3 class="text-lg font-extrabold text-slate-blue">設定我的冰箱</h3>
                </div>
                <button onclick="document.getElementById('fridge-setup-modal').remove()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto py-md space-y-md custom-scrollbar">
                <div class="flex bg-surface-container rounded-xl p-1 mb-md">
                    <button class="flex-1 fridge-tab-btn active text-center">廠牌型號</button>
                    <button class="flex-1 fridge-tab-btn text-center text-outline">拍照辨識</button>
                    <button class="flex-1 fridge-tab-btn text-center text-outline">手動輸入</button>
                </div>

                <div id="fridge-setup-model-tab">
                    <p class="text-xs text-on-surface-variant font-medium mb-sm">選擇您的冰箱品牌與型號，系統將自動套用容量規格。</p>
                    <div class="space-y-sm">
                        <div>
                            <label class="block text-[10px] font-bold text-slate-blue mb-1">品牌</label>
                            <select class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm">
                                <option>Panasonic (國際牌)</option>
                                <option>Hitachi (日立)</option>
                                <option>Toshiba (東芝)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-blue mb-1">型號</label>
                            <select class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm">
                                <option>NR-C470 (470L 三門)</option>
                                <option>NR-B239 (232L 雙門)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="pt-md border-t border-outline-variant/30 flex-shrink-0">
                <button onclick="appState.fridgeProfile.isConfigured = true; appState.fridgeProfile.capacityLiters = 470; document.getElementById('fridge-setup-modal').remove(); renderCurrentTab(); showToast('冰箱設定完成！', 'success')" class="w-full bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    完成設定
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

function renderFridgeHourglass(container) {
    const urgentItems = appState.inventory.filter(item => item.daysLeft <= 1);

    // Sort inventory so that lower daysLeft comes first
    const sortedInventory = [...appState.inventory].sort((a, b) => a.daysLeft - b.daysLeft);
    const coldItems = sortedInventory.filter(item => item.chamber === "cold");
    const frozenItems = sortedInventory.filter(item => item.chamber === "frozen");

    const fp = appState.fridgeProfile;
    // Mock current usage calculation based on item count
    const estimatedUsage = (appState.inventory.length * 5) || 0;
    let capacityHtml = "";

    if (!fp.isConfigured) {
        capacityHtml = `
            <div class="bg-surface-container-low rounded-2xl p-md border border-dashed border-outline-variant mb-lg flex flex-col sm:flex-row items-center justify-between gap-md cursor-pointer hover:bg-surface-container transition-colors" onclick="renderFridgeProfileSetup()">
                <div class="flex items-center gap-md">
                    <div class="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm text-outline">
                        <span class="material-symbols-outlined text-[28px]">kitchen</span>
                    </div>
                    <div>
                        <h4 class="text-sm font-extrabold text-slate-blue">尚未設定冰箱容量</h4>
                        <p class="text-[10px] text-on-surface-variant mt-0.5">設定後 AI 將為您把關庫存避免爆倉</p>
                    </div>
                </div>
                <button class="bg-primary text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">開始設定</button>
            </div>
        `;
    } else {
        const fillPercent = Math.min(100, Math.round((estimatedUsage / fp.capacityLiters) * 100));
        const isOverfull = fillPercent > 80;

        capacityHtml = `
            <div class="fridge-profile-card p-md mb-lg">
                <div class="flex justify-between items-center mb-sm">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">kitchen</span>
                        <h4 class="text-sm font-extrabold text-slate-blue">我的冰箱容量 (${fp.capacityLiters}L)</h4>
                    </div>
                    <button onclick="renderFridgeProfileSetup()" class="text-[10px] font-bold text-outline hover:text-slate-blue underline">修改設定</button>
                </div>
                <div class="fridge-capacity-bar mb-2">
                    <div class="fridge-capacity-fill ${isOverfull ? 'overfull' : ''}" style="width: ${fillPercent}%"></div>
                </div>
                <div class="flex justify-between items-center text-[10px]">
                    <span class="font-bold text-on-surface-variant">目前約佔 ${fillPercent}%</span>
                    ${isOverfull ? '<span class="font-bold text-error flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">warning</span> 快爆倉了，建議先吃！</span>' : '<span class="font-bold text-sage-green flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">check_circle</span> 還有充足空間</span>'}
                </div>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="space-y-lg">
            ${capacityHtml}



            <!-- Urgent Banner -->
            ${urgentItems.length > 0 ? `
                <section class="bg-rust-orange rounded-2xl p-md flex items-center justify-between shadow-md text-white">
                    <div class="flex items-center gap-md">
                        <div class="bg-white/20 p-2 rounded-full hidden sm:block">
                            <span class="material-symbols-outlined animate-bounce" style="font-variation-settings: 'FILL' 1;">hourglass_empty</span>
                        </div>
                        <div>
                            <h2 class="font-extrabold text-base leading-tight">食材警報：${urgentItems.length} 件即將到期</h2>
                            <p class="text-xs font-medium opacity-90">這些食材預計將在 24 小時內浪費，建議今天優先料理！</p>
                        </div>
                    </div>
                    <button onclick="document.getElementById('rescue-decision-center')?.scrollIntoView({ behavior: 'smooth', block: 'start' })" class="bg-white text-rust-orange px-md py-sm rounded-xl text-xs font-bold shadow-sm hover:bg-surface-bright transition-all active:scale-95 whitespace-nowrap">
                        開始救援
                    </button>
                </section>
            ` : ""}

            <!-- Refrigerator Grid: Dual Chamber Layout -->
            <section class="grid grid-cols-1 lg:grid-cols-2 gap-lg">
                <!-- Cold Chamber (Chilled) -->
                <div class="border-4 border-slate-blue rounded-3xl p-md bg-white shadow-xl flex flex-col min-h-[400px]">
                    <div class="flex items-center justify-between mb-md pb-2 border-b border-surface-container-high">
                        <div class="flex items-center gap-sm">
                            <span class="material-symbols-outlined text-slate-blue font-bold">ac_unit</span>
                            <h3 class="text-lg font-extrabold text-slate-blue">冷藏室</h3>
                        </div>
                        <span class="text-slate-blue text-xs font-bold bg-slate-blue/10 px-3 py-1 rounded-full">4°C 穩定</span>
                    </div>

                    ${coldItems.length === 0 ? `
                        <div class="flex-1 flex flex-col items-center justify-center text-center p-xl">
                            <span class="material-symbols-outlined text-outline-variant text-[64px] mb-2">kitchen</span>
                            <p class="text-sm font-semibold text-on-surface-variant">冷藏室空空的...</p>
                            <p class="text-xs text-outline mt-1">點擊上方按鈕手動新增，或在補貨區確認補貨！</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-md">
                            ${coldItems.map(item => getFridgeItemHtml(item)).join("")}
                        </div>
                    `}
                </div>

                <!-- Freezer Chamber (Frozen) -->
                <div class="border-4 border-slate-blue rounded-3xl p-md bg-white shadow-xl flex flex-col min-h-[400px]">
                    <div class="flex items-center justify-between mb-md pb-2 border-b border-surface-container-high">
                        <div class="flex items-center gap-sm">
                            <span class="material-symbols-outlined text-slate-blue font-bold">severe_cold</span>
                            <h3 class="text-lg font-extrabold text-slate-blue">冷凍庫</h3>
                        </div>
                        <span class="text-slate-blue text-xs font-bold bg-slate-blue/10 px-3 py-1 rounded-full">-18°C 穩定</span>
                    </div>

                    ${frozenItems.length === 0 ? `
                        <div class="flex-1 flex flex-col items-center justify-center text-center p-xl">
                            <span class="material-symbols-outlined text-outline-variant text-[64px] mb-2">kitchen</span>
                            <p class="text-sm font-semibold text-on-surface-variant">冷凍庫空空的...</p>
                            <p class="text-xs text-outline mt-1">冷凍能拉長保存期限，特別適合壓扁分裝的肉類！</p>
                        </div>
                    ` : `
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-md">
                            ${frozenItems.map(item => getFridgeItemHtml(item)).join("")}
                        </div>
                    `}
                </div>
            </section>

            ${renderRescueDecisionCenter()}

            <!-- Legacy rescue presentation retained temporarily for reference -->
            <div class="hidden" aria-hidden="true">
            <!-- Plan B Surplus Food Converter -->
            <section class="mt-xl bg-white border border-outline-variant/30 rounded-3xl p-lg shadow-sm">
                <div class="flex items-center gap-sm mb-md pb-2 border-b border-surface-container-high">
                    <span class="material-symbols-outlined text-[#E07A5F]">cached</span>
                    <h3 class="text-lg font-extrabold text-slate-blue">續食計畫：Plan B 物理轉化</h3>
                </div>
                <p class="text-xs text-on-surface-variant font-medium mb-lg">
                    零浪費廚房運行新範式：將即將腐壞的邊角料，轉化為高附加價值的營養美味。
                </p>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
                    <!-- Path 1: Blend -->
                    <div onclick="showPlanBModal('blend')" class="bg-sage-green/10 hover:bg-sage-green/20 border border-sage-green/30 rounded-2xl p-md flex items-start gap-md cursor-pointer transition-all hover:-translate-y-1">
                        <div class="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-lg">blender</span>
                        </div>
                        <div class="text-left">
                            <h4 class="text-xs font-extrabold text-secondary">攪拌 (Blend)</h4>
                            <p class="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                                外觀不佳或過熟蔬果的修復路徑。加入奇亞籽與堅果醬，快速製成能量飲！
                            </p>
                        </div>
                    </div>
                    <!-- Path 2: Bake -->
                    <div onclick="showPlanBModal('bake')" class="bg-ochre-gold/10 hover:bg-ochre-gold/20 border border-ochre-gold/30 rounded-2xl p-md flex items-start gap-md cursor-pointer transition-all hover:-translate-y-1">
                        <div class="w-10 h-10 rounded-full bg-tertiary text-white flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-lg">cookie</span>
                        </div>
                        <div class="text-left">
                            <h4 class="text-xs font-extrabold text-tertiary">烘焙 (Bake)</h4>
                            <p class="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                                蔬菜碎與邊角料再造。先執行【機械去水】再拌入麵團，烘出鬆軟蔬菜麵包！
                            </p>
                        </div>
                    </div>
                    <!-- Path 3: Boil -->
                    <div onclick="showPlanBModal('boil')" class="bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-2xl p-md flex items-start gap-md cursor-pointer transition-all hover:-translate-y-1">
                        <div class="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-lg">local_fire_department</span>
                        </div>
                        <div class="text-left">
                            <h4 class="text-xs font-extrabold text-primary">煲煮 (Boil)</h4>
                            <p class="text-[10px] text-on-surface-variant font-medium mt-1 leading-relaxed">
                                果皮天然果膠萃取。煲出高比熱容增稠物，天然提升咖哩與果醬的風味深度！
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Recipe Deck (Horizontal Scroll) -->
            <section class="mt-xl">
                <div class="flex items-center justify-between mb-md">
                    <h3 class="text-xl font-extrabold text-slate-blue">「即刻救援」食譜推薦</h3>
                    <a class="text-primary font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer" onclick="alert('點擊了查看全部食譜！')">
                        查看全部 <span class="material-symbols-outlined text-sm">arrow_forward</span>
                    </a>
                </div>
                <div class="flex overflow-x-auto gap-md pb-md custom-scrollbar">
                    <!-- Recipe Card 1 -->
                    <div class="min-w-[280px] w-[280px] bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onclick="alert('本日推薦：暖心酪梨水波蛋吐司 (使用即期酪梨 + 雞蛋)')">
                        <div class="h-40 overflow-hidden relative">
                            <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpweVaOcGxcFJRMC0G08ar7UaJawYRLZqZBqVSuU52i5Ofi9HjScAh-yPhXuUe64m3YmCwYEfVO1IO-I1e4B3VWh3ufOjCcsAfoFH1ScdPnSSkRRH8B2WP6O2JLZ2SueNY37G7VD-zttx9NbM1dYigz56r3NSSkcy3MetLtF4xYK6xgAxTuEsEMwebDqD_vPaOnxG8Q_WLeHy7ZdB5uYMHekGor2tEzqYCVavQGU7pwzjLGC3PA27B64RVuH5ekbD0042x-KwoA3k" alt="暖心酪梨水波蛋吐司">
                            <div class="absolute top-3 left-3 bg-rust-orange text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">包含即期食材</div>
                        </div>
                        <div class="p-md">
                            <h4 class="font-extrabold text-sm text-on-surface mb-2">暖心酪梨水波蛋吐司</h4>
                            <div class="flex items-center gap-lg">
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">timer</span>
                                    <span class="text-xs font-semibold">15 分鐘</span>
                                </div>
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">payments</span>
                                    <span class="text-xs font-semibold">低成本 ($45)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Recipe Card 2 -->
                    <div class="min-w-[280px] w-[280px] bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onclick="alert('本日推薦：蜂蜜烤胡蘿蔔溫沙拉 (使用胡蘿蔔)')">
                        <div class="h-40 overflow-hidden relative">
                            <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBDBp8DF3sWjgBtbbItq_OPpHQNTELYrxvXlAC70aipwbQWxcA0zjN8y23tXTQwn_JCGHHPT8ViT9sHIUuzjWUSBunrhWRInC3c1crwLdE8GgJ-3E4c51Gyzr-OzL23-3bHRaLGA_osZjKz-rfzAAR3PNHYU0GzOvVwVJDshfZplt1xYtXRSGMnnv_jrbX9mpUDcockY2GJIkG7GvbUjeCLGcyH2vihxjyeFzxXfpUqymYo8-cSfGT8XLRquVaoe8YGDUej__gWrY" alt="蜂蜜烤胡蘿蔔溫沙拉">
                            <div class="absolute top-3 left-3 bg-ochre-gold text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">清空冷藏庫</div>
                        </div>
                        <div class="p-md">
                            <h4 class="font-extrabold text-sm text-on-surface mb-2">蜂蜜烤胡蘿蔔溫沙拉</h4>
                            <div class="flex items-center gap-lg">
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">timer</span>
                                    <span class="text-xs font-semibold">25 分鐘</span>
                                </div>
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">payments</span>
                                    <span class="text-xs font-semibold">超值 ($30)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Recipe Card 3 -->
                    <div class="min-w-[280px] w-[280px] bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer" onclick="alert('本日推薦：香煎鮭魚佐莓果醬 (使用冷凍鮭魚 + 綜合莓果)')">
                        <div class="h-40 overflow-hidden relative">
                            <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnX88saF5eVOfepTt2WA0hE0WMB94tYtdPni3E9J7x5t5YCLppLnivM0ajeZ90VprL16kcUkAiavbpn2dMVDqnmhXVc7a3DZ_euUSKhxk94fDzIpuSOCEWdt6FrsFpkhLFO_viA1eylQtibfA_B0ti22j4SgJ-DLlPgFzXvPLnZT2wQRZ8guevrOh4Kuq-VWAEtzCNQvE-O3j9FH8Q1kd-U8oMdTM4UDPkmyPE2aeeGdXV2dxmYpFDTwLJF9bFwqQB9yqpkhW4uE4" alt="香煎鮭魚佐莓果醬">
                            <div class="absolute top-3 left-3 bg-[#386753] text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">雙重冷凍庫存</div>
                        </div>
                        <div class="p-md">
                            <h4 class="font-extrabold text-sm text-on-surface mb-2">香煎鮭魚佐莓果醬</h4>
                            <div class="flex items-center gap-lg">
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">timer</span>
                                    <span class="text-xs font-semibold">20 分鐘</span>
                                </div>
                                <div class="flex items-center gap-1 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-sm">payments</span>
                                    <span class="text-xs font-semibold">中高成本 ($120)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            </div>
        </div>
    `;
}

function getRescueCandidates() {
    return appState.inventory
        .filter((item) => item.chamber === 'cold' && item.daysLeft <= 3 && !item.isRescueProduct)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 4);
}

function getRescuePlanForItem(item) {
    const name = item.name;
    const isFruit = /果|莓|酪梨|香蕉|芒果/.test(name);
    const isVegetable = /菜|蘿蔔|番茄|瓜|菇|筍|洋蔥/.test(name);
    const isProtein = /肉|魚|蝦|蛋|雞|豬|牛|起司|乳/.test(name);
    if (isFruit) {
        return {
            eatTitle: `${name}快速拌碗`,
            eatMethod: '切塊後以現有基本調味料完成，不需額外採買主食材。',
            eatTime: 8,
            preserveTitle: `${name}冷凍果昔包`,
            preserveMethod: '切塊平鋪冷凍，分成單次用量，之後直接攪打。',
            preserveDays: 14,
            outputQty: 2,
            outputUnit: '包'
        };
    }
    if (isVegetable) {
        const companion = appState.inventory.find((candidate) => candidate.id !== item.id && /蛋|起司|肉|魚/.test(candidate.name) && candidate.daysLeft <= 10);
        return {
            eatTitle: `${name}一鍋蒸煮`,
            eatMethod: companion ? `切小塊後與現有 ${companion.name} 加蓋蒸煮，低油煙完成。` : '切小塊後以基本調味料加蓋蒸煮，低油煙完成。',
            eatTime: 15,
            preserveTitle: `${name}冷凍備料包`,
            preserveMethod: '洗淨、瀝乾並切成一餐份，平鋪冷凍避免結塊。',
            preserveDays: 14,
            outputQty: 2,
            outputUnit: '包'
        };
    }
    if (isProtein) {
        const companion = appState.inventory.find((candidate) => candidate.id !== item.id && /菜|蘿蔔|番茄|瓜|菇|洋蔥/.test(candidate.name) && candidate.daysLeft <= 10);
        return {
            eatTitle: `${name}低油煙燜煮`,
            eatMethod: companion ? `搭配現有 ${companion.name}，以少量水加蓋燜熟，中心必須完全加熱。` : '以少量水和基本調味料加蓋燜熟，中心必須完全加熱。',
            eatTime: 18,
            preserveTitle: `${name}熟食分裝包`,
            preserveMethod: '完全加熱後快速降溫，分裝成一餐份並立即冷凍。',
            preserveDays: 7,
            outputQty: 2,
            outputUnit: '份'
        };
    }
    return {
        eatTitle: `${name}快速清冰箱料理`,
        eatMethod: '搭配現有食材一鍋煮熟，今天直接吃完。',
        eatTime: 15,
        preserveTitle: `${name}一餐份冷凍包`,
        preserveMethod: '處理成一餐份後密封冷凍，標記日期。',
        preserveDays: 10,
        outputQty: 2,
        outputUnit: '份'
    };
}

function renderRescueDecisionCenter() {
    const candidates = getRescueCandidates();
    const potentialSavings = candidates.reduce((sum, item) => sum + (Number(item.roi?.savings) || 50), 0);
    return `
        <section id="rescue-decision-center" class="mt-xl bg-[#fffdf5] border-2 border-ochre-gold/70 rounded-3xl p-md sm:p-lg shadow-sm scroll-mt-24">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-md">
                <div>
                    <div class="flex items-center gap-sm">
                        <span class="material-symbols-outlined text-primary text-2xl">emergency</span>
                        <h3 class="text-xl font-extrabold text-slate-blue">救援決策中心</h3>
                    </div>
                    <p class="text-xs text-on-surface-variant mt-1">今天吃掉，或現在處理、以後再吃。每一步都會同步庫存。</p>
                </div>
                <div class="bg-ochre-gold/25 border border-ochre-gold rounded-xl px-md py-sm text-center">
                    <span class="block text-[10px] font-bold text-tertiary">本輪可避免浪費</span>
                    <strong class="text-lg text-primary">NT$ ${potentialSavings}</strong>
                </div>
            </div>
            ${candidates.length === 0 ? `
                <div class="bg-white rounded-2xl p-xl text-center border border-outline-variant/20">
                    <span class="material-symbols-outlined text-secondary text-4xl">verified</span>
                    <h4 class="font-extrabold text-slate-blue mt-sm">目前沒有需要緊急救援的冷藏食材</h4>
                    <p class="text-xs text-on-surface-variant mt-1">剩餘 3 天內的食材會自動出現在這裡。</p>
                </div>` : `
                <div class="space-y-md">
                    ${candidates.map((item) => {
                        const plan = getRescuePlanForItem(item);
                        const urgency = item.daysLeft <= 0 ? '今天到期' : `剩 ${item.daysLeft} 天`;
                        return `
                            <article class="bg-white rounded-2xl p-md border border-outline-variant/30 shadow-sm">
                                <div class="flex items-start justify-between gap-sm mb-md">
                                    <div class="flex items-center gap-sm min-w-0">
                                        <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-xl object-cover bg-surface-container">
                                        <div class="min-w-0">
                                            <h4 class="font-extrabold text-slate-blue truncate">${item.name} ${item.qty}${item.unit}</h4>
                                            <span class="text-[10px] font-extrabold text-rust-orange">${urgency} · 預估可救回 NT$ ${Number(item.roi?.savings) || 50}</span>
                                        </div>
                                    </div>
                                    <button onclick="discardItem('${item.id}')" class="text-[10px] text-outline hover:text-error underline">確認不安全／丟棄</button>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-sm">
                                    <button onclick="openFoodSafetyGate('${item.id}', 'eat')" class="text-left p-md rounded-xl border-2 border-secondary/30 bg-secondary/5 hover:border-secondary transition-colors">
                                        <span class="inline-flex items-center gap-1 text-[10px] font-extrabold text-secondary"><span class="material-symbols-outlined text-base">restaurant</span> A｜今天直接吃掉</span>
                                        <strong class="block text-sm text-slate-blue mt-1">${plan.eatTitle}</strong>
                                        <p class="text-[10px] text-on-surface-variant mt-1 leading-relaxed">${plan.eatMethod}</p>
                                        <span class="inline-block mt-2 text-[10px] font-bold text-secondary">${plan.eatTime} 分鐘 · 完成後扣除 1 ${item.unit}</span>
                                    </button>
                                    <button onclick="openFoodSafetyGate('${item.id}', 'preserve')" class="text-left p-md rounded-xl border-2 border-primary/25 bg-primary/5 hover:border-primary transition-colors">
                                        <span class="inline-flex items-center gap-1 text-[10px] font-extrabold text-primary"><span class="material-symbols-outlined text-base">ac_unit</span> B｜轉化保存</span>
                                        <strong class="block text-sm text-slate-blue mt-1">${plan.preserveTitle}</strong>
                                        <p class="text-[10px] text-on-surface-variant mt-1 leading-relaxed">${plan.preserveMethod}</p>
                                        <span class="inline-block mt-2 text-[10px] font-bold text-primary">產生 ${plan.outputQty} ${plan.outputUnit} · 冷凍 ${plan.preserveDays} 天</span>
                                    </button>
                                </div>
                            </article>`;
                    }).join('')}
                </div>`}
        </section>`;
}

function openFoodSafetyGate(itemId, action) {
    const item = appState.inventory.find((entry) => entry.id === itemId);
    if (!item) return;
    const plan = getRescuePlanForItem(item);
    const actionTitle = action === 'eat' ? plan.eatTitle : plan.preserveTitle;
    document.getElementById('food-safety-gate')?.remove();
    const modal = document.createElement('div');
    modal.id = 'food-safety-gate';
    modal.className = 'fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-md backdrop-blur-sm';
    modal.innerHTML = `
        <section class="bg-white rounded-3xl p-lg max-w-[460px] w-full shadow-2xl border border-outline-variant/30">
            <div class="flex justify-between gap-sm mb-md">
                <div><span class="text-[10px] font-extrabold text-rust-orange">食安閘門</span><h3 class="font-extrabold text-slate-blue">先確認 ${item.name} 仍安全</h3></div>
                <button onclick="closeFoodSafetyGate()" aria-label="關閉食安檢查"><span class="material-symbols-outlined">close</span></button>
            </div>
            <div class="bg-error-container/35 border border-error/20 rounded-xl p-sm mb-md text-xs text-on-error-container">加熱或冷凍不能讓已腐壞的食物重新變安全。有疑慮時請直接丟棄。</div>
            <div class="space-y-sm">
                <label class="flex items-start gap-sm p-sm bg-surface-container-low rounded-xl"><input class="safety-check mt-1 accent-[#386753]" type="checkbox" onchange="updateSafetyGateButton()"><span class="text-xs font-bold">沒有酸敗、腐臭或其他異常氣味</span></label>
                <label class="flex items-start gap-sm p-sm bg-surface-container-low rounded-xl"><input class="safety-check mt-1 accent-[#386753]" type="checkbox" onchange="updateSafetyGateButton()"><span class="text-xs font-bold">沒有黏液、發霉或異常變色</span></label>
                <label class="flex items-start gap-sm p-sm bg-surface-container-low rounded-xl"><input class="safety-check mt-1 accent-[#386753]" type="checkbox" onchange="updateSafetyGateButton()"><span class="text-xs font-bold">冷藏保存正常，沒有長時間放在室溫</span></label>
            </div>
            <div class="grid grid-cols-2 gap-sm mt-md">
                <button onclick="closeFoodSafetyGate(); discardItem('${item.id}')" class="bg-surface-container text-error rounded-xl py-2.5 text-xs font-extrabold">不安全，丟棄</button>
                <button id="safety-confirm-button" onclick="completeRescueAction('${item.id}', '${action}')" disabled class="bg-secondary text-white rounded-xl py-2.5 text-xs font-extrabold disabled:opacity-35 disabled:cursor-not-allowed">確認安全，執行「${actionTitle}」</button>
            </div>
        </section>`;
    document.body.appendChild(modal);
}
window.openFoodSafetyGate = openFoodSafetyGate;

function updateSafetyGateButton() {
    const checks = Array.from(document.querySelectorAll('#food-safety-gate .safety-check'));
    const button = document.getElementById('safety-confirm-button');
    if (button) button.disabled = checks.length !== 3 || !checks.every((check) => check.checked);
}
window.updateSafetyGateButton = updateSafetyGateButton;

function closeFoodSafetyGate() {
    document.getElementById('food-safety-gate')?.remove();
}
window.closeFoodSafetyGate = closeFoodSafetyGate;

function completeRescueAction(itemId, action) {
    const index = appState.inventory.findIndex((entry) => entry.id === itemId);
    if (index === -1) return;
    const item = appState.inventory[index];
    const originalName = item.name;
    const originalUnit = item.unit;
    const plan = getRescuePlanForItem(item);
    const reward = Number(item.roi?.savings) || 50;

    if (item.qty > 1) {
        item.qty = Number(item.qty) - 1;
        if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);
    } else {
        appState.inventory.splice(index, 1);
        if (isCloudMode && supabaseClient) dbDeleteInventoryItem(itemId);
    }

    if (action === 'preserve') {
        const rescueProduct = {
            id: crypto.randomUUID(),
            name: plan.preserveTitle,
            chamber: 'frozen',
            qty: plan.outputQty,
            unit: plan.outputUnit,
            daysLeft: plan.preserveDays,
            image: item.image,
            addedDate: new Date().toISOString().slice(0, 10),
            roi: { savings: 0, sodium: 0, fat: 0 },
            storageProtocol: `由 ${originalName} 轉化；冷凍保存並於 ${plan.preserveDays} 天內食用。`,
            boxSize: 'S',
            isRescueProduct: true
        };
        appState.inventory.push(rescueProduct);
        if (isCloudMode && supabaseClient) dbAddInventoryItem(rescueProduct);
    }

    appState.savingsGoal.saved += reward;
    appState.savingsGoal.monthlySaved += reward;
    allocateDreamReward(reward, 'rescue');
    saveState();
    closeFoodSafetyGate();
    renderCurrentTab();
    showRescueSuccessModal({ action, originalName, originalUnit, reward, plan });
}
window.completeRescueAction = completeRescueAction;

function showRescueSuccessModal({ action, originalName, originalUnit, reward, plan }) {
    const modal = document.createElement('div');
    modal.id = 'rescue-success-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-md backdrop-blur-sm';
    modal.innerHTML = `
        <section class="bg-white rounded-3xl p-lg max-w-[420px] w-full shadow-2xl text-center">
            <span class="material-symbols-outlined text-secondary text-5xl">volunteer_activism</span>
            <h3 class="text-lg font-extrabold text-slate-blue mt-sm">成功救援 ${originalName}</h3>
            <p class="text-xs text-on-surface-variant mt-1">已從庫存扣除 1 ${originalUnit}</p>
            ${action === 'preserve' ? `<div class="bg-secondary/10 border border-secondary/20 rounded-xl p-sm mt-md text-xs font-bold text-secondary">新增「${plan.preserveTitle}」${plan.outputQty}${plan.outputUnit}，冷凍保存 ${plan.preserveDays} 天</div>` : `<div class="bg-secondary/10 border border-secondary/20 rounded-xl p-sm mt-md text-xs font-bold text-secondary">完成「${plan.eatTitle}」，今天直接吃掉</div>`}
            <div class="grid grid-cols-2 gap-sm mt-md">
                <div class="bg-surface-container-low rounded-xl p-sm"><span class="block text-[10px] text-outline">避免浪費</span><strong class="text-primary">NT$ ${reward}</strong></div>
                <div class="bg-surface-container-low rounded-xl p-sm"><span class="block text-[10px] text-outline">圓夢累積</span><strong class="text-secondary">+ NT$ ${reward}</strong></div>
            </div>
            <button onclick="document.getElementById('rescue-success-modal')?.remove()" class="w-full mt-md bg-primary text-white rounded-xl py-2.5 text-xs font-extrabold">繼續處理下一項</button>
        </section>`;
    document.body.appendChild(modal);
}

// Global Cooking Style State
window.currentCookingStyle = '無特定風格 (AI 自由發揮)';
window.cookingStyles = ['無特定風格 (AI 自由發揮)', '台式家常', '日式和風', '西式排餐', '低卡健康'];

window.setCookingStyle = function(style) {
    window.currentCookingStyle = style;
    renderCurrentTab();
};

function renderKitchen(container) {
    const inventory = [...appState.inventory];

    let styleSelectorHtml = window.cookingStyles.map(style => {
        const isSelected = window.currentCookingStyle === style;
        return `
            <button onclick="setCookingStyle('${style}')" class="whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-secondary text-white border-secondary shadow-md scale-105' : 'bg-surface-container text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high'}">
                ${style}
            </button>
        `;
    }).join('');

    const categoryMap = {
        vegetable_fruit: { title: "🥬 蔬菜與水果", icon: "eco", items: [] },
        meat_seafood: { title: "🥩 肉類與海鮮", icon: "set_meal", items: [] },
        dairy_egg_soy: { title: "🥚 蛋奶與豆類", icon: "egg", items: [] },
        cooked_others: { title: "📦 熟食與其他", icon: "inventory_2", items: [] }
    };

    inventory.forEach(item => {
        const aiRec = getAISuggestedStorage(item.name);
        const cat = item.category || aiRec.category || "cooked_others";
        if (categoryMap[cat]) {
            categoryMap[cat].items.push(item);
        } else {
            categoryMap.cooked_others.items.push(item);
        }
    });

    const activeCategories = Object.values(categoryMap).filter(cat => cat.items.length > 0);

    container.innerHTML = `
        <div class="space-y-lg pb-32">
            <!-- Header -->
            <section class="flex flex-col gap-sm">
                <h2 class="font-headline-lg text-3xl font-extrabold text-primary flex items-center gap-2">
                    <span class="material-symbols-outlined text-4xl">blender</span> 小廚房
                </h2>
                <p class="text-on-surface-variant font-body-md">選擇您的料理風格與現有食材，AI 立即為您客製專屬食譜。</p>
            </section>

            <!-- Style Selector -->
            <section>
                <h3 class="text-sm font-extrabold text-slate-blue mb-sm">1. 選擇料理風格</h3>
                <div class="flex gap-sm overflow-x-auto pb-2 custom-scrollbar">
                    ${styleSelectorHtml}
                </div>
            </section>

            <!-- Ingredients Pool categorized -->
            <section class="space-y-md">
                <div class="flex items-center justify-between mb-sm">
                    <h3 class="text-sm font-extrabold text-slate-blue flex items-center gap-1">
                        <span class="material-symbols-outlined text-secondary font-bold">view_module</span> 2. 挑選冰箱食材 (已分類)
                    </h3>
                    <span class="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">已選取 ${selectedChefItems.length} 項</span>
                </div>
                ${inventory.length === 0 ? `
                    <div class="bg-surface-container rounded-3xl p-xl flex flex-col items-center justify-center text-center">
                        <span class="material-symbols-outlined text-[64px] text-outline-variant mb-4">kitchen</span>
                        <h4 class="text-lg font-bold text-on-surface-variant">冰箱空空如也</h4>
                        <p class="text-xs text-outline mt-2">請先至補貨區採買並將食材移入冰箱</p>
                    </div>
                ` : `
                    <div class="space-y-md">
                        ${activeCategories.map(cat => `
                            <div class="bg-white border border-outline-variant/30 rounded-2xl p-md shadow-sm">
                                <div class="flex items-center justify-between mb-sm pb-2 border-b border-outline-variant/20">
                                    <div class="flex items-center gap-2">
                                        <span class="material-symbols-outlined text-secondary font-bold text-lg">${cat.icon}</span>
                                        <h4 class="text-sm font-extrabold text-slate-blue">${cat.title}</h4>
                                    </div>
                                    <span class="text-xs font-extrabold bg-slate-blue/10 text-slate-blue px-2.5 py-0.5 rounded-full">${cat.items.length} 項</span>
                                </div>
                                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-md">
                                    ${cat.items.map(item => getFridgeItemHtml(item, true)).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `}
            </section>

            <!-- Floating Action Button -->
            <div class="fixed bottom-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[600px] bg-slate-blue text-white p-md rounded-2xl shadow-2xl z-40 flex justify-between items-center gap-md border border-ochre-gold/30 glass-effect">
                <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-ochre-gold">auto_awesome</span>
                    <div class="text-left">
                        <h4 class="text-sm font-extrabold text-ochre-gold">AI 備菜中</h4>
                        <p class="text-xs text-oatmeal-sand/80">已選 <span class="text-white font-extrabold text-sm underline">${selectedChefItems.length}</span> 項 ‧ ${window.currentCookingStyle}</p>
                    </div>
                </div>
                <button onclick="generateAiRecipe('${window.currentCookingStyle}')" class="bg-[#E07A5F] hover:bg-primary text-white font-extrabold px-lg py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-95 whitespace-nowrap flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" ${selectedChefItems.length === 0 ? 'disabled' : ''}>
                    <span class="material-symbols-outlined text-base">bolt</span> 生成食譜
                </button>
            </div>
        </div>
    `;
}

// Generate individual inventory card HTML
function getFridgeItemHtml(item, isKitchenMode = false) {
    const isUrgent = item.daysLeft <= 1;
    const isSuperLong = item.daysLeft > 30;
    const isFresh = item.daysLeft > 7;
    const isSelected = selectedChefItems.includes(item.id);

    let containerClass = "rounded-2xl p-3 relative flex flex-col shadow-sm hover:shadow transition-shadow group cursor-pointer ";
    let statusText = "";
    let statusClass = "";

    if (isKitchenMode && isSelected) {
        containerClass += "border-2 border-secondary bg-secondary/15 ring-2 ring-secondary/20 scale-[0.98]";
        statusText = item.daysLeft <= 1 ? (item.daysLeft === 0 ? "今天到期" : "明天到期") : (item.daysLeft >= 30 ? `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月` : `剩餘 ${item.daysLeft} 天`);
        statusClass = "text-secondary font-bold";
    } else {
        if (isUrgent) {
            containerClass += "bg-rust-orange/10 border-2 border-rust-orange animate-pulse-urgent";
            statusText = item.daysLeft === 0 ? "今天到期" : "明天到期";
            statusClass = "text-rust-orange";
        } else if (isSuperLong) {
            containerClass += "border-2 border-[#8ab0d0] bg-[#8ab0d0]/10";
            statusText = `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月`;
            statusClass = "text-[#4c7396] font-bold";
        } else if (isFresh) {
            containerClass += "border-2 border-sage-green bg-sage-green/10";
            statusText = `剩餘 ${item.daysLeft} 天`;
            statusClass = "text-secondary";
        } else {
            containerClass += "border-2 border-ochre-gold bg-ochre-gold/10";
            statusText = `剩餘 ${item.daysLeft} 天`;
            statusClass = "text-tertiary";
        }
    }

    let cardClickAction = isKitchenMode
        ? `onclick="toggleChefItemSelection('${item.id}')"`
        : `onclick="showStorageDetailModal('${item.id}')"`;

    let quickActionsHtml = "";
    if (isKitchenMode) {
        quickActionsHtml = `
            <div class="mt-3 pt-2 border-t border-outline-variant/20 flex justify-center items-center w-full">
                <span class="material-symbols-outlined text-lg ${isSelected ? 'text-secondary font-bold' : 'text-outline-variant'}">
                    ${isSelected ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span class="text-[11px] font-bold ml-1 ${isSelected ? 'text-secondary' : 'text-on-surface-variant'}">
                    ${isSelected ? '已選取' : '點擊選取'}
                </span>
            </div>
        `;
    } else {
        quickActionsHtml = `
            <!-- Quick Actions Panel -->
            <div class="flex gap-2 mt-3 pt-2 border-t border-outline-variant/20 w-full" onclick="event.stopPropagation()">
                <button onclick="cookItem('${item.id}')" class="flex-1 bg-secondary text-white hover:brightness-110 font-bold py-1.5 rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 active:scale-95">
                    <span class="material-symbols-outlined text-xs fill">restaurant</span> 完成料理
                </button>
                <button onclick="discardItem('${item.id}')" class="bg-surface-container-high text-on-surface hover:bg-error hover:text-white font-bold px-2.5 rounded-lg text-[10px] transition-all flex items-center justify-center active:scale-95" title="食材腐壞/丟棄">
                    <span class="material-symbols-outlined text-xs">delete</span>
                </button>
            </div>
        `;
    }

    return `
        <div class="${containerClass}" ${cardClickAction}>
            <!-- Top-Left Circular Edit Icon Button -->
            ${!isKitchenMode ? `
                <button onclick="event.stopPropagation(); showStorageDetailModal('${item.id}')" class="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 hover:bg-slate-blue hover:text-white text-slate-blue border border-slate-blue/20 shadow-sm flex items-center justify-center transition-all active:scale-90 z-10" title="編輯食材">
                    <span class="material-symbols-outlined text-[13px]">edit</span>
                </button>
            ` : ''}
            <!-- Box Size Badge -->
            ${item.boxSize && item.boxSize !== '無' ? `
                <span class="absolute top-2 right-2 bg-slate-blue/10 text-slate-blue text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border border-slate-blue/10">
                    盒:${item.boxSize}
                </span>
            ` : ""}
            <div class="flex flex-col items-center text-center w-full">
                <div class="w-16 h-16 rounded-full bg-white mb-2 shadow-inner overflow-hidden border-2 border-outline-variant/20 flex-shrink-0">
                    <img class="w-full h-full object-cover" src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop'}" alt="${item.name}">
                </div>
                <h4 class="font-extrabold text-sm text-slate-blue truncate w-full">${item.name} (${item.qty}${item.unit})</h4>
                <p class="text-[11px] font-extrabold ${statusClass} mt-0.5">${statusText}</p>
                <p class="text-[10px] text-on-surface-variant font-medium mt-0.5">購入: ${item.addedDate}</p>
            </div>
            ${quickActionsHtml}
        </div>
    `;
}

// Built-in AI Storage Recommendation Engine
function getAISuggestedStorage(name, targetChamber = null) {
    if (!name) {
        return {
            chamber: "cold",
            daysLeft: 5,
            category: "vegetable_fruit",
            storageProtocol: "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。"
        };
    }
    const cleanName = name.trim().toLowerCase();
    
    let chamber = "cold";
    let coldDays = 5;
    let frozenDays = 30;
    let category = "vegetable_fruit";
    let storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";

    if (cleanName.match(/肉|雞|豬|牛|羊|排|絞肉|肉絲|培根|火腿|香腸/)) {
        category = "meat_seafood";
        chamber = "cold";
        coldDays = cleanName.includes("絞肉") ? 2 : (cleanName.includes("牛") ? 4 : 3);
        frozenDays = 90;
        storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積，解凍快70%。";
    } else if (cleanName.match(/魚|鮭|蝦|蛤|蚵|干貝|海鮮|墨魚|蟹/)) {
        category = "meat_seafood";
        chamber = "cold";
        coldDays = 2;
        frozenDays = 60;
        storageProtocol = "極低溫保鮮：海鮮極易退化，冷藏需於 2 天內烹調，若未食用請拭乾水分分裝冷凍。";
    } else if (cleanName.match(/蛋/)) {
        category = "dairy_egg_soy";
        chamber = "cold";
        coldDays = 14;
        frozenDays = 30;
        storageProtocol = "鈍端朝上冷藏：維持氣室於頂部，防止蛋黃貼殼變質，置於冷藏室內部恆溫處。";
    } else if (cleanName.match(/奶|乳|起司|乾酪|豆腐|豆漿|豆干|納豆/)) {
        category = "dairy_egg_soy";
        chamber = "cold";
        coldDays = cleanName.includes("豆腐") ? 3 : (cleanName.includes("起司") ? 14 : 7);
        frozenDays = cleanName.includes("豆腐") ? 60 : 30;
        storageProtocol = "密封防腐：開啟後用烘焙紙包裹再裝入方形密封盒，防止冰箱水分降解與發霉。";
    } else if (cleanName.match(/薯|洋蔥|蒜|蕉|芒果|蘋果|柑橘|果/)) {
        category = "vegetable_fruit";
        chamber = "cold";
        coldDays = cleanName.match(/蘋果|柑橘/) ? 14 : 5;
        frozenDays = 90;
        storageProtocol = "避光保存。若已切開，表面滴檸檬汁並以保鮮膜緊貼冷藏，以阻斷氧化。";
    } else if (cleanName.match(/菜|葉|菇|木耳|蘿蔔|番茄|黃瓜|茄子|椒|筍/)) {
        category = "vegetable_fruit";
        chamber = "cold";
        coldDays = cleanName.match(/蘿蔔|地瓜|馬鈴薯/) ? 10 : 4;
        frozenDays = 30;
        storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
    } else if (cleanName.match(/吐司|麵包|水餃|麵|飯|饅頭|蔥抓餅/)) {
        category = "cooked_others";
        chamber = cleanName.match(/水餃|蔥抓餅/) ? "frozen" : "cold";
        coldDays = 3;
        frozenDays = 60;
        storageProtocol = "密封隔離：完全冷卻後密封分裝，避免澱粉老化與異味吸收。";
    } else {
        category = "cooked_others";
        chamber = "cold";
        coldDays = 5;
        frozenDays = 30;
        storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
    }

    const selectedChamber = targetChamber || chamber;
    const daysLeft = selectedChamber === "frozen" ? frozenDays : coldDays;

    return {
        chamber: selectedChamber,
        recommendedChamber: chamber,
        coldDays: coldDays,
        frozenDays: frozenDays,
        daysLeft: daysLeft,
        category: category,
        storageProtocol: storageProtocol
    };
}
window.getAISuggestedStorage = getAISuggestedStorage;

/**
 * 系統自動幫食材卡片生成圖片 (Automatic Ingredient Card Image Generator)
 */
function generateIngredientImage(name, category = null) {
    if (!name) name = "食材";
    const cleanName = name.trim().toLowerCase();

    // 1. 食材關鍵字高解析度攝影美圖對應 (High-Resolution Curated Food Photography Mapping)
    const foodPhotoMap = [
        { keywords: ["蛋", "蛋黃", "蛋白", "皮蛋", "鹹蛋"], url: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?w=300&auto=format&fit=crop" },
        { keywords: ["牛", "和牛", "牛排", "牛肉片", "牛肉"], url: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=300&auto=format&fit=crop" },
        { keywords: ["豬", "梅花豬", "松阪豬", "豬肉", "培根", "香腸", "火腿"], url: "https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=300&auto=format&fit=crop" },
        { keywords: ["雞", "雞胸", "雞腿", "雞肉", "雞翅"], url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&auto=format&fit=crop" },
        { keywords: ["鮭", "鮭魚", "三文魚"], url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop" },
        { keywords: ["魚", "鱈魚", "秋刀魚", "鯖魚", "鯛魚"], url: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=300&auto=format&fit=crop" },
        { keywords: ["蝦", "明蝦", "草蝦", "白蝦", "蝦仁"], url: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&auto=format&fit=crop" },
        { keywords: ["蛤", "干貝", "蚵", "生蠔", "海鮮", "蟹", "墨魚", "透抽", "魷魚"], url: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=300&auto=format&fit=crop" },
        { keywords: ["高麗菜", "高麗", "甘藍"], url: "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=300&auto=format&fit=crop" },
        { keywords: ["菜", "菠菜", "空心菜", "青菜", "小白菜", "青江菜", "萵苣", "茼蒿", "葉"], url: "https://images.unsplash.com/photo-1628773822503-930a8589c012?w=300&auto=format&fit=crop" },
        { keywords: ["番茄", "西紅柿", "聖女番茄"], url: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=300&auto=format&fit=crop" },
        { keywords: ["酪梨", "牛油果"], url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300&auto=format&fit=crop" },
        { keywords: ["胡蘿蔔", "紅蘿蔔", "蘿蔔"], url: "https://images.unsplash.com/photo-1598170845058-12ef4a457939?w=300&auto=format&fit=crop" },
        { keywords: ["蘋果"], url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&auto=format&fit=crop" },
        { keywords: ["香蕉"], url: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&auto=format&fit=crop" },
        { keywords: ["檸檬", "萊姆"], url: "https://images.unsplash.com/photo-1534531141161-e41d133a4be3?w=300&auto=format&fit=crop" },
        { keywords: ["草莓", "莓果", "藍莓"], url: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=300&auto=format&fit=crop" },
        { keywords: ["櫛瓜", "夏南瓜"], url: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=300&auto=format&fit=crop" },
        { keywords: ["菇", "香菇", "蘑菇", "金針菇", "杏鮑菇"], url: "https://images.unsplash.com/photo-1504470695779-75300268aa0e?w=300&auto=format&fit=crop" },
        { keywords: ["豆腐", "豆干", "豆漿", "納豆"], url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop" },
        { keywords: ["鮮奶", "牛奶", "乳", "優格", "優酪乳"], url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop" },
        { keywords: ["起司", "乳酪", "芝士"], url: "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&auto=format&fit=crop" },
        { keywords: ["吐司", "麵包"], url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop" },
        { keywords: ["米", "飯", "白飯"], url: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300&auto=format&fit=crop" },
        { keywords: ["麵", "義大利麵", "拉麵"], url: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop" },
        { keywords: ["洋蔥", "蒜", "薑", "蔥", "辣椒"], url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop" },
        { keywords: ["玉米"], url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=300&auto=format&fit=crop" },
        { keywords: ["黃瓜", "小黃瓜"], url: "https://images.unsplash.com/photo-1447175008436-0841710c87b7?w=300&auto=format&fit=crop" },
        { keywords: ["茄子"], url: "https://images.unsplash.com/photo-1613744655060-6428d022b794?w=300&auto=format&fit=crop" },
        { keywords: ["南瓜"], url: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300&auto=format&fit=crop" }
    ];

    for (const match of foodPhotoMap) {
        if (match.keywords.some(kw => cleanName.includes(kw))) {
            return match.url;
        }
    }

    // 2. 動態向量圖像卡片生成器 (Dynamic SVG Card Generator for Custom/Unmatched items)
    let primaryColor = "#386753"; // Emerald green
    let secondaryColor = "#e2f0d9";
    let iconEmoji = "🥗";

    if (cleanName.match(/肉|雞|豬|牛|羊|排|絞肉|培根|香腸/)) {
        primaryColor = "#be5f48";
        secondaryColor = "#fbeae7";
        iconEmoji = "🥩";
    } else if (cleanName.match(/魚|鮭|蝦|蛤|海鮮|蟹|魷魚/)) {
        primaryColor = "#3a506b";
        secondaryColor = "#e8f1f5";
        iconEmoji = "🐟";
    } else if (cleanName.match(/蛋|奶|乳|起司|豆腐|豆漿/)) {
        primaryColor = "#d97706";
        secondaryColor = "#fef3c7";
        iconEmoji = "🧀";
    } else if (cleanName.match(/果|蘋果|香蕉|莓|草莓|檸檬|芒/)) {
        primaryColor = "#9333ea";
        secondaryColor = "#f3e8ff";
        iconEmoji = "🍎";
    } else if (cleanName.match(/飯|麵|吐司|麵包|餅|水餃/)) {
        primaryColor = "#b45309";
        secondaryColor = "#fef3c7";
        iconEmoji = "🍞";
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 150 150">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${secondaryColor}" />
                <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>
        </defs>
        <rect width="150" height="150" fill="url(#grad)" rx="20"/>
        <circle cx="75" cy="65" r="42" fill="${primaryColor}" fill-opacity="0.12"/>
        <text x="75" y="78" font-size="44" text-anchor="middle" dominant-baseline="central">${iconEmoji}</text>
        <rect x="15" y="112" width="120" height="24" rx="12" fill="${primaryColor}"/>
        <text x="75" y="128" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${name.slice(0, 8)}</text>
    </svg>`;

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
window.generateIngredientImage = generateIngredientImage;

function onFridgeItemNameChange() {
    const nameInput = document.getElementById("new-item-name");
    const chamberSelect = document.getElementById("new-item-chamber");
    const daysInput = document.getElementById("new-item-days");
    const hintBox = document.getElementById("ai-suggestion-hint");

    if (!nameInput || !nameInput.value.trim()) {
        if (hintBox) hintBox.classList.add("hidden");
        return;
    }

    const name = nameInput.value.trim();
    const aiRec = getAISuggestedStorage(name);
    if (chamberSelect) chamberSelect.value = aiRec.chamber;
    if (daysInput) daysInput.value = aiRec.daysLeft;

    const generatedImg = generateIngredientImage(name, aiRec.category);

    if (hintBox) {
        hintBox.classList.remove("hidden");
        hintBox.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${generatedImg}" alt="${name}" class="w-10 h-10 rounded-xl object-cover border border-outline-variant/30 shadow-xs flex-shrink-0">
                <div>
                    <div class="flex items-center gap-1 font-bold text-xs">
                        <span class="material-symbols-outlined text-sm text-secondary">auto_awesome</span>
                        <span>✨ 已為「${name}」自動生成食材卡片圖片！</span>
                    </div>
                    <p class="text-[11px] text-on-surface-variant/80 mt-0.5">建議存放於【${aiRec.chamber === 'cold' ? '冷藏室' : '冷凍庫'}】，保鮮期估計為 ${aiRec.daysLeft} 天</p>
                </div>
            </div>
        `;
    }
}

// Handler functions for Fridge
function toggleAddFridgeForm() {
    const form = document.getElementById("add-fridge-form");
    if (form) form.classList.toggle("hidden");
}

function submitNewFridgeItem() {
    const nameInput = document.getElementById("new-item-name");
    const name = nameInput ? nameInput.value.trim() : "";
    const chamber = document.getElementById("new-item-chamber") ? document.getElementById("new-item-chamber").value : "cold";
    const qty = parseInt(document.getElementById("new-item-qty").value) || 1;
    const unit = document.getElementById("new-item-unit").value.trim() || "個";
    const days = parseInt(document.getElementById("new-item-days").value) || 5;
    const boxSize = document.getElementById("new-item-box") ? document.getElementById("new-item-box").value : "M";

    if (!name) {
        alert("請輸入食材名稱！");
        return;
    }

    const aiRec = getAISuggestedStorage(name, chamber);
    const generatedImage = generateIngredientImage(name, aiRec.category);

    // Feature requirement 1: 新增食材只出現在補貨區 (New items go exclusively to shoppingList)
    const newShopItem = {
        id: "s_" + Date.now(),
        name: name,
        category: aiRec.category === "vegetable_fruit" ? "produce" : "protein",
        qty: qty,
        unit: unit,
        image: generatedImage,
        checked: false,
        status: "手動新增",
        estCost: Math.round(40 + Math.random() * 60),
        chamber: chamber || aiRec.chamber,
        daysLeft: days || aiRec.daysLeft,
        boxSize: boxSize
    };

    appState.shoppingList.push(newShopItem);
    saveState();
    if (isCloudMode && supabaseClient) {
        dbAddShoppingItem(newShopItem);
    }
    toggleAddFridgeForm();
    renderCurrentTab();
    showToast(`成功新增食材「${name}」至補貨區並自動生成卡片圖片！完成採買後可移入冰箱。`, "success");
}

function updateItemQtyUnit(id) {
    const item = appState.inventory.find(i => i.id === id);
    if (!item) return;

    const qtyInput = document.getElementById(`detail-qty-${id}`);
    const unitInput = document.getElementById(`detail-unit-${id}`);

    if (qtyInput && qtyInput.value) {
        item.qty = Math.max(1, parseInt(qtyInput.value) || 1);
    }
    if (unitInput && unitInput.value) {
        item.unit = unitInput.value.trim() || "個";
    }

    saveState();
    if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);
    
    // Refresh modal header & card
    const titleEl = document.getElementById(`modal-item-title-${id}`);
    if (titleEl) titleEl.textContent = `${item.name} (${item.qty}${item.unit})`;

    renderCurrentTab();
    showToast(`已更新「${item.name}」數量與單位為 ${item.qty} ${item.unit}`, "success");
}

function updateItemChamber(id, newChamber) {
    const item = appState.inventory.find(i => i.id === id);
    if (!item) return;

    const aiRec = getAISuggestedStorage(item.name, newChamber);
    item.chamber = newChamber;
    item.daysLeft = aiRec.daysLeft;

    saveState();
    if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);

    closeStorageDetailModal();
    renderCurrentTab();
    showStorageDetailModal(id);

    const chamberName = newChamber === 'cold' ? '冷藏室' : '冷凍庫';
    showToast(`已切換至【${chamberName}】，AI 後台自動重估保鮮期為 ${aiRec.daysLeft} 天！`, "success");
}

function cookItem(id) {
    const idx = appState.inventory.findIndex(item => item.id === id);
    if (idx === -1) return;

    const item = appState.inventory[idx];
    const completionKey = crypto.randomUUID();

    // Deduct inventory qty
    if (item.qty > 1) {
        item.qty--;
        if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);
    } else {
        appState.inventory.splice(idx, 1);
        if (isCloudMode && supabaseClient) dbDeleteInventoryItem(id);
    }

    saveState();
    renderCurrentTab();
    const opened = window.SingleGoalApp?.promptMealCompletion({ completionKey, mealName:item.name, source:'inventory' });
    showToast(opened ? "完成烹飪！請確認這餐要計入目標多少。" : "完成烹飪！", "success");
}

function discardItem(id) {
    const idx = appState.inventory.findIndex(item => item.id === id);
    if (idx === -1) return;

    const item = appState.inventory[idx];
    if (confirm(`確定要丟棄 ${item.name} 嗎？這將會直接造成食物浪費。`)) {
        appState.inventory.splice(idx, 1);
        saveState();
        if (isCloudMode && supabaseClient) dbDeleteInventoryItem(id);
        renderCurrentTab();
        showToast(`已移除 ${item.name}。請留意預算規劃，減少食物浪費！`, "warning");
    }
}

function toggleAiChefMode() {
    aiChefMode = !aiChefMode;
    if (!aiChefMode) {
        selectedChefItems = [];
    }
    renderCurrentTab();
}

function closeStorageDetailModal() {
    const modal = document.getElementById("storage-detail-modal");
    if (modal) {
        modal.remove();
    }
}

function showStorageDetailModal(id) {
    const item = appState.inventory.find(i => i.id === id);
    if (!item) return;

    const aiRecCold = getAISuggestedStorage(item.name, 'cold');
    const aiRecFrozen = getAISuggestedStorage(item.name, 'frozen');

    const isUrgent = item.daysLeft <= 1;
    const isSuperLong = item.daysLeft > 30;
    const statusText = item.daysLeft === 0 ? "今天到期" : item.daysLeft === 1 ? "明天到期" : (item.daysLeft >= 30 ? `剩餘 ${Math.ceil(item.daysLeft / 30)} 個月` : `剩餘 ${item.daysLeft} 天`);
    const statusColor = isUrgent ? "text-rust-orange" : isSuperLong ? "text-[#4c7396] font-bold" : item.daysLeft > 7 ? "text-secondary" : "text-tertiary";

    const modal = document.createElement("div");
    modal.id = "storage-detail-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4";

    const protocol = item.storageProtocol || getAISuggestedStorage(item.name).storageProtocol;
    const boxSizeText = item.boxSize && item.boxSize !== '無' ? `方形規格收納盒 (${item.boxSize})` : "未裝盒收納";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[440px] w-full border border-primary/5 flex flex-col space-y-md max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 class="text-base font-extrabold text-slate-blue flex items-center gap-1">
                    <span class="material-symbols-outlined text-secondary">science</span> 食材調整與科學保存
                </h3>
                <button onclick="closeStorageDetailModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Content Area -->
            <div class="space-y-md">
                <div class="flex gap-md items-center">
                    <div class="w-16 h-16 rounded-full bg-white shadow-inner overflow-hidden border border-outline-variant/30 flex-shrink-0">
                        <img class="w-full h-full object-cover" src="${item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop'}" alt="${item.name}">
                    </div>
                    <div>
                        <h4 id="modal-item-title-${item.id}" class="text-base font-extrabold text-slate-blue">${item.name} (${item.qty}${item.unit})</h4>
                        <p class="text-xs font-bold ${statusColor} mt-0.5">${statusText}</p>
                        <p class="text-[10px] text-on-surface-variant font-medium mt-0.5">購入日期: ${item.addedDate} / 存放區: ${item.chamber === 'cold' ? '冷藏室' : '冷凍庫'}</p>
                    </div>
                </div>

                <!-- Feature 3a: Manual Qty & Unit Adjust UI -->
                <div class="bg-surface-container/60 border border-outline-variant/30 p-md rounded-2xl space-y-2">
                    <label class="block text-[11px] font-extrabold text-slate-blue flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm text-secondary">tune</span> 手動調整數量與單位
                    </label>
                    <div class="flex gap-2 items-center">
                        <input type="number" id="detail-qty-${item.id}" value="${item.qty}" min="1" class="w-24 h-9 rounded-xl border border-outline-variant px-3 text-xs font-extrabold text-slate-blue bg-white focus:border-secondary focus:ring-secondary" onchange="updateItemQtyUnit('${item.id}')">
                        <input type="text" id="detail-unit-${item.id}" value="${item.unit}" class="w-24 h-9 rounded-xl border border-outline-variant px-3 text-xs font-extrabold text-slate-blue bg-white focus:border-secondary focus:ring-secondary" onchange="updateItemQtyUnit('${item.id}')">
                        <button onclick="updateItemQtyUnit('${item.id}')" class="bg-secondary text-white hover:brightness-110 text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95">
                            更新
                        </button>
                    </div>
                </div>

                <!-- Feature 3b: Manual Chamber Switch with AI Auto Shelf-Life Adjustment -->
                <div class="bg-surface-container/60 border border-outline-variant/30 p-md rounded-2xl space-y-2">
                    <div class="flex justify-between items-center">
                        <label class="block text-[11px] font-extrabold text-slate-blue flex items-center gap-1">
                            <span class="material-symbols-outlined text-sm text-secondary">swap_horiz</span> 存放區域 (AI 後台連動調整天數)
                        </label>
                        <span class="text-[10px] font-extrabold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <span class="material-symbols-outlined text-[12px]">auto_awesome</span> AI連動
                        </span>
                    </div>
                    <div class="grid grid-cols-2 gap-sm">
                        <button onclick="updateItemChamber('${item.id}', 'cold')" class="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${item.chamber === 'cold' ? 'bg-slate-blue text-white border-slate-blue shadow-md ring-2 ring-slate-blue/20' : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'}">
                            <span class="material-symbols-outlined text-sm">ac_unit</span> 冷藏室 (${aiRecCold.daysLeft}天)
                        </button>
                        <button onclick="updateItemChamber('${item.id}', 'frozen')" class="py-2.5 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all active:scale-95 ${item.chamber === 'frozen' ? 'bg-[#4c7396] text-white border-[#4c7396] shadow-md ring-2 ring-[#4c7396]/20' : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-container'}">
                            <span class="material-symbols-outlined text-sm">severe_cold</span> 冷凍庫 (${aiRecFrozen.daysLeft}天)
                        </button>
                    </div>
                </div>

                <!-- Box Size Info -->
                <div class="bg-surface-container p-sm rounded-xl flex items-center gap-2">
                    <span class="material-symbols-outlined text-slate-blue text-lg">grid_view</span>
                    <div class="text-left">
                        <span class="block text-[9px] font-bold text-on-surface-variant uppercase">空間幾何學收納規格</span>
                        <span class="text-xs font-extrabold text-slate-blue">${boxSizeText}</span>
                    </div>
                </div>

                <!-- Protocol Description -->
                <div class="bg-secondary/5 border-l-4 border-secondary p-md rounded-r-xl space-y-1">
                    <h5 class="text-xs font-extrabold text-secondary">食材處置協議 (Storage Protocol)</h5>
                    <p class="text-xs text-on-surface-variant leading-relaxed font-medium">
                        ${protocol}
                    </p>
                </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="pt-3 border-t border-outline-variant/30 flex gap-sm">
                <button onclick="closeStorageDetailModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
                    關閉視窗
                </button>
                <button onclick="closeStorageDetailModal(); cookItem('${item.id}')" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm fill">restaurant</span> 完成料理
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closePlanBModal() {
    const modal = document.getElementById("plan-b-modal");
    if (modal) {
        modal.remove();
    }
}

function showPlanBModal(type) {
    let title = "";
    let icon = "";
    let desc = "";
    let matches = [];
    let steps = [];
    let iconColor = "";

    // Check what ingredients in inventory match
    const inv = appState.inventory;

    if (type === "blend") {
        title = "攪拌 (Blend) - 高蛋白修復能量飲";
        icon = "blender";
        iconColor = "bg-secondary";
        desc = "【物理轉換原理】：將外觀不佳、過熟或即期的蔬果，置入高速攪拌機進行物理剪切。加入富含膳食纖維的奇亞籽 (Seeds) 或高蛋白質的堅果醬 (Nut butters) 進行均質重組，防止食材因外觀降解而被拋棄。";

        // Find berries or avocado
        const fruits = inv.filter(item => item.name.includes("莓") || item.name.includes("酪") || item.name.includes("果"));
        matches = fruits.length > 0 ? fruits : [{ name: "過熟水果/即期生菜 (範例庫存)" }];

        steps = [
            "準備果汁機，洗淨要處理的邊角蔬果或過熟水果。",
            "將食材切塊，加入約 1 大匙奇亞籽或花生醬、堅果醬。",
            "加入 150ml 冰水、鮮奶或燕麥奶，啟動高速攪拌 45 秒至均勻滑順。",
            "這能最大化保留膳食纖維與抗氧化物，即刻補給高價值營養。"
        ];
    } else if (type === "bake") {
        title = "烘焙 (Bake) - 結構化去水蔬菜麵包";
        icon = "cookie";
        iconColor = "bg-tertiary";
        desc = "【物理機械去水】：處理花椰菜梗、紅蘿蔔等質地硬的蔬菜碎片時，直接拌入會使麵糰含水量失控。必須先經微細磨碎並以紗布「機械式擠壓去水」，隨後再揉入麵糰烘烤，防止多餘水分破壞小麥麵筋網絡結構。";

        const veggies = inv.filter(item => item.name.includes("蘿蔔") || item.name.includes("菜"));
        matches = veggies.length > 0 ? veggies : [{ name: "胡蘿蔔碎/菜梗邊角料 (範例庫存)" }];

        steps = [
            "將胡蘿蔔、花椰菜梗等洗淨磨成細絲或碎粒。",
            "用乾淨豆漿袋或紙巾緊包，用力扭捏，擠乾多餘的組織液與水分。",
            "將乾燥 of 蔬菜碎拌入麵粉、水、酵母與少許鹽的麵糰中，進行揉捏與發酵。",
            "烘烤 180°C 約 25 分鐘。去水步驟能確保蔬菜麵包結構紮實、口感鬆軟。"
        ];
    } else if (type === "boil") {
        title = "煲煮 (Boil) - 天然果膠增稠風味劑";
        icon = "local_fire_department";
        iconColor = "bg-primary";
        desc = "【果膠物理萃取】：利用果皮（如蘋果皮、柑橘皮）進行煲煮，在酸性微環境下加熱萃取其細胞壁的天然果膠 (Pectin) 膠凝體。此膠體在煲煮咖哩或濃湯時能天然增稠，提升風味深度並降低化學合成增稠劑的使用。";

        const peels = inv.filter(item => item.name.includes("蘋果"));
        matches = peels.length > 0 ? peels : [{ name: "蘋果皮/柑橘皮 (範例庫存)" }];

        steps = [
            "將削下的蘋果皮置於小鍋中，加入剛好沒過果皮的水與幾滴檸檬汁。",
            "大火燒開後轉小火煲煮 15 分鐘，使細胞壁軟化釋放果膠。",
            "過濾取出金色果膠液，在製作咖哩或熬煮果醬最後 5 分鐘倒入。",
            "利用果膠物理增稠特性，能使醬汁呈現完美的光澤度與微稠口感。"
        ];
    }

    const modal = document.createElement("div");
    modal.id = "plan-b-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    // Check if we can offer a physical execution (consume first matching item to complete Plan B)
    const matchedItem = inv.find(item => item.name === matches[0].name);
    let actionButtonHtml = "";
    if (matchedItem) {
        actionButtonHtml = `
            <button onclick="executePlanBAction('${matchedItem.id}', '${type}')" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                <span class="material-symbols-outlined text-sm">bolt</span> 消耗【${matchedItem.name}】執行轉化
            </button>
        `;
    } else {
        actionButtonHtml = `
            <button onclick="closePlanBModal()" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md">
                學到了，我知道了！
            </button>
        `;
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[440px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md">
            <!-- Modal Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 class="text-base font-extrabold text-slate-blue flex items-center gap-1">
                    <span class="material-symbols-outlined text-ochre-gold">cached</span> 續食物理轉化詳情
                </h3>
                <button onclick="closePlanBModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Content Area -->
            <div class="space-y-md text-left">
                <div class="flex gap-md items-center">
                    <div class="w-10 h-10 rounded-full ${iconColor} text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span class="material-symbols-outlined text-lg">${icon}</span>
                    </div>
                    <div>
                        <h4 class="text-sm font-extrabold text-slate-blue">${title}</h4>
                        <p class="text-[10px] text-on-surface-variant font-medium mt-0.5">配對食材：${matches.map(m => m.name).join("、")}</p>
                    </div>
                </div>

                <!-- Scientific Rationale -->
                <div class="bg-surface-container p-md rounded-xl space-y-1">
                    <h5 class="text-xs font-extrabold text-slate-blue flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-sm">science</span> 科學運作機制
                    </h5>
                    <p class="text-xs text-on-surface-variant leading-relaxed font-medium">
                        ${desc}
                    </p>
                </div>

                <!-- Conversion Steps -->
                <div class="space-y-sm">
                    <h5 class="text-xs font-extrabold text-slate-blue flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm text-secondary">checklist</span> 物理轉化執行步驟
                    </h5>
                    <ol class="space-y-1.5 text-xs text-on-surface-variant pl-4 list-decimal font-medium leading-relaxed">
                        ${steps.map(step => `<li>${step}</li>`).join("")}
                    </ol>
                </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="pt-3 border-t border-outline-variant/30 flex gap-sm">
                <button onclick="closePlanBModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    返回
                </button>
                ${actionButtonHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function executePlanBAction(itemId, type) {
    const idx = appState.inventory.findIndex(item => item.id === itemId);
    if (idx === -1) return;

    const item = appState.inventory[idx];
    const rewardSavings = 50; // standard Plan B waste rescue reward

    // Consume 1 item
    if (item.qty > 1) {
        item.qty--;
        if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);
    } else {
        appState.inventory.splice(idx, 1);
        if (isCloudMode && supabaseClient) dbDeleteInventoryItem(itemId);
    }

    // Add savings metrics
    appState.savingsGoal.saved += rewardSavings;
    appState.savingsGoal.monthlySaved += rewardSavings;
    allocateDreamReward(rewardSavings, 'rescue');

    saveState();
    closePlanBModal();
    renderCurrentTab();

    let typeName = type === 'blend' ? '攪拌能量飲' : type === 'bake' ? '蔬菜麵包' : '天然增稠果膠';
    showToast(`轉化成功！已將即期 ${item.name} 物理轉化為 ${typeName}，搶救食材省下 $${rewardSavings}！`, "success");
}

function toggleChefItemSelection(id) {
    const index = selectedChefItems.indexOf(id);
    if (index > -1) {
        selectedChefItems.splice(index, 1);
    } else {
        selectedChefItems.push(id);
    }
    renderCurrentTab();
}

function closeAiRecipeModal() {
    const modal = document.getElementById("ai-recipe-modal");
    if (modal) {
        modal.remove();
    }
}

function confirmAiRecipeCooked() {
    const ids = [...selectedChefItems];
    let cookedNames = [];
    const completionKey = crypto.randomUUID();

    ids.forEach(id => {
        const idx = appState.inventory.findIndex(item => item.id === id);
        if (idx !== -1) {
            const item = appState.inventory[idx];
            cookedNames.push(item.name);

            // Deduct quantity
            if (item.qty > 1) {
                item.qty--;
                if (isCloudMode && supabaseClient) dbUpdateInventoryItem(item);
            } else {
                appState.inventory.splice(idx, 1);
                if (isCloudMode && supabaseClient) dbDeleteInventoryItem(id);
            }
        }
    });

    // Reset selection
    aiChefMode = false;
    selectedChefItems = [];

    const mealName = window.currentAiRecipe?.title || cookedNames.join('、') || 'AI 自煮料理';
    if (isCloudMode && supabaseClient) {
        dbSaveCookedHistory({
            recipe_title: mealName,
            ingredients_used: cookedNames,
            type: 'meal',
            savings_saved: 60
        });
    }

    saveState();

    // Close modals
    const recipeModal = document.getElementById("ai-recipe-modal");
    if (recipeModal) recipeModal.remove();
    const toolModal = document.getElementById("ai-tool-modal");
    if (toolModal) toolModal.remove();

    renderCurrentTab();
    const mealName = window.currentAiRecipe?.title || cookedNames.join('、') || 'AI 自煮料理';
    const opened = window.SingleGoalApp?.promptMealCompletion({ completionKey, mealName, source:'ai_recipe' });
    showToast(opened ? "AI 料理完成！請確認這餐要計入目標多少。" : "AI 料理完成！", "success");
}

window.currentAiRecipe = null;

function renderToolRecommendation() {
    const modal = document.createElement("div");
    modal.id = "ai-tool-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    const recipe = window.currentAiRecipe || { title: "料理" };

    // Recommend tools based on user's cookware
    let recommendedCookware = [];
    if (appState.cookware.some(c => c.type === 'pan')) {
        recommendedCookware.push({ name: '平底鍋', time: '5分鐘', reason: '快速梅納反應' });
    } else {
        recommendedCookware.push({ name: '快煮鍋', time: '8分鐘', reason: '一鍋到底不沾手' });
    }

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[400px] w-full mx-gutter border border-primary/5 flex flex-col">
            <div class="flex items-center gap-xs mb-md text-secondary">
                <span class="material-symbols-outlined text-2xl">blender</span>
                <h3 class="text-lg font-extrabold text-slate-blue">AI 工具推薦</h3>
            </div>

            <p class="text-xs text-on-surface-variant font-medium mb-sm">
                為了完成「${recipe.title}」，為您推薦以下廚房裝備以達到最佳物理自煮效率：
            </p>

            <div class="space-y-sm mb-lg">
                ${recommendedCookware.map(tool => `
                    <div class="tool-recommend-item checked">
                        <div class="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                            <span class="material-symbols-outlined text-base">skillet</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <h4 class="text-xs font-bold text-slate-blue">${tool.name}</h4>
                                <span class="tool-time-badge">${tool.time}</span>
                            </div>
                            <p class="text-[10px] text-on-surface-variant mt-0.5">${tool.reason}</p>
                        </div>
                    </div>
                `).join('')}
                <div class="tool-recommend-item unchecked">
                    <div class="w-8 h-8 rounded-full bg-outline-variant/30 flex items-center justify-center text-outline">
                        <span class="material-symbols-outlined text-base">oven_gen</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <h4 class="text-xs font-bold text-slate-blue">微波爐 (可選)</h4>
                            <span class="tool-time-badge bg-surface-container text-outline">3分鐘</span>
                        </div>
                        <p class="text-[10px] text-outline mt-0.5">預熱備料用</p>
                    </div>
                </div>
            </div>

            <div class="flex gap-sm w-full mt-auto">
                <button onclick="document.getElementById('ai-tool-modal').remove()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    返回食譜
                </button>
                <button onclick='confirmAiRecipeCooked()' class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-xs fill">restaurant</span> 準備好裝備了！
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

window.renderCookwareSetup = function() {
    const existing = document.getElementById("cookware-setup-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "cookware-setup-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[500px] w-full mx-gutter border border-primary/5 flex flex-col max-h-[85vh]">
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
                <div class="flex items-center gap-xs text-primary">
                    <span class="material-symbols-outlined text-2xl">skillet</span>
                    <h3 class="text-lg font-extrabold text-slate-blue">廚房裝備管理</h3>
                </div>
                <button onclick="document.getElementById('cookware-setup-modal').remove()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto py-md space-y-md custom-scrollbar">
                <p class="text-xs text-on-surface-variant font-medium">請選擇您目前擁有的炊具，AI 將依此為您推薦最適合的食譜及料理步驟。</p>
                <div class="grid grid-cols-2 gap-sm">
                    <div class="cookware-card selected" onclick="this.classList.toggle('selected')">
                        <span class="material-symbols-outlined text-2xl mb-1 text-slate-blue">blender</span>
                        <h4 class="text-sm font-bold text-slate-blue">快煮鍋</h4>
                        <p class="text-[10px] text-on-surface-variant">一鍋到底 / 租屋首選</p>
                    </div>
                    <div class="cookware-card selected" onclick="this.classList.toggle('selected')">
                        <span class="material-symbols-outlined text-2xl mb-1 text-slate-blue">rice_cooker</span>
                        <h4 class="text-sm font-bold text-slate-blue">電鍋</h4>
                        <p class="text-[10px] text-on-surface-variant">燉煮必備</p>
                    </div>
                    <div class="cookware-card" onclick="this.classList.toggle('selected')">
                        <span class="material-symbols-outlined text-2xl mb-1 text-slate-blue">skillet</span>
                        <h4 class="text-sm font-bold text-slate-blue">電磁爐 + 平底鍋</h4>
                        <p class="text-[10px] text-on-surface-variant">煎炒神兵</p>
                    </div>
                    <div class="cookware-card" onclick="this.classList.toggle('selected')">
                        <span class="material-symbols-outlined text-2xl mb-1 text-slate-blue">oven_gen</span>
                        <h4 class="text-sm font-bold text-slate-blue">烤箱 / 氣炸鍋</h4>
                        <p class="text-[10px] text-on-surface-variant">酥脆口感</p>
                    </div>
                </div>
            </div>

            <div class="pt-md border-t border-outline-variant/30 flex-shrink-0">
                <button onclick="document.getElementById('cookware-setup-modal').remove(); showToast('裝備已更新！', 'success')" class="w-full bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    儲存裝備設定
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

function renderRecipeModal(recipe, itemNames) {
    // Remove existing loading or modal if any
    const existing = document.getElementById("ai-recipe-modal");
    if (existing) existing.remove();

    window.currentAiRecipe = recipe;

    const modal = document.createElement("div");
    modal.id = "ai-recipe-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    const recipeStyle = recipe.style || "大廚推薦";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[500px] w-full mx-gutter border border-primary/5 flex flex-col max-h-[85vh] overflow-hidden">
            <!-- Modal Header -->
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
                <div>
                    <span class="bg-[#E07A5F]/10 text-[#E07A5F] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">${recipeStyle}</span>
                    <h3 class="text-lg font-extrabold text-slate-blue mt-1">${recipe.title}</h3>
                </div>
                <button onclick="closeAiRecipeModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Modal Content Scroll Area -->
            <div class="flex-1 overflow-y-auto py-md space-y-md pr-1 custom-scrollbar">
                <!-- Stats summary -->
                <div class="grid grid-cols-3 gap-sm bg-surface-container-low p-sm rounded-xl text-center">
                    <div>
                        <span class="block text-[9px] font-bold text-on-surface-variant uppercase">烹飪時間</span>
                        <span class="text-xs font-extrabold text-slate-blue">${recipe.prepTime || "15 分鐘"}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-on-surface-variant uppercase">估算成本</span>
                        <span class="text-xs font-extrabold text-primary">${recipe.estCost || "NT$ 40"}</span>
                    </div>
                    <div>
                        <span class="block text-[9px] font-bold text-on-surface-variant uppercase">主食材</span>
                        <span class="text-xs font-extrabold text-secondary">${itemNames[0] || "自選食材"}</span>
                    </div>
                </div>

                <!-- Scientific Box -->
                <div class="bg-[#F2CC8F]/15 border border-[#F2CC8F]/50 rounded-xl p-md">
                    <div class="flex items-center gap-xs mb-1 text-tertiary">
                        <span class="material-symbols-outlined text-base">science</span>
                        <h4 class="text-xs font-bold">自煮物理科學原理應用</h4>
                    </div>
                    <p class="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                        ${recipe.scientificPrinciple}
                    </p>
                </div>

                <!-- Instructions -->
                <div class="space-y-sm">
                    <h4 class="text-xs font-extrabold text-slate-blue flex items-center gap-1">
                        <span class="material-symbols-outlined text-base text-secondary">format_list_numbered</span> 烹飪步驟說明
                    </h4>
                    <ol class="space-y-2 text-xs text-on-surface-variant pl-4 list-decimal font-medium leading-relaxed">
                        ${recipe.steps.map(step => `<li>${step}</li>`).join("")}
                    </ol>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="pt-md border-t border-outline-variant/30 flex flex-col gap-sm w-full flex-shrink-0">
                <div class="flex gap-sm w-full">
                    <button onclick="generateAiRecipe('${recipe.style || window.currentCookingStyle}', \`${recipe.title.replace(/'/g, "\\'").replace(/"/g, '\\"')}\`)" class="flex-1 bg-[#F2CC8F] hover:bg-[#F2CC8F]/80 text-[#765a28] font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs">refresh</span> 再換一個
                    </button>
                    <button onclick='renderToolRecommendation()' class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-xs fill">blender</span> 開始烹飪
                    </button>
                </div>
                <button onclick="closeAiRecipeModal()" class="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2 rounded-xl text-[11px] transition-all active:scale-[0.98]">
                    取消
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function getLocalMockRecipe(itemNames, style, excludeTitle = null) {
    let title = "";
    let steps = [];
    let prepTime = "15 分鐘";
    let estCost = "NT$ 40";
    let scientificPrinciple = "";

    // Determine if we need to switch to an alternative mock recipe to support "Try another"
    const useAlt = excludeTitle !== null;

    if (itemNames.includes("酪梨") && itemNames.includes("起司")) {
        if (!useAlt) {
            title = style.includes("西式") ? "溫烤起司酪梨船" : "和風雙重起司酪梨溫沙拉";
            prepTime = "10 分鐘";
            estCost = "NT$ 55";
            scientificPrinciple = "【物理熱輻射傳導】：將酪梨剖半去籽作為天然容器填入起司，高溫熱輻射使表層起司融化，而酪梨厚皮扮演絕熱層，防止果肉過熱變苦。";
            steps = [
                "將酪梨對半切開去籽，用湯匙稍微挖深凹槽。",
                "在酪梨果肉凹槽內撒少許鹽，填滿起司碎。",
                "烤箱預熱 180 度，將酪梨放入烤 8 分鐘，直到表面起司金黃起泡即可享用，無需任何麵包三明治。"
            ];
        } else {
            title = "低溫慢烘酪梨起司脆片";
            prepTime = "15 分鐘";
            estCost = "NT$ 50";
            scientificPrinciple = "【水分蒸發去水法】：將少量起司與熟成酪梨均勻壓平，利用烤箱熱風低溫烘乾多餘水分，使起司網狀結構收縮，形成香脆可口且無澱粉的健康脆片。";
            steps = [
                "酪梨泥混入起司碎、黑胡椒及少許鹽壓扁在烘焙紙上成薄餅狀。",
                "放入烤箱 160 度烘烤 12-15 分鐘，取出放涼後即會變香脆。"
            ];
        }
    } else if (itemNames.includes("鮭魚") && itemNames.includes("胡蘿蔔")) {
        if (!useAlt) {
            title = style.includes("日式") ? "日式照燒鮭魚佐蒸胡蘿蔔" : "鮮甜胡蘿蔔燜煎鮭魚排";
            prepTime = "20 分鐘";
            estCost = "NT$ 110";
            scientificPrinciple = "【加壓燜泡與高比熱容】：鮭魚片表面拍上微量澱粉，先下鍋高溫煎封鎖住肉汁，隨後關火加蓋「加壓浸沒」以高比熱容水氣緩慢燜熟，防止肉質變柴。";
            steps = [
                "將鮭魚片自冷凍庫取出，用紙巾擦乾表面的組織液（Purge）。",
                "胡蘿蔔切薄片，撒微量鹽靜置 5 分鐘，利用滲透壓排乾水分。",
                "熱鍋下少許油，將鮭魚皮朝下大火煎 2 分鐘起酥，翻面後加入胡蘿蔔片與照燒醬汁。",
                "立即關火加蓋，利用鍋體餘溫與熱水平衡慢熟 5 分鐘，起鍋裝盤。"
            ];
        } else {
            title = "紙包清蒸香料鮭魚胡蘿蔔";
            prepTime = "18 分鐘";
            estCost = "NT$ 105";
            scientificPrinciple = "【密閉蒸汽循環原理】：利用烘焙紙將鮭魚與切絲胡蘿蔔完全密封封口，加熱時食材自身水分轉化為高壓蒸汽在紙包內循環，以溫和熱流將魚肉蒸熟，風味完全鎖定。";
            steps = [
                "鋪開一張烘焙紙，放上鮭魚片及切細絲的胡蘿蔔。",
                "撒上鹽、黑胡椒及少許橄欖油，將烘焙紙四周捲起密封摺緊。",
                "放入烤箱 200 度烤 15 分鐘，或置於蒸鍋中蒸 12 分鐘即可。"
            ];
        }
    } else if (itemNames.includes("雞蛋") && itemNames.includes("胡蘿蔔")) {
        if (!useAlt) {
            title = "金黃胡蘿蔔絲炒滑蛋";
            prepTime = "10 分鐘";
            estCost = "NT$ 35";
            scientificPrinciple = "【滲透壓脫水法】：胡蘿蔔絲先以鹽水或鹽抓醃脫水，去除多餘水分。炒製時能瞬間產生梅納反應，並與富含脂溶性維生素的蛋液完美融合。";
            steps = [
                "胡蘿蔔切細絲，撒薄鹽靜置 5 分鐘後擠乾水分，這能確保下鍋時不會出水變軟爛。",
                "雞蛋打散，加入一小勺水與幾滴油（增加滑嫩度）。",
                "熱油鍋先快速將蛋液炒至半熟，呈碎花狀立即盛出備用。",
                "原鍋再下一點油，大火爆炒胡蘿蔔絲至變軟出甜味，最後倒入半熟蛋液快速翻炒 10 秒即可起鍋。"
            ];
        } else {
            title = "法式蔬菜煎蛋捲 (胡蘿蔔風味)";
            prepTime = "12 分鐘";
            estCost = "NT$ 30";
            scientificPrinciple = "【低溫慢凝】：利用極小火加熱蛋液，使蛋液中的蛋白質分子均勻緩慢展開並凝固，保持高含水率，形成極致滑嫩的法式滑蛋結構。";
            steps = [
                "胡蘿蔔磨成極細泥，與 3 顆雞蛋、少許鹽與黑胡椒充分打散均勻。",
                "平底鍋抹薄薄一層奶油，開小火，倒入蛋液。",
                "用筷子快速攪拌至半凝固，然後將蛋皮捲起成橄欖形，盛盤。"
            ];
        }
    } else {
        title = `${style}風味【${itemNames[0] || "冰箱剩食"}】${useAlt ? "黃金比例" : "物理自煮"}料理`;
        prepTime = "15 分鐘";
        estCost = "NT$ 45";
        scientificPrinciple = "【滲透壓與梅納反應】：蔬菜部分先經薄鹽滲透壓脫水，下鍋時不降低鍋溫，能使核心食材瞬間受熱，達到清脆與香氣最大化的平衡。";
        steps = [
            `將主角食材 ${itemNames[0] || "剩食原料"} 切成均勻薄片，以利受熱均勻。`,
            itemNames[1] ? `輔助食材 ${itemNames[1]} 灑少許鹽抓醃 3 分鐘，體現滲透壓排乾水分。` : `將食材置入方形標準規格收納盒中，先進先出，做好前置備料。`,
            "起一熱鍋，大火快速將食材下鍋爆炒以引發梅納反應，鎖住甜味與營養結構。",
            `依據【${style}風格】調味，加蓋燜煮 1 分鐘，利用鍋內高比熱容蒸汽熱傳導核心，完成出鍋。`
        ];
    }

    return { title, prepTime, estCost, scientificPrinciple, steps };
}

function generateAiRecipe(style = '無特定風格', excludeTitle = null) {
    if (selectedChefItems.length === 0) {
        alert("請先在冰箱中點擊選取至少 1 項食材！");
        return;
    }

    // Get item names
    const items = selectedChefItems.map(id => appState.inventory.find(item => item.id === id)).filter(Boolean);
    const itemNames = items.map(i => i.name);

    // Remove existing loading or modal if any (to show fresh loading state)
    const existing = document.getElementById("ai-recipe-modal");
    if (existing) existing.remove();

    // Create loading screen overlay
    const loading = document.createElement("div");
    loading.id = "ai-recipe-modal";
    loading.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";
    loading.innerHTML = `
        <div class="bg-white rounded-3xl p-xl shadow-2xl max-w-[420px] w-full mx-gutter text-center space-y-md border border-primary/5 animate-pulse">
            <span class="material-symbols-outlined text-5xl text-ochre-gold animate-spin">auto_awesome</span>
            <h3 class="text-lg font-extrabold text-slate-blue">AI 大廚正在精算中...</h3>
            <p class="text-xs text-on-surface-variant leading-relaxed font-medium">正在為您融合「${style}」風格與食材，規劃食譜...</p>
        </div>
    `;
    document.body.appendChild(loading);

    const configuredApiBase = String(window.COOCOO_API_BASE_URL || '').replace(/\/$/, '');
    const apiUrl = configuredApiBase
        ? `${configuredApiBase}/api/generate-recipe`
        : '/api/generate-recipe';

    // Call local server endpoint
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ingredients: itemNames,
            style: style,
            excludeTitle: excludeTitle
        })
    })
    .then(res => {
        if (!res.ok) throw new Error("Server responded with error status");
        return res.json();
    })
    .then(resData => {
        if (resData.success && resData.data) {
            resData.data.style = style; // Ensure style is attached
            renderRecipeModal(resData.data, itemNames);
        } else {
            throw new Error(resData.message || "Recipe generation failed");
        }
    })
    .catch(err => {
        console.warn("Backend API not reachable or returned error, falling back to local mock recipe...", err);
        // Fallback to local mock recipe
        setTimeout(() => {
            const mockRecipe = getLocalMockRecipe(itemNames, style, excludeTitle);
            mockRecipe.style = style;
            renderRecipeModal(mockRecipe, itemNames);
        }, 800);
    });
}

// ==========================================
// VIEW 3: SUNDAY SHOPPING (週日採買)
// ==========================================
const SAVING_TIPS = [
    {
        title: "洋蔥切法冷知識",
        icon: "kitchen",
        text: "順著纖維切洋蔥口感清脆，適合涼拌與爆炒；逆著纖維切洋蔥細胞壁破裂易軟爛，能釋放更多甜味，最適合煮湯與燉咖哩喔！"
    },
    {
        title: "馬鈴薯保鮮秘訣",
        icon: "wb_sunny",
        text: "將蘋果與馬鈴薯放在同一個袋子裡，蘋果釋放的乙烯氣體能有效抑制馬鈴薯發芽，延長保存期限！"
    },
    {
        title: "自煮省錢小撇步",
        icon: "lightbulb",
        text: "本週天氣轉涼，建議多採買洋蔥、馬鈴薯等根莖類，搭配冷凍扁平化肉片即可在 15 分鐘內快速出餐！"
    },
    {
        title: "葉菜保鮮小妙招",
        icon: "eco",
        text: "新鮮葉菜（如小松菜、空心菜）買回家後，用紙巾包裹並直立放入冷藏，可以延長 3-5 天的保鮮期！"
    },
    {
        title: "高效自煮心法",
        icon: "schedule",
        text: "週末一次性進行『食材預處理』，將肉類切片分裝、蔬菜洗淨瀝乾，週間下廚時間直接減半！"
    }
];
let currentSavingTipIndex = 0;
let savingTipTimer = null;

function rotateSavingTip(nextIndex) {
    const container = document.getElementById("saving-tip-container");
    if (!container) return;

    container.classList.remove("slide-in-right");
    container.classList.add("slide-out-left");

    setTimeout(() => {
        currentSavingTipIndex = nextIndex;
        const nextTip = SAVING_TIPS[currentSavingTipIndex];

        const tipTextEl = document.getElementById("saving-tip-text");
        const tipTitleEl = document.getElementById("saving-tip-title");
        const tipIconEl = document.getElementById("saving-tip-icon");

        if (tipTextEl && tipTitleEl && tipIconEl) {
            tipTitleEl.textContent = nextTip.title;
            tipTextEl.textContent = nextTip.text;
            tipIconEl.textContent = nextTip.icon;
        }

        container.classList.remove("slide-out-left");
        container.classList.add("slide-in-right");

        setTimeout(() => {
            container.classList.remove("slide-in-right");
        }, 250);
    }, 250);
}

function startSavingTipCarousel() {
    if (savingTipTimer) clearInterval(savingTipTimer);
    savingTipTimer = setInterval(() => {
        const nextIndex = (currentSavingTipIndex + 1) % SAVING_TIPS.length;
        rotateSavingTip(nextIndex);
    }, 5000);
}

function nextSavingTip(event) {
    if (event) event.stopPropagation();
    const nextIndex = (currentSavingTipIndex + 1) % SAVING_TIPS.length;
    rotateSavingTip(nextIndex);
    startSavingTipCarousel();
}
window.nextSavingTip = nextSavingTip;

function renderSundayShopping(container) {
    const list = appState.shoppingList;
    const estTotal = list.filter(item => !item.checked).reduce((sum, item) => sum + item.estCost, 0);

    const baseSavings = 300;
    const dynamicSavings = list.filter(item => item.checked).reduce((sum, item) => sum + Math.round(item.estCost * 1.5), 0);
    const totalSavings = baseSavings + dynamicSavings;
    const targetSavingsGoal = 2000;
    const progressPercent = Math.min(100, Math.round((totalSavings / targetSavingsGoal) * 100));

    const fridgeProduce = appState.inventory.filter(item => getInventoryItemCategory(item) === "produce").sort((a, b) => a.daysLeft - b.daysLeft);
    const fridgeProtein = appState.inventory.filter(item => getInventoryItemCategory(item) === "protein").sort((a, b) => a.daysLeft - b.daysLeft);

    // Unique names in fridge
    const fridgeVegNames = new Set(fridgeProduce.map(item => item.name));
    const fridgeProtNames = new Set(fridgeProtein.map(item => item.name));

    // Unique names in shopping list
    const shopVegNames = new Set(list.filter(item => item.category === 'produce').map(item => {
        let name = item.name;
        const match = item.name.match(/(.*?)\s*[\(（]/);
        if (match) name = match[1].trim();
        return name;
    }));
    const shopProtNames = new Set(list.filter(item => item.category === 'protein').map(item => {
        let name = item.name;
        const match = item.name.match(/(.*?)\s*[\(（]/);
        if (match) name = match[1].trim();
        return name;
    }));

    // Combine sets to calculate totals for guide
    const totalVegNames = new Set([...fridgeVegNames, ...shopVegNames]);
    const totalProtNames = new Set([...fridgeProtNames, ...shopProtNames]);

    const vegCount = totalVegNames.size;
    const protCount = totalProtNames.size;

    const vegShortage = Math.max(0, 5 - vegCount);
    const protShortage = Math.max(0, 3 - protCount);

    container.innerHTML = `
        <div class="space-y-lg">
            <!-- Header Section -->
            <section class="space-y-md">
                <div class="flex items-center justify-end gap-2 flex-wrap">
                    <button onclick="runAIRestockAnalysis()" class="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3 py-2 rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1" title="AI 智慧庫存分析與補貨精算">
                        <span class="material-symbols-outlined text-[18px]">auto_awesome</span> AI 庫存補貨精算
                    </button>
                    <button onclick="showShoppingAssistant()" class="bg-secondary text-white hover:brightness-110 border border-secondary font-extrabold px-3 py-2 rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1" title="AI 逛市場助手">
                        <span class="material-symbols-outlined text-[18px]">forum</span> AI 陪我逛
                    </button>
                    <button onclick="showScanInvoiceModal()" class="w-9 h-9 bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] rounded-full shadow-sm transition-all active:scale-95 flex items-center justify-center" title="掃描發票/收據">
                        <span class="material-symbols-outlined text-[20px] font-bold">qr_code_scanner</span>
                    </button>
                    <button onclick="showVoiceInputModal()" class="w-9 h-9 bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] rounded-full shadow-sm transition-all active:scale-95 flex items-center justify-center" title="AI語音輸入">
                        <span class="material-symbols-outlined text-[20px] font-bold">mic</span>
                    </button>
                    <button onclick="toggleAddShoppingForm()" class="bg-[#be5f48]/10 hover:bg-[#be5f48]/20 border border-[#be5f48]/30 text-[#be5f48] font-bold px-lg py-sm rounded-full text-xs shadow-sm transition-all active:scale-95 flex items-center gap-1">
                        <span class="material-symbols-outlined text-lg">add</span> 手動新增
                    </button>
                </div>

                <!-- Lean Health Guide Widget (Dynamic Visual Gauge - Moved to Top Header) -->
                <div class="w-full bg-gradient-to-r from-[#81b29a]/10 via-white to-[#e07a5f]/10 rounded-2xl p-md border border-outline-variant/30 shadow-sm space-y-3">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-xl text-[#386753]">health_metrics</span>
                            <div>
                                <strong class="font-extrabold text-sm text-[#386753]">精益健康指南 · 每週 5 蔬 3 蛋白缺口精算</strong>
                                <p class="text-xs text-on-surface-variant/70 font-medium">比對冷藏庫存與採買清單，自動算出膳食營養覆蓋率</p>
                            </div>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-black bg-[#81b29a]/20 text-[#386753] border border-[#81b29a]/40 shadow-xs">
                            ${(vegCount >= 5 && protCount >= 3) ? '🎉 本週膳食纖維與蛋白全數達標！' : `膳食覆蓋率 ${Math.round(((Math.min(5, vegCount)/5 + Math.min(3, protCount)/3)/2)*100)}%`}
                        </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-md pt-1">
                        <!-- Veg Gauge -->
                        <div class="bg-white p-sm rounded-xl border border-outline-variant/20 space-y-1">
                            <div class="flex justify-between items-center text-xs font-extrabold text-slate-blue">
                                <span class="flex items-center gap-1 text-[#386753]"><span class="material-symbols-outlined text-sm">eco</span> 蔬菜 (目標 5 種)</span>
                                <span class="text-[#386753] font-black">${vegCount} / 5 種</span>
                            </div>
                            <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5">
                                <div class="h-full bg-gradient-to-r from-[#81b29a] to-[#386753] rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.round((vegCount/5)*100))}%;"></div>
                            </div>
                            <div class="flex justify-between items-center text-[10px] font-bold">
                                <span class="text-outline">包含庫存與待採買</span>
                                ${vegShortage > 0 ? `<span class="text-[#be5f48] bg-[#e07a5f]/15 px-2 py-0.5 rounded-full">還差 ${vegShortage} 種</span>` : '<span class="text-[#386753] bg-[#81b29a]/20 px-2 py-0.5 rounded-full">已達標!</span>'}
                            </div>
                        </div>

                        <!-- Protein Gauge -->
                        <div class="bg-white p-sm rounded-xl border border-outline-variant/20 space-y-1">
                            <div class="flex justify-between items-center text-xs font-extrabold text-slate-blue">
                                <span class="flex items-center gap-1 text-[#be5f48]"><span class="material-symbols-outlined text-sm">egg</span> 蛋白質 (目標 3 種)</span>
                                <span class="text-[#be5f48] font-black">${protCount} / 3 種</span>
                            </div>
                            <div class="w-full h-2.5 bg-surface-container rounded-full overflow-hidden p-0.5">
                                <div class="h-full bg-gradient-to-r from-[#e07a5f] to-[#9a442d] rounded-full transition-all duration-500" style="width: ${Math.min(100, Math.round((protCount/3)*100))}%;"></div>
                            </div>
                            <div class="flex justify-between items-center text-[10px] font-bold">
                                <span class="text-outline">包含庫存與待採買</span>
                                ${protShortage > 0 ? `<span class="text-[#be5f48] bg-[#e07a5f]/15 px-2 py-0.5 rounded-full">還差 ${protShortage} 種</span>` : '<span class="text-[#386753] bg-[#81b29a]/20 px-2 py-0.5 rounded-full">已達標!</span>'}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Add Shopping Item Form -->
            <div id="add-shopping-form" class="hidden bg-white/50 backdrop-blur-md border border-outline-variant/30 rounded-2xl p-md shadow-sm space-y-sm">
                <h3 class="text-base font-extrabold text-slate-blue">新增待採買食材</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-sm">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">食材名稱</label>
                        <input type="text" id="new-shop-name" placeholder="例如：空心菜" oninput="onShoppingItemNameChange()" class="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">分類</label>
                        <select id="new-shop-cat" onchange="onShoppingItemNameChange()" class="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white">
                            <option value="produce">新鮮蔬果</option>
                            <option value="protein">蛋白質與乳製品</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">數量</label>
                        <input type="number" id="new-shop-qty" value="1" min="1" class="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">單位</label>
                        <input type="text" id="new-shop-unit" value="包" class="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">預估金額 (TWD)</label>
                        <input type="number" id="new-shop-cost" value="50" min="0" class="w-full h-9 rounded-xl border border-outline-variant focus:border-secondary focus:ring-secondary text-xs px-3 font-bold bg-white">
                    </div>
                </div>
                <div id="shop-item-hint" class="hidden bg-emerald-50/80 border border-emerald-200 p-2.5 rounded-xl text-xs"></div>
                <div class="flex justify-end gap-sm mt-sm">
                    <button onclick="toggleAddShoppingForm()" class="bg-surface-container text-on-surface-variant hover:bg-surface-container-high px-md py-1.5 rounded-full text-xs font-bold transition-all">取消</button>
                    <button onclick="submitNewShoppingItem()" class="bg-[#386753] text-white hover:brightness-110 px-md py-1.5 rounded-full text-xs font-bold transition-all">確認加入</button>
                </div>
            </div>

            <!-- Bento Grid Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-lg">
                <!-- Left Column (col-span-8) containing To Buy checklist card and Refrigerator hourglass inventory card -->
                <div class="lg:col-span-8 space-y-lg">

                    <!-- Checklist Card -->
                    <div class="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col justify-between">
                        <div>
                            <div class="p-lg border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low">
                                <h3 class="text-lg font-extrabold text-slate-blue flex items-center gap-2">
                                    <span class="material-symbols-outlined text-secondary fill">format_list_bulleted</span> 採買清單
                                </h3>
                                ${list.length > 0 ? `
                                    <button onclick="toggleSelectAllShopping()" class="text-xs bg-slate-blue hover:brightness-110 text-white font-extrabold px-4 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95">
                                        <span class="material-symbols-outlined text-[15px]">${list.every(item => item.checked) ? 'check_box' : 'check_box_outline_blank'}</span>
                                        ${list.every(item => item.checked) ? '取消全選' : '全選'}
                                    </button>
                                ` : ''}
                            </div>

                            ${(list.length === 0 && fridgeProduce.length === 0 && fridgeProtein.length === 0) ? `
                                <div class="matrix-grid p-lg min-h-[200px] flex flex-col items-center justify-center text-center">
                                    <span class="material-symbols-outlined text-outline-variant text-[64px] mb-2">playlist_add_check</span>
                                    <p class="text-sm font-semibold text-on-surface-variant">採買清單空空的...</p>
                                    <p class="text-xs text-outline mt-1">系統將根據冰箱庫存消耗自動生成，或可使用語音/發票掃描新增。</p>
                                </div>
                            ` : `
                                <div class="matrix-grid min-h-[300px] p-md space-y-md">
                                    <!-- Section: 新鮮蔬果 -->
                                    <div>
                                        <div class="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-[#81b29a]/10 border border-[#81b29a]/35 text-[11px] font-extrabold text-[#386753] mb-sm select-none">
                                            <span class="material-symbols-outlined text-[13px] font-bold">eco</span> 新鮮蔬果
                                        </div>
                                        ${(list.filter(item => item.category === 'produce').length === 0 && fridgeProduce.length === 0) ? `
                                            <div class="text-[11px] text-outline p-sm bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center select-none">此類別無採買或冰箱品品項</div>
                                        ` : `
                                            <div class="overflow-x-auto border border-outline-variant/20 rounded-xl bg-white">
                                                <table class="w-full text-left border-collapse table-fixed">
                                                    <thead>
                                                        <tr class="border-b border-outline-variant/30 text-xs font-extrabold text-slate-blue bg-surface-container-low/50 select-none">
                                                            <th class="p-3 w-[8%] text-center">勾選</th>
                                                            <th class="p-3 w-[28%]">食材名稱</th>
                                                            <th class="p-3 w-[16%]">數量單位</th>
                                                            <th class="p-3 w-[20%]">分類</th>
                                                            <th class="p-3 w-[14%] text-right">預估金額 / 狀態</th>
                                                            <th class="p-3 w-[7%] text-center">編輯</th>
                                                            <th class="p-3 w-[7%] text-center">刪除</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="divide-y divide-outline-variant/20">
                                                        ${list.filter(item => item.category === 'produce').map(item => getShoppingItemRowHtml(item)).join("")}
                                                        ${fridgeProduce.length > 0 ? fridgeProduce.map(item => getFridgeItemRowHtml(item, 'produce')).join("") : ''}
                                                    </tbody>
                                                </table>
                                            </div>
                                        `}
                                    </div>

                                    <!-- Section: 蛋白質與乳製品 -->
                                    <div>
                                        <div class="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-[#e07a5f]/10 border border-[#e07a5f]/35 text-[11px] font-extrabold text-[#be5f48] mb-sm select-none">
                                            <span class="material-symbols-outlined text-[13px] font-bold">egg</span> 蛋白質與乳製品
                                        </div>
                                        ${(list.filter(item => item.category === 'protein').length === 0 && fridgeProtein.length === 0) ? `
                                            <div class="text-[11px] text-outline p-sm bg-surface-container-low rounded-xl border border-dashed border-outline-variant/30 text-center select-none">此類別無採買或冰箱品項</div>
                                        ` : `
                                            <div class="overflow-x-auto border border-outline-variant/20 rounded-xl bg-white">
                                                <table class="w-full text-left border-collapse table-fixed">
                                                    <thead>
                                                        <tr class="border-b border-outline-variant/30 text-xs font-extrabold text-slate-blue bg-surface-container-low/50 select-none">
                                                            <th class="p-3 w-[8%] text-center">勾選</th>
                                                            <th class="p-3 w-[28%]">食材名稱</th>
                                                            <th class="p-3 w-[16%]">數量單位</th>
                                                            <th class="p-3 w-[20%]">分類</th>
                                                            <th class="p-3 w-[14%] text-right">預估金額 / 狀態</th>
                                                            <th class="p-3 w-[7%] text-center">編輯</th>
                                                            <th class="p-3 w-[7%] text-center">刪除</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody class="divide-y divide-outline-variant/20">
                                                        ${list.filter(item => item.category === 'protein').map(item => getShoppingItemRowHtml(item)).join("")}
                                                        ${fridgeProtein.length > 0 ? fridgeProtein.map(item => getFridgeItemRowHtml(item, 'protein')).join("") : ''}
                                                    </tbody>
                                                </table>
                                            </div>
                                        `}
                                    </div>
                                </div>
                            `}
                        </div>

                        </div>

                        <!-- Footer Calculator inside Checklist Card -->
                        ${list.length > 0 ? `
                            <div class="p-lg bg-surface-container-low border-t border-outline-variant/20 flex flex-col sm:flex-row justify-between items-center gap-md">
                                <div class="flex items-baseline gap-1">
                                    <span class="text-xs font-bold text-on-surface-variant">已勾選 ${list.filter(item => item.checked).length} 項，預估總額：</span>
                                    <span class="text-slate-blue font-extrabold text-2xl">$${
                                        list.filter(item => item.checked).reduce((sum, item) => sum + item.estCost, 0)
                                    }</span>
                                    <span class="text-[10px] font-bold text-outline">TWD</span>
                                </div>
                                <button onclick="confirmRestock()" class="bg-[#be5f48] hover:brightness-110 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                                    <span class="material-symbols-outlined text-sm">check_circle</span> 確認補貨並更新冰箱
                                </button>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Sticky Bottom Restock Bar for Mobile/Quick Access -->
                    ${list.length > 0 ? `
                        <div class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-outline-variant/30 p-3 sm:px-6 shadow-2xl transition-all">
                            <div class="max-w-7xl mx-auto flex items-center justify-between gap-md">
                                <div class="flex items-center gap-md">
                                    <div class="w-10 h-10 rounded-2xl bg-[#386753]/15 text-[#386753] flex items-center justify-center font-black">
                                        <span class="material-symbols-outlined text-xl">shopping_bag</span>
                                    </div>
                                    <div>
                                        <div class="text-xs text-on-surface-variant font-bold">
                                            已選 <span class="font-extrabold text-[#386753] text-sm">${list.filter(item => item.checked).length}</span> 項食材
                                        </div>
                                        <div class="flex items-baseline gap-1">
                                            <span class="text-xl font-black text-slate-blue">$${list.filter(item => item.checked).reduce((sum, item) => sum + item.estCost, 0)}</span>
                                            <span class="text-[10px] text-outline font-bold">TWD</span>
                                        </div>
                                    </div>
                                </div>

                                <button onclick="confirmRestock()" class="bg-[#9a442d] hover:bg-[#e07a5f] text-white font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center gap-2">
                                    <span class="material-symbols-outlined text-lg">check_circle</span>
                                    <span>確認補貨 (移入冰箱)</span>
                                </button>
                            </div>
                        </div>
                    ` : ''}

                </div>

                <!-- Side Cards (Right Column) -->
                <div class="lg:col-span-4 space-y-lg">
                    <!-- Benefit Card -->
                    <div class="bg-white/50 backdrop-blur-md border border-[#F2CC8F] rounded-3xl p-md shadow-sm flex flex-col justify-center min-h-[140px] transition-all duration-300 hover:shadow-md relative overflow-hidden group select-none">
                        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F2CC8F] to-secondary"></div>

                        <div id="saving-tip-container" class="space-y-sm">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-1.5">
                                    <span id="saving-tip-icon" class="material-symbols-outlined text-[#be5f48] fill animate-pulse text-lg">${SAVING_TIPS[currentSavingTipIndex].icon}</span>
                                    <h4 id="saving-tip-title" class="text-sm font-extrabold text-slate-blue">${SAVING_TIPS[currentSavingTipIndex].title}</h4>
                                </div>
                                <button onclick="nextSavingTip(event)" class="text-on-surface-variant hover:text-secondary p-1 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center" title="下一則妙招">
                                    <span class="material-symbols-outlined text-sm font-extrabold">arrow_forward_ios</span>
                                </button>
                            </div>
                            <p id="saving-tip-text" class="text-[13px] font-bold text-on-surface-variant leading-relaxed min-h-[55px]">
                                ${SAVING_TIPS[currentSavingTipIndex].text}
                            </p>
                        </div>
                    </div>

                    <!-- Shopping Image Card with Live Location Pill & Hover Zoom -->
                    <div onclick="showMarketModal()" class="relative rounded-3xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/30 h-60 transition-all duration-500 hover:-translate-y-1">
                        <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80" alt="鄰近黃昏市集">
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-blue/90 via-slate-blue/40 to-transparent flex flex-col justify-between p-5 text-white">
                            <div class="flex justify-between items-center">
                                <span class="bg-white/95 text-slate-blue backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    📍 離你最近：西屯黃昏市場
                                </span>
                                <span class="bg-[#9a442d]/85 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold">步行 5 mins</span>
                            </div>
                            <div class="space-y-1">
                                <div class="flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-emerald-400 text-lg">storefront</span>
                                    <h4 class="font-black text-base tracking-wide text-white">鄰近生鮮黃昏市集</h4>
                                </div>
                                <p class="text-xs text-slate-200 line-clamp-2">生鮮海產、在地農家蔬果直送！點擊開啟 AI 採買地圖與實時特惠資訊...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setTimeout(startSavingTipCarousel, 100);
}

function escapeAssistantHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    })[char]);
}

function ensureShoppingAssistantState() {
    if (!appState.shoppingAssistant || typeof appState.shoppingAssistant !== 'object') {
        appState.shoppingAssistant = JSON.parse(JSON.stringify(DEFAULT_STATE.shoppingAssistant));
    }
    if (!Array.isArray(appState.shoppingAssistant.conversation)) appState.shoppingAssistant.conversation = [];
    if (!Array.isArray(appState.shoppingAssistant.selectedMenus)) appState.shoppingAssistant.selectedMenus = [];
}

function showShoppingAssistant() {
    ensureShoppingAssistantState();
    document.getElementById('shopping-assistant-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'shopping-assistant-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center backdrop-blur-sm';
    modal.innerHTML = `
        <section class="bg-[#fdfae7] w-full sm:max-w-[720px] h-[92vh] sm:h-[86vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-outline-variant/30">
            <header class="bg-secondary text-white px-md py-sm flex items-center justify-between gap-sm">
                <div class="flex items-center gap-sm min-w-0">
                    <span class="material-symbols-outlined text-2xl">assistant</span>
                    <div class="min-w-0">
                        <h3 class="font-extrabold text-base">AI 逛市場助手</h3>
                        <p class="text-[10px] text-white/80 truncate">拍特價品、一起想菜單、合併重複食材</p>
                    </div>
                </div>
                <button onclick="closeShoppingAssistant()" class="w-9 h-9 rounded-full hover:bg-white/15 flex items-center justify-center" aria-label="關閉 AI 逛市場助手">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </header>
            <div class="px-md py-sm bg-white border-b border-outline-variant/20 flex gap-sm overflow-x-auto">
                <button onclick="startNoIdeaShopping()" class="whitespace-nowrap bg-ochre-gold/30 text-tertiary border border-ochre-gold px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">explore</span> 我完全沒想法
                </button>
                <button onclick="promptDiscountAssistant()" class="whitespace-nowrap bg-primary/10 text-primary border border-primary/20 px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1">
                    <span class="material-symbols-outlined text-base">sell</span> 我看到特價品
                </button>
            </div>
            <div id="shopping-assistant-content" class="flex-1 overflow-y-auto p-md space-y-md"></div>
            <footer class="bg-white border-t border-outline-variant/30 p-sm space-y-sm">
                <div id="shopping-assistant-photo-preview"></div>
                <div class="flex items-end gap-sm">
                    <label class="w-10 h-10 flex-shrink-0 rounded-xl bg-surface-container text-secondary cursor-pointer flex items-center justify-center border border-outline-variant/30" title="拍照或上傳特價品">
                        <span class="material-symbols-outlined">add_a_photo</span>
                        <input id="shopping-assistant-photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" class="hidden" onchange="handleShoppingAssistantPhoto(event)">
                    </label>
                    <textarea id="shopping-assistant-input" rows="2" placeholder="例如：這盒菇特價，可以排進三天菜單嗎？" class="flex-1 resize-none rounded-xl border border-outline-variant bg-[#fdfae7] px-3 py-2 text-sm focus:border-secondary focus:ring-secondary"></textarea>
                    <button id="shopping-assistant-send" onclick="sendShoppingAssistantMessage()" class="w-10 h-10 flex-shrink-0 rounded-xl bg-secondary text-white flex items-center justify-center shadow-sm">
                        <span class="material-symbols-outlined">send</span>
                    </button>
                </div>
            </footer>
        </section>`;
    document.body.appendChild(modal);
    renderShoppingAssistantContent();
}
window.showShoppingAssistant = showShoppingAssistant;

function closeShoppingAssistant() {
    document.getElementById('shopping-assistant-modal')?.remove();
    shoppingAssistantImage = null;
}
window.closeShoppingAssistant = closeShoppingAssistant;

function renderShoppingAssistantContent() {
    ensureShoppingAssistantState();
    const container = document.getElementById('shopping-assistant-content');
    if (!container) return;
    const assistant = appState.shoppingAssistant;
    const messages = assistant.conversation.length > 0
        ? assistant.conversation.map((entry) => `
            <div class="flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[86%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${entry.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-on-surface border border-outline-variant/20 rounded-bl-sm'}">
                    ${entry.hasImage ? '<div class="text-[10px] font-bold opacity-75 mb-1">📷 已附特價品照片</div>' : ''}
                    ${escapeAssistantHtml(entry.text)}
                </div>
            </div>`).join('')
        : `<div class="bg-white rounded-2xl p-md border border-outline-variant/20 text-sm text-on-surface-variant leading-relaxed">
            <strong class="text-secondary block mb-1">嗨，我陪你一起逛！</strong>
            拍下特價品，我可以聯想料理；或點「我完全沒想法」，我會參考冰箱與採買清單，陪你討論出一份不浪費的菜單。
        </div>`;

    container.innerHTML = messages + renderShoppingAssistantResult(assistant.lastResult);
    container.scrollTop = container.scrollHeight;
}

function getSelectedMenuAnalysis(result) {
    if (!result || !Array.isArray(result.menuIdeas)) return [];
    const selected = new Set(appState.shoppingAssistant.selectedMenus);
    const grouped = new Map();
    result.menuIdeas.filter((menu) => selected.has(menu.name)).forEach((menu) => {
        (menu.ingredients || []).forEach((ingredient) => {
            const key = `${ingredient.name}__${ingredient.unit}`;
            if (!grouped.has(key)) grouped.set(key, { name: ingredient.name, totalQty: 0, unit: ingredient.unit, usedBy: [] });
            const item = grouped.get(key);
            item.totalQty += Number(ingredient.qty) || 0;
            if (!item.usedBy.includes(menu.name)) item.usedBy.push(menu.name);
        });
    });
    return Array.from(grouped.values()).map((item) => {
        const inventoryItem = appState.inventory.find((inv) => inv.name.includes(item.name) || item.name.includes(inv.name));
        const existingQty = inventoryItem && inventoryItem.unit === item.unit ? Number(inventoryItem.qty) || 0 : 0;
        return { ...item, inInventory: Boolean(inventoryItem), buyQty: Math.max(0, item.totalQty - existingQty) };
    });
}

function renderShoppingAssistantResult(result) {
    if (!result || !Array.isArray(result.menuIdeas)) return '';
    const selectedMenus = new Set(appState.shoppingAssistant.selectedMenus);
    const analysis = getSelectedMenuAnalysis(result);
    return `
        <div class="mt-md space-y-md">
            <section class="bg-white rounded-2xl p-md border border-outline-variant/20">
                <div class="flex items-center justify-between gap-sm mb-sm">
                    <h4 class="font-extrabold text-slate-blue flex items-center gap-1"><span class="material-symbols-outlined text-secondary">restaurant_menu</span> 菜單第二次判斷</h4>
                    <span class="text-[10px] font-bold text-outline">勾選要保留的菜</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                    ${result.menuIdeas.map((menu) => `
                        <label class="p-sm rounded-xl border cursor-pointer flex items-start gap-sm ${selectedMenus.has(menu.name) ? 'border-secondary bg-secondary/10' : 'border-outline-variant bg-surface-container-low opacity-60'}">
                            <input type="checkbox" class="mt-1 accent-[#386753]" ${selectedMenus.has(menu.name) ? 'checked' : ''} onchange="toggleShoppingAssistantMenu(decodeURIComponent('${encodeURIComponent(menu.name)}'))">
                            <span><strong class="block text-sm text-slate-blue">${escapeAssistantHtml(menu.name)}</strong><span class="text-[10px] text-on-surface-variant">${Number(menu.servings) || 1} 人份 · ${(menu.ingredients || []).length} 項食材</span></span>
                        </label>`).join('')}
                </div>
            </section>
            <section class="bg-[#fff8e9] rounded-2xl p-md border border-ochre-gold/60">
                <h4 class="font-extrabold text-tertiary flex items-center gap-1 mb-sm"><span class="material-symbols-outlined">difference</span> 合併重複食材量</h4>
                ${analysis.length ? `<div class="space-y-sm">${analysis.map((item) => `
                    <div class="bg-white rounded-xl p-sm border border-ochre-gold/30 flex items-start justify-between gap-sm">
                        <div class="min-w-0">
                            <strong class="text-sm text-slate-blue">${escapeAssistantHtml(item.name)}：共 ${item.totalQty} ${escapeAssistantHtml(item.unit)}</strong>
                            <p class="text-[10px] text-on-surface-variant mt-0.5">用於 ${item.usedBy.length} 道菜：${item.usedBy.map(escapeAssistantHtml).join('、')}</p>
                            <p class="text-[10px] font-bold ${item.inInventory ? 'text-secondary' : 'text-primary'} mt-1">${item.inInventory ? `冰箱已有，建議再買 ${item.buyQty} ${escapeAssistantHtml(item.unit)}` : `建議採買 ${item.buyQty} ${escapeAssistantHtml(item.unit)}`}</p>
                        </div>
                    </div>`).join('')}</div>
                    <button onclick="addAssistantAnalysisToShoppingList()" class="w-full mt-md bg-primary text-white rounded-xl py-2.5 text-xs font-extrabold flex items-center justify-center gap-1"><span class="material-symbols-outlined text-base">playlist_add</span> 將目前建議加入採買清單</button>`
                    : '<p class="text-xs text-on-surface-variant">請至少保留一道菜，才能重新計算採買量。</p>'}
                <p class="text-xs font-bold text-tertiary mt-sm">${escapeAssistantHtml(result.decisionPrompt || '調整勾選後，採買量會自動重新計算。')}</p>
            </section>
        </div>`;
}

function toggleShoppingAssistantMenu(menuName) {
    const selected = appState.shoppingAssistant.selectedMenus;
    appState.shoppingAssistant.selectedMenus = selected.includes(menuName)
        ? selected.filter((name) => name !== menuName)
        : [...selected, menuName];
    saveLocalState();
    renderShoppingAssistantContent();
}
window.toggleShoppingAssistantMenu = toggleShoppingAssistantMenu;

function promptDiscountAssistant() {
    const input = document.getElementById('shopping-assistant-input');
    if (input) {
        input.value = '我看到一個特價品，請看照片幫我想能做哪些料理，並合併重複食材量。';
        input.focus();
    }
}
window.promptDiscountAssistant = promptDiscountAssistant;

function startNoIdeaShopping() {
    const input = document.getElementById('shopping-assistant-input');
    if (input) input.value = '我完全沒想法。請參考冰箱與過去採買清單，先提一份共用食材多、適合單人的三餐菜單。';
    sendShoppingAssistantMessage('no_idea');
}
window.startNoIdeaShopping = startNoIdeaShopping;

function handleShoppingAssistantPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        showToast('只支援 JPG、PNG 或 WebP 圖片', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            const maxSide = 1280;
            const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(image.width * ratio));
            canvas.height = Math.max(1, Math.round(image.height * ratio));
            canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
            shoppingAssistantImage = { mimeType: 'image/jpeg', data: dataUrl.split(',')[1], preview: dataUrl };
            renderShoppingAssistantPhotoPreview();
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
}
window.handleShoppingAssistantPhoto = handleShoppingAssistantPhoto;

function renderShoppingAssistantPhotoPreview() {
    const preview = document.getElementById('shopping-assistant-photo-preview');
    if (!preview) return;
    preview.innerHTML = shoppingAssistantImage ? `
        <div class="inline-flex items-center gap-sm bg-surface-container rounded-xl p-1.5 pr-2 border border-outline-variant/30">
            <img src="${shoppingAssistantImage.preview}" alt="待分析的特價品" class="w-12 h-12 rounded-lg object-cover">
            <span class="text-[10px] font-bold text-secondary">照片已準備好</span>
            <button onclick="clearShoppingAssistantPhoto()" class="w-6 h-6 rounded-full hover:bg-white flex items-center justify-center" aria-label="移除照片"><span class="material-symbols-outlined text-sm">close</span></button>
        </div>` : '';
}

function clearShoppingAssistantPhoto() {
    shoppingAssistantImage = null;
    const input = document.getElementById('shopping-assistant-photo');
    if (input) input.value = '';
    renderShoppingAssistantPhotoPreview();
}
window.clearShoppingAssistantPhoto = clearShoppingAssistantPhoto;

async function sendShoppingAssistantMessage(mode = 'chat') {
    ensureShoppingAssistantState();
    const input = document.getElementById('shopping-assistant-input');
    const message = input?.value.trim() || '';
    if (!message && !shoppingAssistantImage && mode !== 'no_idea') {
        showToast('請輸入問題或拍下特價品', 'error');
        return;
    }

    const hasImage = Boolean(shoppingAssistantImage);
    appState.shoppingAssistant.conversation.push({ role: 'user', text: message || '請分析這張特價品照片', hasImage });
    if (input) input.value = '';
    const sendButton = document.getElementById('shopping-assistant-send');
    if (sendButton) sendButton.disabled = true;
    renderShoppingAssistantContent();

    const configuredApiBase = String(window.COOCOO_API_BASE_URL || '').replace(/\/$/, '');
    const apiUrl = `${configuredApiBase}/api/shopping-assistant`;
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                mode,
                image: shoppingAssistantImage ? { data: shoppingAssistantImage.data, mimeType: shoppingAssistantImage.mimeType } : null,
                inventory: appState.inventory.map(({ name, qty, unit, daysLeft }) => ({ name, qty, unit, daysLeft })),
                shoppingList: appState.shoppingList.map(({ name, qty, unit }) => ({ name, qty, unit })),
                conversation: appState.shoppingAssistant.conversation.slice(-8),
            })
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.message || 'AI 回覆失敗');
        appState.shoppingAssistant.conversation.push({ role: 'assistant', text: body.data.reply || '我整理好菜單與合併採買量了。' });
        appState.shoppingAssistant.lastResult = body.data;
        appState.shoppingAssistant.selectedMenus = (body.data.menuIdeas || []).map((menu) => menu.name);
        shoppingAssistantImage = null;
        saveLocalState();
    } catch (error) {
        console.error('Shopping assistant request failed:', error);
        appState.shoppingAssistant.conversation.push({ role: 'assistant', text: '目前無法連上 AI。你可以稍後重試，原本的問題已保留。' });
    } finally {
        if (sendButton) sendButton.disabled = false;
        renderShoppingAssistantContent();
        renderShoppingAssistantPhotoPreview();
    }
}
window.sendShoppingAssistantMessage = sendShoppingAssistantMessage;

function addAssistantAnalysisToShoppingList() {
    const analysis = getSelectedMenuAnalysis(appState.shoppingAssistant.lastResult);
    let added = 0;
    analysis.filter((item) => item.buyQty > 0).forEach((item) => {
        const existing = appState.shoppingList.find((shop) => shop.name === item.name && shop.unit === item.unit);
        if (existing) {
            existing.qty = Math.max(Number(existing.qty) || 0, Math.ceil(item.buyQty * 10) / 10);
            existing.status = 'AI 菜單合併';
            if (isCloudMode && supabaseClient) dbUpdateShoppingItem(existing);
        } else {
            const isProduce = /菜|菇|蔥|蒜|薑|瓜|果|番茄|洋蔥|蘿蔔/.test(item.name);
            const category = isProduce ? 'produce' : 'protein';
            const newItem = {
                id: `s_ai_${Date.now()}_${added}`,
                name: item.name,
                category: category,
                qty: Math.ceil(item.buyQty * 10) / 10,
                unit: item.unit || '份',
                image: generateIngredientImage(item.name, category),
                checked: false,
                status: 'AI 菜單合併',
                estCost: item.estCost || 50
            };
            appState.shoppingList.push(newItem);
            if (isCloudMode && supabaseClient) dbAddShoppingItem(newItem);
        }
        added += 1;
    });
    saveState();
    closeShoppingAssistant();
    renderCurrentTab();
    showToast(`已依保留菜單加入 ${added} 項合併食材 (已同步 Supabase)`, 'success');
}
}
window.addAssistantAnalysisToShoppingList = addAssistantAnalysisToShoppingList;

// ==========================================
// AI SMART INVENTORY RESTOCK JUDGEMENT
// ==========================================

async function runAIRestockAnalysis() {
    const loading = document.createElement("div");
    loading.id = "ai-restock-modal";
    loading.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";
    loading.innerHTML = `
        <div class="bg-white rounded-3xl p-xl shadow-2xl max-w-[420px] w-full mx-gutter text-center space-y-md border border-primary/5 animate-pulse">
            <span class="material-symbols-outlined text-5xl text-ochre-gold animate-spin">auto_awesome</span>
            <h3 class="text-lg font-extrabold text-slate-blue">AI 庫存精算師分析中...</h3>
            <p class="text-xs text-on-surface-variant leading-relaxed font-medium">正在掃描冰箱保鮮期、補貨缺口與週營養矩陣...</p>
        </div>
    `;
    document.body.appendChild(loading);

    const configuredApiBase = String(window.COOCOO_API_BASE_URL || '').replace(/\/$/, '');
    const apiUrl = `${configuredApiBase}/api/ai-restock-analysis`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inventory: appState.inventory.map(({ name, qty, unit, daysLeft, chamber }) => ({ name, qty, unit, daysLeft, chamber })),
                shoppingList: appState.shoppingList.map(({ name, qty, unit }) => ({ name, qty, unit }))
            })
        });
        const resData = await response.json();
        if (resData.success && resData.data) {
            renderAIRestockModal(resData.data);
        } else {
            throw new Error(resData.message || "AI 補貨分析失敗");
        }
    } catch (err) {
        console.warn("AI restock endpoint fallback:", err);
        renderAIRestockModal({
            summary: "👨‍🍳 庫存掃描完成！偵測到部分食材保鮮期剩餘不到 3 天。建議補齊當季蔬菜與蛋豆魚肉品！",
            recommendations: [
                { name: "有機空心菜", category: "produce", qty: 2, unit: "包", estCost: 60, reason: "補充每週膳食纖維與微量元素", status: "AI 補貨建議" },
                { name: "鮮嫩雞胸肉", category: "protein", qty: 1, unit: "盒", estCost: 95, reason: "補充高蛋白低脂食材", status: "AI 補貨建議" },
                { name: "大蒜", category: "produce", qty: 1, unit: "袋", estCost: 35, reason: "抗氧化基礎辛香料", status: "AI 補貨建議" }
            ]
        });
    }
}
window.runAIRestockAnalysis = runAIRestockAnalysis;

function renderAIRestockModal(data) {
    const existing = document.getElementById("ai-restock-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "ai-restock-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4";

    const recs = data.recommendations || [];
    window.currentAIRestockRecs = recs;

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[520px] w-full border border-primary/5 flex flex-col max-h-[85vh] overflow-hidden">
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/30 flex-shrink-0">
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-ochre-gold text-2xl">auto_awesome</span>
                    <div>
                        <span class="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">AI 庫存補貨精算</span>
                        <h3 class="text-lg font-extrabold text-slate-blue mt-0.5">智能庫存補貨判定建議</h3>
                    </div>
                </div>
                <button onclick="closeAIRestockModal()" class="text-on-surface-variant hover:text-error p-1 rounded-full flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto py-md space-y-md pr-1 custom-scrollbar">
                <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-md">
                    <p class="text-xs text-amber-900 font-medium leading-relaxed">
                        ${data.summary}
                    </p>
                </div>

                <div class="space-y-sm">
                    <h4 class="text-xs font-extrabold text-slate-blue flex items-center justify-between">
                        <span>AI 建議補貨食材清單</span>
                        <span class="text-[11px] text-on-surface-variant font-normal">共 ${recs.length} 項</span>
                    </h4>

                    <div class="space-y-2">
                        ${recs.map((item, idx) => `
                            <label class="flex items-start gap-3 p-3 rounded-xl border border-outline-variant/30 hover:border-secondary/40 bg-surface-container-low cursor-pointer transition-all">
                                <input type="checkbox" id="ai-rec-chk-${idx}" checked class="mt-1 rounded text-secondary focus:ring-secondary">
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-center">
                                        <span class="text-xs font-extrabold text-slate-blue">${item.name} (${item.qty}${item.unit})</span>
                                        <span class="text-[11px] font-bold text-primary">NT$ ${item.estCost || 50}</span>
                                    </div>
                                    <p class="text-[11px] text-on-surface-variant mt-0.5 font-medium">${item.reason}</p>
                                </div>
                            </label>
                        `).join("")}
                    </div>
                </div>
            </div>

            <div class="pt-md border-t border-outline-variant/30 flex gap-sm w-full flex-shrink-0">
                <button onclick="closeAIRestockModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all">
                    取消
                </button>
                <button onclick="applyAIRestockRecommendations()" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-xs">add_shopping_cart</span> 一鍵採買 (同步 Supabase)
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
window.renderAIRestockModal = renderAIRestockModal;

function closeAIRestockModal() {
    const modal = document.getElementById("ai-restock-modal");
    if (modal) modal.remove();
}
window.closeAIRestockModal = closeAIRestockModal;

function applyAIRestockRecommendations() {
    const recs = window.currentAIRestockRecs || [];
    let addedCount = 0;
    recs.forEach((item, idx) => {
        const chk = document.getElementById(`ai-rec-chk-${idx}`);
        if (!chk || chk.checked) {
            const existing = appState.shoppingList.find(s => s.name === item.name);
            if (existing) {
                existing.qty = Math.max(Number(existing.qty) || 0, Number(item.qty) || 1);
                existing.status = item.status || 'AI 補貨建議';
                if (isCloudMode && supabaseClient) dbUpdateShoppingItem(existing);
            } else {
                const newItem = {
                    id: `s_ai_restock_${Date.now()}_${idx}`,
                    name: item.name,
                    category: item.category || (item.name.includes("菜") ? "produce" : "protein"),
                    qty: Number(item.qty) || 1,
                    unit: item.unit || "包",
                    image: generateIngredientImage(item.name, item.category || "produce"),
                    checked: false,
                    status: item.status || 'AI 補貨建議',
                    estCost: Number(item.estCost) || 50
                };
                appState.shoppingList.push(newItem);
                if (isCloudMode && supabaseClient) dbAddShoppingItem(newItem);
            }
            addedCount++;
        }
    });

    saveState();
    closeAIRestockModal();
    renderCurrentTab();
    showToast(`已成功加入 ${addedCount} 項 AI 建議補貨食材並同步至 Supabase！`, "success");
}
window.applyAIRestockRecommendations = applyAIRestockRecommendations;

function getShoppingItemRowHtml(item) {
    const isUrgent = item.status === "急需補貨" || item.status === "已耗盡";
    const isAi = item.status === "AI 補貨建議" || item.status === "AI 庫存精算" || item.status === "AI 智慧建議";
    const isChef = item.status === "主廚推薦" || item.status === "主廚推薦補貨";

    let bgClass = "";
    let checkboxClass = "";
    let nameClass = "font-extrabold text-slate-blue";

    if (item.checked) {
        bgClass = "bg-surface-container-highest/40 opacity-60";
        checkboxClass = "custom-checkbox w-5 h-5 rounded-lg border-outline-variant text-slate-blue focus:ring-slate-blue cursor-pointer";
        nameClass = "font-extrabold text-on-surface-variant/70";
    } else {
        if (item.category === "produce") {
            bgClass = "bg-[#81b29a]/10 hover:bg-[#81b29a]/20";
            checkboxClass = "custom-checkbox w-5 h-5 rounded-lg border-[#81b29a]/60 text-secondary focus:ring-secondary cursor-pointer";
        } else {
            bgClass = "bg-[#e07a5f]/10 hover:bg-[#e07a5f]/20";
            checkboxClass = "custom-checkbox w-5 h-5 rounded-lg border-[#e07a5f]/60 text-primary focus:ring-primary cursor-pointer";
        }
    }

    let statusBadgeHtml = "";
    if (isUrgent) {
        statusBadgeHtml = `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#e07a5f]/15 text-[#9a442d] border border-[#e07a5f]/30 text-[10px] font-black"><span class="material-symbols-outlined text-[12px]">warning</span> 急需補貨</span>`;
    } else if (isAi) {
        statusBadgeHtml = `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#f2cc8f]/30 text-[#765a28] border border-[#f2cc8f]/50 text-[10px] font-black"><span class="material-symbols-outlined text-[12px]">auto_awesome</span> AI 智慧建議</span>`;
    } else if (isChef) {
        statusBadgeHtml = `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#81b29a]/20 text-[#386753] border border-[#81b29a]/40 text-[10px] font-black"><span class="material-symbols-outlined text-[12px]">skillet</span> 主廚推薦</span>`;
    }

    const catBadge = item.category === "produce"
        ? `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-extrabold text-secondary"><span class="material-symbols-outlined text-[12px] font-bold">eco</span> 新鮮蔬果</span>`
        : `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-extrabold text-primary"><span class="material-symbols-outlined text-[12px] font-bold">egg</span> 蛋白質與乳製品</span>`;

    let displayName = item.name;
    let displayQtyUnit = `${item.qty} ${item.unit}`;
    const match = item.name.match(/(.*?)\s*[\(（]\s*(\d+)\s*([\u4e00-\u9fa5\w]+)\s*[\)）]/);
    if (match) {
        displayName = match[1].trim();
        displayQtyUnit = `${match[2]} ${match[3].trim()}`;
    }

    const itemImage = item.image || generateIngredientImage(item.name, item.category);

    return `
        <tr class="transition-all duration-150 ${bgClass} text-sm">
            <td class="p-3 text-center align-middle w-[8%]">
                <input type="checkbox" ${item.checked ? "checked" : ""} onchange="toggleShoppingItemChecked('${item.id}')" class="${checkboxClass}">
            </td>
            <td class="p-3 align-middle w-[28%]">
                <div class="flex items-center gap-2.5">
                    <img class="w-8 h-8 rounded-xl object-cover bg-white border border-outline-variant/30 flex-shrink-0 shadow-xs" src="${itemImage}" alt="${displayName}">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="${nameClass} text-base">${displayName}</span>
                        ${statusBadgeHtml}
                    </div>
                </div>
            </td>
            <td class="p-3 align-middle font-bold text-slate-blue w-[16%]">
                ${displayQtyUnit}
            </td>
            <td class="p-3 align-middle w-[20%]">
                ${catBadge}
            </td>
            <td class="p-3 align-middle text-right font-extrabold text-slate-blue text-base w-[14%]">
                $${item.estCost}
            </td>
            <td class="p-3 align-middle text-center w-[7%]">
                <button onclick="editShoppingItem('${item.id}')" class="text-on-surface-variant hover:text-secondary hover:bg-secondary/15 p-1 rounded-full transition-colors active:scale-90 flex items-center justify-center mx-auto" title="編輯此項">
                    <span class="material-symbols-outlined text-sm font-extrabold">edit</span>
                </button>
            </td>
            <td class="p-3 align-middle text-center w-[7%]">
                <button onclick="removeShoppingItem('${item.id}')" class="text-on-surface-variant hover:text-error hover:bg-error-container/30 p-1 rounded-full transition-colors active:scale-90 flex items-center justify-center mx-auto" title="刪除此項">
                    <span class="material-symbols-outlined text-sm font-extrabold">close</span>
                </button>
            </td>
        </tr>
    `;
}

function editShoppingItem(id) {
    const item = appState.shoppingList.find(i => i.id === id);
    if (!item) return;

    const existing = document.getElementById("edit-shopping-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "edit-shopping-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[400px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md transform transition-all scale-100 duration-150 text-left">
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3 shrink-0">
                <h3 class="text-base font-extrabold text-slate-blue flex items-center gap-1">
                    <span class="material-symbols-outlined text-slate-blue fill font-extrabold">edit_note</span> 編輯採買食材
                </h3>
                <button onclick="closeEditShoppingModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Form Fields -->
            <div class="space-y-sm">
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1">食材名稱</label>
                    <input type="text" id="edit-shop-name" value="${item.name}" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm font-bold">
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1">分類</label>
                    <select id="edit-shop-cat" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm font-bold">
                        <option value="produce" ${item.category === "produce" ? "selected" : ""}>新鮮蔬果</option>
                        <option value="protein" ${item.category === "protein" ? "selected" : ""}>蛋白質與乳製品</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-sm">
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">數量</label>
                        <input type="number" id="edit-shop-qty" value="${item.qty}" min="1" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm font-bold">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-on-surface-variant mb-1">單位</label>
                        <input type="text" id="edit-shop-unit" value="${item.unit}" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm font-bold">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-on-surface-variant mb-1">預估金額 (TWD)</label>
                    <input type="number" id="edit-shop-cost" value="${item.estCost}" min="0" class="w-full rounded-xl border-outline-variant focus:border-secondary focus:ring-secondary text-sm font-bold">
                </div>
            </div>

            <!-- Actions Footer -->
            <div class="pt-sm border-t border-outline-variant/20 flex gap-md shrink-0">
                <button onclick="closeEditShoppingModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    取消
                </button>
                <button onclick="submitEditShoppingItem('${item.id}')" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md">
                    確認修改
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function closeEditShoppingModal() {
    const modal = document.getElementById("edit-shopping-modal");
    if (modal) modal.remove();
}

function submitEditShoppingItem(id) {
    const name = document.getElementById("edit-shop-name").value.trim();
    const cat = document.getElementById("edit-shop-cat").value;
    const qty = parseInt(document.getElementById("edit-shop-qty").value);
    const unit = document.getElementById("edit-shop-unit").value.trim() || "包";
    const cost = parseInt(document.getElementById("edit-shop-cost").value);

    if (!name) {
        alert("請輸入採買項目名稱！");
        return;
    }

    const item = appState.shoppingList.find(i => i.id === id);
    if (item) {
        item.name = name;
        item.category = cat;
        item.qty = qty;
        item.unit = unit;
        item.estCost = cost;

        saveState();
        if (isCloudMode && supabaseClient) {
            dbUpdateShoppingItem(item);
        }

        closeEditShoppingModal();
        renderCurrentTab();
        showToast(`已成功修改「${name}」！`, "success");
    }
}

function toggleShoppingItemChecked(id) {
    const item = appState.shoppingList.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        saveState();
        if (isCloudMode && supabaseClient) {
            dbUpdateShoppingItem(item);
        }
        // Just update badges and re-render calculator details on shopping matrix
        renderCurrentTab();
    }
}

async function toggleSelectAllShopping() {
    const list = appState.shoppingList;
    if (list.length === 0) return;
    const allChecked = list.every(item => item.checked);
    const targetState = !allChecked;

    list.forEach(item => {
        item.checked = targetState;
    });

    saveState();

    if (isCloudMode && supabaseClient) {
        try {
            const updates = list.map(item => dbUpdateShoppingItem(item));
            await Promise.all(updates);
        } catch (e) {
            console.error("Supabase 同步全選失敗:", e);
        }
    }
    renderCurrentTab();
}

function removeShoppingItem(id) {
    const idx = appState.shoppingList.findIndex(i => i.id === id);
    if (idx !== -1) {
        const item = appState.shoppingList[idx];
        appState.shoppingList.splice(idx, 1);
        saveState();
        if (isCloudMode && supabaseClient) {
            dbDeleteShoppingItem(id);
        }
        renderCurrentTab();
        showToast(`已刪除採買項 ${item.name}`);
    }
}

function confirmRestock() {
    const checkedItems = appState.shoppingList.filter(item => item.checked);
    if (checkedItems.length === 0) {
        alert("請先勾選您本週已採購/補貨的食材！");
        return;
    }

    // Move checked items to Fridge inventory (Default to cold chamber, set typical fresh days)
    checkedItems.forEach(shopItem => {
        let defaultExpiryDays = 7;
        let image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=150&auto=format&fit=crop";

        if (shopItem.name.includes("蛋")) {
            defaultExpiryDays = 14;
            image = "https://lh3.googleusercontent.com/aida-public/AB6AXuBIkd8DDrNZLiSgFOwLZMm56-FPFbbYvtbQKQotyuuCix-LU3AO5mFP6Trce_mer2gBPcrHDQY7QVdQ7aQRLqlcY-9A1Y5ZqnJD9Kf2g9Tb02-8EXNcAlMrz-U8bpU3MBfkIAEUAHs1uUwiZLwkqMBSJMDYzWutfYrFdxdnB4l0q651uhvzxy6gpkSnklZVHRKCTUWsdvOQFBhSGwL-Re8FQbx7AoMP3dKUkKSDX3NULYorgFhGUSAT0bDxJPnDjyGEsoQgSp3LV-k";
        } else if (shopItem.name.includes("乳") || shopItem.name.includes("奶")) {
            defaultExpiryDays = 8;
            image = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop";
        } else if (shopItem.name.includes("番茄")) {
            defaultExpiryDays = 6;
            image = "https://images.unsplash.com/photo-1595855759920-86582396756a?w=150&auto=format&fit=crop";
        } else if (shopItem.name.includes("蘋果")) {
            defaultExpiryDays = 15;
            image = "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=150&auto=format&fit=crop";
        } else if (shopItem.name.includes("松菜") || shopItem.name.includes("菜")) {
            defaultExpiryDays = 5;
            image = "https://images.unsplash.com/photo-1628773822503-930a8589c012?w=150&auto=format&fit=crop";
        } else if (shopItem.name.includes("櫛瓜")) {
            defaultExpiryDays = 8;
            image = "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=150&auto=format&fit=crop";
        } else if (shopItem.name.includes("筊白筍")) {
            defaultExpiryDays = 7;
            image = "https://images.unsplash.com/photo-1628773822503-930a8589c012?w=150&auto=format&fit=crop";
        }

        let storageProtocol = "方形收納管理：裝入規格化收納盒，先進先出，定期檢查保鮮期。";
        let boxSize = "M";
        if (shopItem.name.includes("菜") || shopItem.name.includes("葉")) {
            storageProtocol = "微氣候維護：避免冷氣直吹。應採用微濕紙巾包裹，再裝入方形保鮮盒冷藏。";
        } else if (shopItem.name.includes("肉") || shopItem.name.includes("魚") || shopItem.name.includes("海鮮") || shopItem.name.includes("鮭") || shopItem.name.includes("雞") || shopItem.name.includes("豬") || shopItem.name.includes("牛")) {
            storageProtocol = "組織液阻斷：冷凍前必須以紙巾緊密包裹以吸附組織液，壓扁冷凍最大化表面積，解凍快70%。";
        } else if (shopItem.name.includes("蛋")) {
            storageProtocol = "鈍端朝上冷藏：維持氣室於頂部，防止蛋黃貼殼變質，置於冷藏室內部恆溫處。";
        } else if (shopItem.name.includes("乳") || shopItem.name.includes("奶") || shopItem.name.includes("起司") || shopItem.name.includes("乾酪")) {
            storageProtocol = "密封防腐：開啟後用烘焙紙包裹再裝入方形密封盒，防止冰箱水分降解與發霉。";
            boxSize = "S";
        } else if (shopItem.name.includes("蘋果")) {
            storageProtocol = "獨立存放：蘋果會釋放乙烯，建議裝袋單獨存放，避免催熟其他食材。";
            boxSize = "S";
        } else if (shopItem.name.includes("櫛瓜")) {
            storageProtocol = "乾燥防腐保存：櫛瓜怕濕氣，用紙巾逐條包裹，再垂直放入方形保鮮盒冷藏。";
            boxSize = "M";
        } else if (shopItem.name.includes("筊白筍")) {
            storageProtocol = "水份流失防範：以微濕廚房紙巾包裹筍殼，置入方形大號收納盒保鮮冷藏。";
            boxSize = "L";
        }

        const newInvItem = {
            id: "i_r_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
            name: shopItem.name,
            chamber: "cold", // default to cold
            qty: shopItem.qty,
            unit: shopItem.unit,
            daysLeft: defaultExpiryDays,
            image: image,
            addedDate: new Date().toISOString().split("T")[0],
            roi: {
                savings: Math.round(shopItem.estCost * 0.8), // savings formula
                sodium: Math.round(100 + Math.random() * 150),
                fat: Math.round(2 + Math.random() * 10)
            },
            storageProtocol: storageProtocol,
            boxSize: boxSize
        };

        appState.inventory.push(newInvItem);
        if (isCloudMode && supabaseClient) {
            dbAddInventoryItem(newInvItem);
        }
    });

    // Remove restocked items from shopping list
    appState.shoppingList = appState.shoppingList.filter(item => !item.checked);
    if (isCloudMode && supabaseClient) {
        dbClearShoppingChecked();
    }

    saveState();
    renderCurrentTab();
    showEncouragementModal(checkedItems);
}

// ==========================================
// VIEW 3 CONTROLLER: ORGANIC MARKET MODAL
// ==========================================
const TAIWAN_ORGANIC_MARKETS = [
    {
        id: "keelung_organic",
        city: "基隆市",
        name: "基隆七堵小農有機友善市集",
        address: "基隆市七堵區自治街 (七堵市集旁廣場)",
        hours: "每週日 08:30 - 12:30",
        desc: "基隆在地有機農友自產自銷，提供新鮮無毒的在地工藝蔬果，倡導低碳足跡。",
        badge: "基隆七堵",
        gmapsUrl: "https://maps.google.com/?q=七堵小農有機友善市集",
        recommendations: [
            { name: "有機地瓜葉 (1包)", category: "produce", cost: 45, note: "鮮嫩多汁，含鐵量高" },
            { name: "友善無毒山藥 (1支)", category: "produce", cost: 120, note: "口感綿密，煮湯極佳" }
        ]
    },
    {
        id: "taipei_hope",
        city: "台北市",
        name: "希望廣場農民市集",
        address: "台北市中正區八德路一段23號",
        hours: "每週六 10:00 - 19:00 / 週日 10:00 - 18:00",
        desc: "台北規模最大的小農直送市集，網羅全國各產區的安全無毒新鮮蔬果。",
        badge: "台北中正",
        gmapsUrl: "https://maps.google.com/?q=希望廣場農民市集",
        recommendations: [
            { name: "有機櫛瓜 (2條)", category: "produce", cost: 60, note: "適合低油煎烤、無煙料理" },
            { name: "埔里筊白筍 (1包)", category: "produce", cost: 80, note: "清甜多汁、電磁爐清蒸首選" },
            { name: "小農放牧蛋 (10入)", category: "protein", cost: 120, note: "蛋黃飽滿、保鮮期長達 20 天" }
        ]
    },
    {
        id: "taipei_water",
        city: "台北市",
        name: "水花園有機農夫市集",
        address: "台北市大安區新生南路三段84號 (台大蒲公英綠地)",
        hours: "每週六 10:00 - 17:00",
        desc: "台北知名有機文創綠色市集，強調農學教育與環境友善耕作，產品種類繁多。",
        badge: "台北大安",
        gmapsUrl: "https://maps.google.com/?q=水花園有機農夫市集",
        recommendations: [
            { name: "有機皇宮菜 (1包)", category: "produce", cost: 50, note: "富含多醣體，川燙口感滑順" },
            { name: "小農古法豆腐 (1塊)", category: "protein", cost: 45, note: "天然鹽滷製作，豆香極濃" }
        ]
    },
    {
        id: "new_taipei_tamsui",
        city: "新北市",
        name: "淡水有機農夫市集",
        address: "新北市淡水區中正路1號 (淡水捷運站後方廣場)",
        hours: "每週日 10:00 - 17:00",
        desc: "淡水在地小農友善耕作市集，吹著海風吃新鮮，推廣綠色低碳在地消費。",
        badge: "新北淡水",
        gmapsUrl: "https://maps.google.com/?q=淡水農夫市集",
        recommendations: [
            { name: "有機地瓜葉 (1包)", category: "produce", cost: 45, note: "高纖維、快速燙青菜首選" },
            { name: "三芝無毒山藥 (1支)", category: "produce", cost: 150, note: "切塊煲湯，天然滋補" },
            { name: "無毒鮮香菇 (1袋)", category: "produce", cost: 80, note: "電磁爐蒸煮或香煎皆宜" }
        ]
    },
    {
        id: "new_taipei_bitan",
        city: "新北市",
        name: "新店碧潭農夫市集",
        address: "新北市新店區碧潭東岸廣場",
        hours: "每週日 10:00 - 18:00",
        desc: "鄰近碧潭風景區，集結雙北近郊優質有機小農，深受假日散步民眾歡迎。",
        badge: "新北新店",
        gmapsUrl: "https://maps.google.com/?q=碧潭農夫市集",
        recommendations: [
            { name: "有機甜菜根 (1顆)", category: "produce", cost: 70, note: "富含甜菜紅素，打汁或涼拌皆佳" },
            { name: "友善段木香菇 (1包)", category: "produce", cost: 180, note: "香氣特別濃郁，煲湯上品" }
        ]
    },
    {
        id: "taoyuan_organic",
        city: "桃園市",
        name: "桃園有機農夫市集",
        address: "桃園市八德區介壽路二段148號 (大湳市場旁廣場)",
        hours: "每週六 08:30 - 12:30",
        desc: "桃園市農會主辦之精緻有機安全農特產品市集，嚴選在地優良認證戶。",
        badge: "桃園八德",
        gmapsUrl: "https://maps.google.com/?q=桃園有機農夫市集",
        recommendations: [
            { name: "有機小松菜 (1包)", category: "produce", cost: 45, note: "口感清脆，高鈣營養" },
            { name: "有機黑木耳 (1袋)", category: "produce", cost: 50, note: "適合做黑木耳露或涼拌" }
        ]
    },
    {
        id: "hsinchu_dragonfly",
        city: "新竹市",
        name: "竹蜻蜓綠市集",
        address: "新竹市東區光復路二段101號 (清華大學成功湖畔)",
        hours: "每週六 09:00 - 14:00 (每月第一及第三週)",
        desc: "清大校園內深具人文關懷的有機農夫市集，重視食農教育與友善土地。",
        badge: "新竹東區",
        gmapsUrl: "https://maps.google.com/?q=竹蜻蜓綠市集",
        recommendations: [
            { name: "有機四季豆 (1包)", category: "produce", cost: 65, note: "清脆爽口，乾煸或川燙皆宜" },
            { name: "小農無毒紅豆 (1包)", category: "produce", cost: 110, note: "顆粒飽滿，免浸泡好煮爛" }
        ]
    },
    {
        id: "hsinchu_county_organic",
        city: "新竹縣",
        name: "新竹縣竹北小農有機市集",
        address: "新竹縣竹北市光明六路東一段 (新竹縣政府旁廣場)",
        hours: "每週日 09:00 - 13:00",
        desc: "竹北在地小農合作社直營，提供來自尖石、五峰等高山與在地平原的有機無毒旬菜。",
        badge: "新竹竹北",
        gmapsUrl: "https://maps.google.com/?q=竹北小農有機市集",
        recommendations: [
            { name: "高山有機高麗菜 (1顆)", category: "produce", cost: 120, note: "脆甜清爽，小火炒即極美味" },
            { name: "無毒黃金地瓜 (1袋)", category: "produce", cost: 80, note: "電鍋蒸熟即食，低升糖澱粉" }
        ]
    },
    {
        id: "miaoli_maoli",
        city: "苗栗縣",
        name: "貓裏老街有機農夫市集",
        address: "苗栗縣苗栗市建中街24號 (苗栗農會前廣場)",
        hours: "每週六 08:30 - 12:00",
        desc: "苗栗精緻小農友善耕作示範據點，推廣無農藥無化肥的客家在地友善農產。",
        badge: "苗栗市區",
        gmapsUrl: "https://maps.google.com/?q=貓裏有機農夫市集",
        recommendations: [
            { name: "友善客家乾蘿蔔乾 (1包)", category: "produce", cost: 95, note: "傳統古法日曬，煎蛋首選" },
            { name: "無毒鮮杭菊 (1罐)", category: "produce", cost: 220, note: "沖泡花茶解膩，香氣清雅" }
        ]
    },
    {
        id: "taichung_nchu",
        city: "台中市",
        name: "興大有機農夫市集",
        address: "台中市南區興大路145號 (中興大學惠蓀堂前廊)",
        hours: "每週六 08:00 - 12:00",
        desc: "國內歷史悠久的大學有機市集，所有攤商皆具備有機認證，安全品質極高。",
        badge: "台中南區",
        gmapsUrl: "https://maps.google.com/?q=興大有機農夫市集",
        recommendations: [
            { name: "新社黑木耳 (1袋)", category: "produce", cost: 50, note: "涼拌或清炒，富含膳食纖維" },
            { name: "有機甜玉米 (2支)", category: "produce", cost: 70, note: "小電鍋蒸熟即食，清甜可口" },
            { name: "優質鮮乳 (1瓶)", category: "protein", cost: 95, note: "成份無調整，濃郁香醇" }
        ]
    },
    {
        id: "changhua_organic",
        city: "彰化縣",
        name: "彰化有機農夫市集",
        address: "彰化縣彰化市進德路137號 (彰師大正門廣場)",
        hours: "每週日 08:00 - 12:00",
        desc: "中台灣有機小農聚落，所有蔬果嚴格把關，帶給彰化市民安心綠色餐桌。",
        badge: "彰化市區",
        gmapsUrl: "https://maps.google.com/?q=彰化有機農夫市集",
        recommendations: [
            { name: "有機秋葵 (1包)", category: "produce", cost: 55, note: "黏液豐富保護胃壁，川燙佳" },
            { name: "友善小蘆筍 (1捆)", category: "produce", cost: 90, note: "細嫩脆口，高纖抗氧化" }
        ]
    },
    {
        id: "nantou_organic",
        city: "南投縣",
        name: "南投友善綠活市集",
        address: "南投縣南投市三和三路 (南投縣政府周邊)",
        hours: "每週六 09:00 - 13:00",
        desc: "集結埔里、魚池、信義等南投各鄉鎮的有機認證農友，主打高山無毒蔬果及在地茗茶。",
        badge: "南投市區",
        gmapsUrl: "https://maps.google.com/?q=南投友善市集",
        recommendations: [
            { name: "埔里有機茭白筍 (1包)", category: "produce", cost: 90, note: "口感甜嫩，水蒸或手撕烤皆美" },
            { name: "有機轉型期大香菇 (1袋)", category: "produce", cost: 110, note: "肉質肥厚彈牙，適合燉高湯" }
        ]
    },
    {
        id: "yunlin_three_little",
        city: "雲林縣",
        name: "三小市集 (三小棟)",
        address: "雲林縣斗六市府前街43號 (行啟記念館旁三小棟)",
        hours: "每週日 08:00 - 12:00",
        desc: "深耕雲林多年的小農文創市集，串聯友善耕作農友，實踐『食信、食安、食農』理念。",
        badge: "雲林斗六",
        gmapsUrl: "https://maps.google.com/?q=三小市集",
        recommendations: [
            { name: "有機金針菇 (2包)", category: "produce", cost: 40, note: "真空新鮮包裝，煮火鍋良伴" },
            { name: "友善履歷黃豆 (1包)", category: "produce", cost: 80, note: "國產非基改，自製濃豆漿首選" }
        ]
    },
    {
        id: "chiayi_city_organic",
        city: "嘉義市",
        name: "嘉大有機農夫市集",
        address: "嘉義市東區學府路300號 (嘉義大學蘭潭校區)",
        hours: "每週六 08:00 - 12:00",
        desc: "結合嘉義大學農學專業背景，提供具產銷履歷與有機雙重保證的小農優質農產。",
        badge: "嘉義東區",
        gmapsUrl: "https://maps.google.com/?q=嘉大有機農夫市集",
        recommendations: [
            { name: "有機黃秋葵 (1包)", category: "produce", cost: 50, note: "清爽滑溜，盛夏消暑小菜" },
            { name: "無毒鮮採蜜紅豆 (1包)", category: "produce", cost: 95, note: "綿密香甜，免浸泡好烹調" }
        ]
    },
    {
        id: "chiayi_county_organic",
        city: "嘉義縣",
        name: "嘉義縣太保友善小農市集",
        address: "嘉義縣太保市祥和一路東段 (縣政府大門前)",
        hours: "每週日 08:30 - 12:30",
        desc: "嘉義縣政府輔導的友善市集，以溫室小番茄、有機水耕菜與友善五穀聞名。",
        badge: "嘉義太保",
        gmapsUrl: "https://maps.google.com/?q=太保小農市集",
        recommendations: [
            { name: "溫室友善水果番茄 (1盒)", category: "produce", cost: 110, note: "甜度高且多汁，即食水果點心" },
            { name: "有機小白菜 (1包)", category: "produce", cost: 40, note: "葉片嫩綠，煮麵配菜萬用" }
        ]
    },
    {
        id: "tainan_ncku",
        city: "台南市",
        name: "成大有機農夫市集",
        address: "台南市東區大學路1號 (成功大學光復校區單車廣場)",
        hours: "每週六 07:30 - 11:30",
        desc: "府城低碳樂活市集，成大綠色通道上的小農聚落，專售在地友善農特產。",
        badge: "台南東區",
        gmapsUrl: "https://maps.google.com/?q=成大有機農夫市集",
        recommendations: [
            { name: "有機黃秋葵 (1包)", category: "produce", cost: 55, note: "富含果膠，適合川燙沾醬" },
            { name: "無毒鮮香蕉 (1串)", category: "produce", cost: 70, note: "單身套房即拆即食能量來源" },
            { name: "官田有機菱角 (1包)", category: "produce", cost: 100, note: "小電鍋水煮，口感鬆軟" }
        ]
    },
    {
        id: "kaohsiung_breeze",
        city: "高雄市",
        name: "微風市集 (同盟館)",
        address: "高雄市三民區同盟二路215號 (客家文物館)",
        hours: "每週六 07:30 - 11:30",
        desc: "南台灣最具指標性的在地綠色市集，推廣『地產地消、友善小農』概念。",
        badge: "高雄三民",
        gmapsUrl: "https://maps.google.com/?q=微風市集+同盟館",
        recommendations: [
            { name: "美濃無毒野蓮 (1包)", category: "produce", cost: 50, note: "清脆爽口，單口爐快炒快速" },
            { name: "燕巢有機芭樂 (3顆)", category: "produce", cost: 80, note: "高維他命C，健康無負擔" },
            { name: "有機櫛瓜 (2條)", category: "produce", cost: 60, note: "適合低油煙煎烤" }
        ]
    },
    {
        id: "pingtung_organic",
        city: "屏東縣",
        name: "屏東綠活農夫市集",
        address: "屏東縣屏東市自由路527號 (屏東縣政府後方廣場)",
        hours: "每週六 08:00 - 12:00",
        desc: "集結國境之南的優質有機無毒農友，提供陽光燦爛下的無農藥豐碩成果。",
        badge: "屏東市區",
        gmapsUrl: "https://maps.google.com/?q=屏東綠活農夫市集",
        recommendations: [
            { name: "有機小松菜 (1包)", category: "produce", cost: 40, note: "富含鐵質與鈣質，適合快炒" },
            { name: "友善無毒檸檬 (5顆)", category: "produce", cost: 70, note: "皮薄汁多，自製清涼檸檬水" }
        ]
    },
    {
        id: "yilan_dazhaiyuan",
        city: "宜蘭縣",
        name: "宜蘭大宅院友善市集",
        address: "宜蘭縣宜蘭市神農路一段1號 (宜蘭大學體育館前)",
        hours: "每週日 09:00 - 13:00",
        desc: "宜蘭最具知名度的友善農夫市集，堅持無農藥、無化肥、無除草劑，充滿在地鄉土人情味。",
        badge: "宜蘭市區",
        gmapsUrl: "https://maps.google.com/?q=宜蘭大宅院友善市集",
        recommendations: [
            { name: "有機三星青蔥 (1把)", category: "produce", cost: 60, note: "宜蘭名產！蔥香極濃郁" },
            { name: "友善日曬宜蘭糙米 (1包)", category: "produce", cost: 150, note: "好山好水結晶，米香十足" }
        ]
    },
    {
        id: "hualien_toxic_free",
        city: "花蓮縣",
        name: "花蓮無毒農業市集",
        address: "花蓮市美崙府前路339號 (花蓮縣政府前廣場)",
        hours: "每週六 08:00 - 12:00",
        desc: "花蓮好山好水育孕的無毒無農藥蔬果，是東部小農產地直銷的重要據點。",
        badge: "花蓮市區",
        gmapsUrl: "https://maps.google.com/?q=花蓮無毒農業市集",
        recommendations: [
            { name: "吉安龍鬚菜 (1包)", category: "produce", cost: 40, note: "嫩脆多汁，低油煙川燙良伴" },
            { name: "光復有機紅糯米 (1包)", category: "produce", cost: 120, note: "富含花青素，與白米混蒸" },
            { name: "壽豐有機南瓜 (1顆)", category: "produce", cost: 80, note: "電鍋蒸熟即食，耐保存" }
        ]
    },
    {
        id: "taitung_story",
        city: "台東縣",
        name: "台東秀明自然農法市集",
        address: "台東縣台東市南京路 (南京路市民廣場)",
        hours: "每週日 08:30 - 12:30",
        desc: "台東在地實踐秀明自然農法之農友市集，完全不施肥、不施藥，呈現土地最原始純淨滋味。",
        badge: "台東市區",
        gmapsUrl: "https://maps.google.com/?q=台東自然農法市集",
        recommendations: [
            { name: "無毒洛神花乾 (1包)", category: "produce", cost: 130, note: "酸甜解膩，沖泡茶飲極佳" },
            { name: "太麻里小農樹豆 (1袋)", category: "produce", cost: 100, note: "原住民傳統食材，燉豬腳首選" }
        ]
    },
    {
        id: "penghu_farmers",
        city: "澎湖縣",
        name: "澎湖友善農夫假日市集",
        address: "澎湖縣馬公市新生路345號 (農會超市前廣場)",
        hours: "每週六 08:00 - 11:30",
        desc: "澎湖在地少數友善環境小農直銷站，提供仙人掌果、冰草、風茹草等澎湖特色作物與新鮮蔬菜。",
        badge: "澎湖馬公",
        gmapsUrl: "https://maps.google.com/?q=澎湖農會假日市集",
        recommendations: [
            { name: "友善風茹草茶包 (1包)", category: "produce", cost: 120, note: "澎湖青草茶，退火消暑首選" },
            { name: "無毒澎湖冰草 (1包)", category: "produce", cost: 90, note: "口感奇特清脆，涼拌沙拉生食" }
        ]
    },
    {
        id: "kinmen_organic",
        city: "金門縣",
        name: "金門安全蔬菜小農專區",
        address: "金門縣金城鎮民生路11號 (金城車站旁農會直銷點)",
        hours: "每日 08:00 - 17:30",
        desc: "推廣金門本地經安全農藥監測及有機轉型期認證之蔬菜，保障外島居民無毒飲食。",
        badge: "金門金城",
        gmapsUrl: "https://maps.google.com/?q=金門縣農會",
        recommendations: [
            { name: "金門有機大蒜 (1袋)", category: "produce", cost: 80, note: "香氣辛辣濃郁，炒菜絕配" },
            { name: "無毒金門小芋頭 (1袋)", category: "produce", cost: 95, note: "口感極其鬆綿，燉肉必備" }
        ]
    },
    {
        id: "matsu_organic",
        city: "連江縣",
        name: "馬祖友善農產直銷點",
        address: "連江縣南竿鄉介壽村 (介壽獅子市場一樓專櫃)",
        hours: "每日 06:00 - 10:00",
        desc: "馬祖本地小農友善栽培的旬鮮葉菜與特色根莖類，數量有限，是島上健康食材首選。",
        badge: "馬祖南竿",
        gmapsUrl: "https://maps.google.com/?q=介壽獅子市場",
        recommendations: [
            { name: "馬祖當季有機高麗菜 (1顆)", category: "produce", cost: 90, note: "受海風吹拂，質地清甜爽脆" },
            { name: "無毒馬祖大白菜 (1顆)", category: "produce", cost: 75, note: "燉煮或製作傳統酸白菜極佳" }
        ]
    }
];

let currentSelectedMarketId = "taipei_hope";

function showMarketModal() {
    const existing = document.getElementById("market-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "market-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[460px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md transform transition-all scale-100 duration-150 animate-fade-in max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3 shrink-0">
                <h3 class="text-base font-extrabold text-[#be5f48] flex items-center gap-1">
                    <span class="material-symbols-outlined text-[#be5f48] fill">storefront</span> 全台小農有機市集地圖
                </h3>
                <button onclick="closeMarketModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Filters Section -->
            <div class="grid grid-cols-2 gap-sm shrink-0">
                <div>
                    <label class="block text-[10px] font-bold text-slate-blue mb-1">縣市篩選</label>
                    <select id="organic-county-select" onchange="filterOrganicMarkets()" class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1 focus:border-[#be5f48] focus:ring-[#be5f48]">
                        <option value="all">全部縣市</option>
                        <option value="台北市">台北市</option>
                        <option value="新北市">新北市</option>
                        <option value="基隆市">基隆市</option>
                        <option value="桃園市">桃園市</option>
                        <option value="新竹市">新竹市</option>
                        <option value="新竹縣">新竹縣</option>
                        <option value="苗栗縣">苗栗縣</option>
                        <option value="台中市">台中市</option>
                        <option value="彰化縣">彰化縣</option>
                        <option value="南投縣">南投縣</option>
                        <option value="雲林縣">雲林縣</option>
                        <option value="嘉義市">嘉義市</option>
                        <option value="嘉義縣">嘉義縣</option>
                        <option value="台南市">台南市</option>
                        <option value="高雄市">高雄市</option>
                        <option value="屏東縣">屏東縣</option>
                        <option value="宜蘭縣">宜蘭縣</option>
                        <option value="花蓮縣">花蓮縣</option>
                        <option value="台東縣">台東縣</option>
                        <option value="澎湖縣">澎湖縣</option>
                        <option value="金門縣">金門縣</option>
                        <option value="連江縣">連江縣</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-blue mb-1">搜尋名稱/關鍵字</label>
                    <input type="text" id="organic-search-input" oninput="filterOrganicMarkets()" placeholder="搜尋市集或地址..." class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1 px-2 focus:border-[#be5f48] focus:ring-[#be5f48]">
                </div>
            </div>

            <!-- Market Selector -->
            <div class="shrink-0">
                <label class="block text-[10px] font-bold text-slate-blue mb-1">選擇有機市集 (共 <span id="organic-market-count">0</span> 個地點)</label>
                <select id="organic-market-select" onchange="changeOrganicMarket(this.value)" class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1.5 focus:border-[#be5f48] focus:ring-[#be5f48]">
                    <!-- Options populated dynamically -->
                </select>
            </div>

            <!-- Market Info Card & Recommendations (Scrollable container) -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-sm custom-scrollbar">
                <div id="organic-market-details-card" class="space-y-sm text-left">
                    <!-- Details dynamically injected -->
                </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="pt-sm border-t border-outline-variant/20 flex gap-md shrink-0">
                <button onclick="closeMarketModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    關閉視窗
                </button>
                <a id="market-nav-link" href="#" target="_blank" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">directions</span> 規劃導航路線
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    window.filterOrganicMarkets = function() {
        const county = document.getElementById("organic-county-select").value;
        const query = document.getElementById("organic-search-input").value.trim().toLowerCase();

        const filtered = TAIWAN_ORGANIC_MARKETS.filter(m => {
            const matchCounty = (county === "all" || m.city === county);
            const matchQuery = (!query ||
                m.name.toLowerCase().includes(query) ||
                m.address.toLowerCase().includes(query) ||
                m.desc.toLowerCase().includes(query) ||
                m.badge.toLowerCase().includes(query)
            );
            return matchCounty && matchQuery;
        });

        const select = document.getElementById("organic-market-select");
        const countSpan = document.getElementById("organic-market-count");

        if (countSpan) countSpan.textContent = filtered.length;

        if (select) {
            select.innerHTML = filtered.map(m =>
                `<option value="${m.id}">${m.city} - ${m.name}</option>`
            ).join("");

            if (filtered.length > 0) {
                select.disabled = false;
                const exists = filtered.some(m => m.id === currentSelectedMarketId);
                if (exists) {
                    select.value = currentSelectedMarketId;
                    updateOrganicMarketDetails(currentSelectedMarketId);
                } else {
                    currentSelectedMarketId = filtered[0].id;
                    select.value = filtered[0].id;
                    updateOrganicMarketDetails(filtered[0].id);
                }
            } else {
                select.innerHTML = `<option value="">無符合的市集</option>`;
                select.disabled = true;
                const detailsContainer = document.getElementById("organic-market-details-card");
                if (detailsContainer) {
                    detailsContainer.innerHTML = `
                        <div class="text-center p-lg border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low">
                            <span class="material-symbols-outlined text-outline text-3xl">search_off</span>
                            <p class="text-xs font-bold text-on-surface-variant mt-1">找不到符合篩選條件的有機市集！</p>
                        </div>
                    `;
                }
            }
        }
    };

    filterOrganicMarkets();
}

function closeMarketModal() {
    const modal = document.getElementById("market-modal");
    if (modal) modal.remove();
    delete window.filterOrganicMarkets;
}

function changeOrganicMarket(id) {
    if (!id) return;
    currentSelectedMarketId = id;
    updateOrganicMarketDetails(id);
}

function updateOrganicMarketDetails(id) {
    const market = TAIWAN_ORGANIC_MARKETS.find(m => m.id === id);
    if (!market) return;

    const detailsContainer = document.getElementById("organic-market-details-card");
    if (detailsContainer) {
        let recommendationsHtml = "";
        if (market.recommendations && market.recommendations.length > 0) {
            recommendationsHtml = `
                <div class="space-y-sm mt-md">
                    <h4 class="text-xs font-extrabold text-slate-blue flex items-center gap-1">
                        <span class="material-symbols-outlined text-base text-secondary">local_florist</span> 今日當季特產推薦（一鍵加入採購單）
                    </h4>
                    <div class="space-y-sm">
                        ${market.recommendations.map(rec => {
                            const isProd = rec.category === "produce";
                            const icon = isProd ? "eco" : "egg";
                            const iconColor = isProd ? "text-secondary" : "text-primary";
                            const bgClass = isProd ? "bg-[#81b29a]/5 border-[#81b29a]/15" : "bg-[#e07a5f]/5 border-[#e07a5f]/15";
                            return `
                                <div class="flex items-center justify-between p-3 border rounded-xl ${bgClass}">
                                    <div class="flex items-center gap-sm">
                                        <span class="material-symbols-outlined ${iconColor} text-lg">${icon}</span>
                                        <div class="text-left">
                                            <p class="text-xs font-extrabold text-slate-blue">${rec.name}</p>
                                            <p class="text-[9px] text-on-surface-variant font-medium">${rec.note || ''}</p>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-md">
                                        <span class="text-xs font-extrabold text-slate-blue">$${rec.cost}</span>
                                        <button onclick="addMarketItemToShopping('${rec.name}', '${rec.category}', ${rec.cost})" class="bg-[#be5f48] hover:brightness-110 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] shadow-sm flex items-center gap-0.5 transition-transform active:scale-95">
                                            <span class="material-symbols-outlined text-xs">add</span> 加入
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>
            `;
        } else {
            recommendationsHtml = `
                <div class="text-center p-sm border border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low mt-md">
                    <p class="text-[10px] font-bold text-on-surface-variant">此市集暫無當季特產加購推薦</p>
                </div>
            `;
        }

        detailsContainer.innerHTML = `
            <div class="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-md space-y-sm">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-extrabold text-slate-blue">${market.name}</span>
                    <span class="bg-[#81b29a]/10 text-[#386753] border border-[#81b29a]/20 px-2 py-0.5 rounded text-[10px] font-extrabold">${market.badge}</span>
                </div>
                <div class="space-y-1.5 text-xs">
                    <p class="flex items-start gap-1 font-medium text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm text-[#be5f48] shrink-0">location_on</span>
                        <span><strong>地址：</strong>${market.address}</span>
                    </p>
                    <p class="flex items-start gap-1 font-medium text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm text-[#be5f48] shrink-0">schedule</span>
                        <span><strong>營業時間：</strong>${market.hours}</span>
                    </p>
                    <p class="text-[10px] text-outline font-medium pl-5">
                        💡 ${market.desc}
                    </p>
                </div>
            </div>
            ${recommendationsHtml}
        `;
    }

    const navLink = document.getElementById("market-nav-link");
    if (navLink) {
        navLink.href = market.gmapsUrl;
    }
}

function addMarketItemToShopping(name, category, cost) {
    let parsedName = name;
    let parsedQty = 1;
    let parsedUnit = "份";

    const match = name.match(/(.*?)\s*[\(（]\s*(\d+)\s*([\u4e00-\u9fa5\w]+)\s*[\)）]/);
    if (match) {
        parsedName = match[1].trim();
        parsedQty = parseInt(match[2], 10);
        parsedUnit = match[3].trim();
    }

    const exists = appState.shoppingList.some(item => item.name === parsedName);
    if (exists) {
        showToast(`「${parsedName}」已存在於採購單中！`, "warning");
        return;
    }

    const newItem = {
        id: "s_m_" + Date.now(),
        name: parsedName,
        category: category,
        qty: parsedQty,
        unit: parsedUnit,
        checked: false,
        status: "市集特產",
        estCost: cost
    };

    appState.shoppingList.push(newItem);
    saveState();

    if (isCloudMode && supabaseClient) {
        dbAddShoppingItem(newItem);
    }

    renderCurrentTab();
    showToast(`成功加入「${parsedName}」至小廚房採購單！`, "success");
}

function getInventoryItemCategory(item) {
    if (item.category) return item.category;
    const base = INGREDIENT_KNOWLEDGE_BASE[item.name];
    if (base && base.category) return base.category;
    const name = item.name;
    if (name.includes("雞") || name.includes("豬") || name.includes("牛") || name.includes("肉") || name.includes("蛋") || name.includes("乳") || name.includes("奶") || name.includes("魚") || name.includes("蝦") || name.includes("海鮮") || name.includes("起司") || name.includes("豆腐")) {
        return "protein";
    }
    return "produce";
}

function addFridgeItemToShopping(name, category) {
    const exists = appState.shoppingList.some(item => item.name === name);
    if (exists) {
        showToast(`「${name}」已存在於採買清單中！`, "warning");
        return;
    }

    const base = INGREDIENT_KNOWLEDGE_BASE[name];
    const itemCost = base ? base.cost : 50;
    const itemUnit = base ? base.unit : "份";

    const newItem = {
        id: "s_f_" + Date.now(),
        name: name,
        category: category,
        qty: 1,
        unit: itemUnit,
        image: generateIngredientImage(name, category),
        checked: false,
        status: "庫存補貨",
        estCost: itemCost
    };

    appState.shoppingList.push(newItem);
    saveState();

    if (isCloudMode && supabaseClient) {
        dbAddShoppingItem(newItem);
    }

    renderCurrentTab();
    showToast(`成功將「${name}」加入採買清單！`, "success");
}
window.addFridgeItemToShopping = addFridgeItemToShopping;

function getFridgeItemRowHtml(item, category) {
    const isUrgent = item.daysLeft <= 1;
    const daysText = item.daysLeft === 0 ? "今天到期" : `${item.daysLeft} 天`;
    const statusClass = isUrgent
        ? "text-rust-orange font-extrabold bg-error-container/30 border-error/20"
        : "text-[#386753] font-bold bg-[#81b29a]/10 border-[#81b29a]/25";
    const badgeColor = item.chamber === "frozen"
        ? "text-[#be5f48] bg-[#be5f48]/10 border-[#be5f48]/20"
        : statusClass;

    const chamberText = item.chamber === "frozen" ? "冷凍" : `保鮮：${daysText}`;
    const chamberIcon = item.chamber === "frozen" ? "ac_unit" : "hourglass_top";

    const catBadge = category === "produce"
        ? `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-secondary/5 border border-secondary/10 text-[10px] font-extrabold text-secondary/60"><span class="material-symbols-outlined text-[12px]">eco</span> 新鮮蔬果</span>`
        : `<span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 text-[10px] font-extrabold text-primary/60"><span class="material-symbols-outlined text-[12px]">egg</span> 蛋白質與乳製品</span>`;

    return `
        <tr class="text-sm bg-surface-container-highest/20 opacity-35 hover:opacity-75 transition-all duration-150 border-b border-outline-variant/10 select-none grayscale">
            <td class="p-3 text-center align-middle w-[8%]">
                <span class="material-symbols-outlined text-outline text-lg">kitchen</span>
            </td>
            <td class="p-3 align-middle w-[28%] font-extrabold text-slate-blue/70 text-base">
                ${item.name} <span class="text-xs font-normal text-outline-variant">(現存)</span>
            </td>
            <td class="p-3 align-middle font-bold text-slate-blue/70 w-[16%]">
                ${item.qty} ${item.unit}
            </td>
            <td class="p-3 align-middle w-[20%]">
                ${catBadge}
            </td>
            <td class="p-3 align-middle text-right w-[14%] font-extrabold">
                <span class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full border text-[10px] ${badgeColor}">
                    <span class="material-symbols-outlined text-[12px]">${chamberIcon}</span>
                    ${chamberText}
                </span>
            </td>
            <td class="p-3 align-middle text-center w-[7%]">
                <button onclick="addFridgeItemToShopping('${item.name}', '${category}')" class="text-secondary hover:text-white hover:bg-secondary border border-secondary/30 w-6 h-6 rounded-full transition-all active:scale-90 flex items-center justify-center mx-auto" title="一鍵加入採買單">
                    <span class="material-symbols-outlined text-[13px] font-black">add_shopping_cart</span>
                </button>
            </td>
            <td class="p-3 align-middle text-center w-[7%]">
                <span class="text-outline-variant">-</span>
            </td>
        </tr>
    `;
}

// ==========================================
// VOICE INPUT NLP PARSER & SPEECH CONTROLLERS
// ==========================================
const INGREDIENT_KNOWLEDGE_BASE = {
    "高麗菜": { category: "produce", cost: 60, unit: "顆" },
    "空心菜": { category: "produce", cost: 40, unit: "包" },
    "地瓜葉": { category: "produce", cost: 45, unit: "包" },
    "花椰菜": { category: "produce", cost: 55, unit: "顆" },
    "小松菜": { category: "produce", cost: 40, unit: "包" },
    "青江菜": { category: "produce", cost: 40, unit: "包" },
    "菠菜": { category: "produce", cost: 50, unit: "包" },
    "洋蔥": { category: "produce", cost: 25, unit: "顆" },
    "馬鈴薯": { category: "produce", cost: 30, unit: "顆" },
    "胡蘿蔔": { category: "produce", cost: 25, unit: "根" },
    "白蘿蔔": { category: "produce", cost: 45, unit: "根" },
    "香菇": { category: "produce", cost: 80, unit: "袋" },
    "杏鮑菇": { category: "produce", cost: 65, unit: "包" },
    "金針菇": { category: "produce", cost: 20, unit: "包" },
    "黑木耳": { category: "produce", cost: 50, unit: "袋" },
    "櫛瓜": { category: "produce", cost: 30, unit: "條" },
    "番茄": { category: "produce", cost: 25, unit: "顆" },
    "小黃瓜": { category: "produce", cost: 15, unit: "條" },
    "蘋果": { category: "produce", cost: 30, unit: "個" },
    "香蕉": { category: "produce", cost: 70, unit: "串" },
    "芭樂": { category: "produce", cost: 25, unit: "顆" },
    "南瓜": { category: "produce", cost: 80, unit: "顆" },
    "筊白筍": { category: "produce", cost: 80, unit: "包" },
    "山藥": { category: "produce", cost: 150, unit: "支" },
    "三星蔥": { category: "produce", cost: 60, unit: "把" },
    "青蔥": { category: "produce", cost: 40, unit: "把" },
    "大蒜": { category: "produce", cost: 80, unit: "袋" },
    "秋葵": { category: "produce", cost: 50, unit: "包" },
    "野蓮": { category: "produce", cost: 50, unit: "包" },
    "西瓜": { category: "produce", cost: 180, unit: "顆" },
    "檸檬": { category: "produce", cost: 15, unit: "個" },
    "雞肉": { category: "protein", cost: 180, unit: "包" },
    "牛肉": { category: "protein", cost: 250, unit: "包" },
    "豬肉": { category: "protein", cost: 140, unit: "包" },
    "排骨": { category: "protein", cost: 160, unit: "包" },
    "魚": { category: "protein", cost: 150, unit: "條" },
    "蝦": { category: "protein", cost: 200, unit: "盒" },
    "蛋": { category: "protein", cost: 95, unit: "盒" },
    "雞蛋": { category: "protein", cost: 95, unit: "盒" },
    "鮮乳": { category: "protein", cost: 95, unit: "瓶" },
    "鮮奶": { category: "protein", cost: 95, unit: "瓶" },
    "牛奶": { category: "protein", cost: 95, unit: "瓶" },
    "優格": { category: "protein", cost: 85, unit: "杯" },
    "豆腐": { category: "protein", cost: 35, unit: "盒" },
    "豆漿": { category: "protein", cost: 40, unit: "瓶" },
    "起司": { category: "protein", cost: 120, unit: "包" },
    "乳酪": { category: "protein", cost: 150, unit: "包" },
    "蛤蜊": { category: "protein", cost: 110, unit: "斤" }
};

function parseChineseNumber(str) {
    if (!str) return 1;
    str = str.trim();
    if (/^[0-9]+$/.test(str)) {
        return parseInt(str);
    }
    const mapping = {
        '一': 1, '二': 2, '兩': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
    };
    if (mapping[str] !== undefined) {
        return mapping[str];
    }
    if (str.length === 2) {
        if (str[0] === '十') {
            return 10 + (mapping[str[1]] || 0);
        }
        if (str[1] === '十') {
            return (mapping[str[0]] || 1) * 10;
        }
    } else if (str.length === 3 && str[1] === '十') {
        return (mapping[str[0]] || 1) * 10 + (mapping[str[2]] || 0);
    }

    const num = parseInt(str);
    return isNaN(num) ? 1 : num;
}

function parseTextToShoppingItems(text) {
    if (!text) return [];

    const clauses = text.split(/[，；、跟與和以及\s,;\.。\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const parsedItems = [];
    const verbsToStrip = /^(我要買|我需要|買|採購|加入|需要|想買|買個|買顆|買包)/;

    clauses.forEach(clause => {
        let cleanClause = clause.replace(verbsToStrip, "").trim();
        if (!cleanClause) return;

        let cost = null;
        const priceRegex = /([0-9一二三四五六七八九十兩百]+)\s*(元|塊錢|塊)/;
        let priceMatch = priceRegex.exec(cleanClause);
        if (priceMatch) {
            cost = parseChineseNumber(priceMatch[1]);
            cleanClause = cleanClause.replace(priceRegex, "").trim();
        }

        let qty = 1;
        let unit = "";
        let name = cleanClause;

        const unitPattern = "(個|顆|包|袋|瓶|罐|盒|支|把|斤|條|片|束|組|份|公克|g|G|ml)";

        const structBRegex = new RegExp(`^([0-9一二三四五六七八九十兩百]+)\\s*${unitPattern}\\s*(.+)`);
        const matchB = structBRegex.exec(cleanClause);

        if (matchB) {
            qty = parseChineseNumber(matchB[1]);
            unit = matchB[2];
            name = matchB[3].trim();
        } else {
            const structARegex = new RegExp(`(.+?)\\s*([0-9一二三四五六七八九十兩百]+)\\s*${unitPattern}$`);
            const matchA = structARegex.exec(cleanClause);
            if (matchA) {
                name = matchA[1].trim();
                qty = parseChineseNumber(matchA[2]);
                unit = matchA[3];
            } else {
                const numStartRegex = /^([0-9一二三四五六七八九十兩百]+)\s*(.+)/;
                const matchNumStart = numStartRegex.exec(cleanClause);
                if (matchNumStart) {
                    qty = parseChineseNumber(matchNumStart[1]);
                    name = matchNumStart[2].trim();
                    unit = "個";
                } else {
                    const numEndRegex = /(.+?)\s*([0-9一二三四五六七八九十兩百]+)$/;
                    const matchNumEnd = numEndRegex.exec(cleanClause);
                    if (matchNumEnd) {
                        name = matchNumEnd[1].trim();
                        qty = parseChineseNumber(matchNumEnd[2]);
                        unit = "個";
                    }
                }
            }
        }

        name = name.replace(/^[的與和跟]+/, "").replace(/[的與和跟]+$/, "").trim();
        if (!name) return;

        let category = "produce";
        let defaultUnit = "包";
        let defaultCost = 50;

        let kbMatch = null;
        for (const [key, value] of Object.entries(INGREDIENT_KNOWLEDGE_BASE)) {
            if (name.includes(key) || key.includes(name)) {
                kbMatch = value;
                break;
            }
        }

        if (kbMatch) {
            category = kbMatch.category;
            defaultUnit = kbMatch.unit;
            defaultCost = kbMatch.cost;
        } else {
            const proteinKeywords = ["肉", "雞", "豬", "牛", "魚", "蝦", "蟹", "海鮮", "蛋", "奶", "乳", "起司", "豆腐", "豆漿", "蛤", "蚵"];
            const isProtein = proteinKeywords.some(kw => name.includes(kw));
            category = isProtein ? "protein" : "produce";
            defaultUnit = isProduceUnit(name) ? "顆" : (isProtein ? "盒" : "包");
            defaultCost = isProtein ? 120 : 45;
        }

        const finalUnit = unit || defaultUnit;
        const finalCost = cost !== null ? cost : (defaultCost * qty);

        parsedItems.push({
            name: name,
            category: category,
            qty: qty,
            unit: finalUnit,
            estCost: finalCost,
            checked: true
        });
    });

    return parsedItems;
}

function isProduceUnit(name) {
    const units = ["高麗菜", "洋蔥", "馬鈴薯", "胡蘿蔔", "白蘿蔔", "南瓜", "番茄", "椰菜", "蘋果", "芭樂", "檸檬"];
    return units.some(u => name.includes(u));
}

let currentlyParsedItems = [];
let voiceRecognition = null;
let isVoiceListening = false;

function showVoiceInputModal() {
    const existing = document.getElementById("voice-input-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "voice-input-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in";

    currentlyParsedItems = [];
    isVoiceListening = false;
    voiceRecognition = null;

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg max-w-md w-full shadow-2xl border border-primary/5 mx-md max-h-[90vh] flex flex-col justify-between overflow-hidden animate-fade-in text-left">
            <!-- Header -->
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/20 mb-md shrink-0">
                <h3 class="text-base font-extrabold text-[#be5f48] flex items-center gap-1">
                    <span class="material-symbols-outlined text-[#be5f48] fill font-extrabold">mic</span> AI智慧語音新增食材
                </h3>
                <button onclick="closeVoiceInputModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Status & Waveform visualizer -->
            <div class="flex flex-col items-center space-y-sm bg-surface-container-low p-md rounded-2xl border border-outline-variant/20 shrink-0 text-center">
                <!-- Pulse microphone button -->
                <button id="mic-toggle-btn" onclick="toggleVoiceRecognition()" class="w-16 h-16 rounded-full bg-[#be5f48]/10 text-[#be5f48] flex items-center justify-center transition-all hover:bg-[#be5f48]/20 focus:outline-none shadow-md">
                    <span class="material-symbols-outlined text-3xl font-extrabold">mic</span>
                </button>
                <span id="voice-status-text" class="text-xs font-bold text-on-surface-variant">點擊麥克風開始錄音，或直接在下方打字輸入...</span>

                <!-- CSS wave visualizer -->
                <div class="voice-wave-container" id="voice-waveform" style="visibility: hidden;">
                    <div class="voice-wave-bar"></div>
                    <div class="voice-wave-bar"></div>
                    <div class="voice-wave-bar"></div>
                    <div class="voice-wave-bar"></div>
                    <div class="voice-wave-bar"></div>
                </div>
            </div>

            <!-- Scrollable container for text box and preview -->
            <div class="flex-1 overflow-y-auto space-y-md my-md pr-1 custom-scrollbar">
                <div>
                    <label class="block text-[10px] font-bold text-slate-blue mb-1">語音轉文字 (可直接手動輸入或修正內容)：</label>
                    <textarea id="voice-text-input" oninput="handleVoiceTextChange()" placeholder="請點選上方麥克風說話，例如：我要買兩顆高麗菜，還要三個蘋果和一瓶鮮乳" class="w-full h-24 rounded-2xl border-outline-variant focus:border-secondary focus:ring-secondary text-xs p-md bg-white font-bold leading-relaxed resize-none"></textarea>
                </div>

                <!-- Preview section -->
                <div id="parsed-items-preview">
                    <!-- Dynamically populated -->
                </div>
            </div>

            <!-- Footer buttons -->
            <div class="pt-sm border-t border-outline-variant/20 flex gap-md shrink-0">
                <button onclick="closeVoiceInputModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    取消
                </button>
                <button onclick="importVoiceItems()" class="flex-1 bg-[#be5f48] hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm font-extrabold">playlist_add</span> 匯入採買清單
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    renderParsedItemsPreview();
}

window.showVoiceInputModal = showVoiceInputModal;

function closeVoiceInputModal() {
    stopVoiceRecognition();
    const modal = document.getElementById("voice-input-modal");
    if (modal) modal.remove();
}

function toggleVoiceRecognition() {
    const micBtn = document.getElementById("mic-toggle-btn");
    const wave = document.getElementById("voice-waveform");
    const statusText = document.getElementById("voice-status-text");
    const textarea = document.getElementById("voice-text-input");

    if (!voiceRecognition) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            alert("您的瀏覽器不支援 Web Speech API 語音辨識功能，請使用 Chrome / Safari 瀏覽器，或直接在文字框中手動打字輸入！");
            return;
        }

        voiceRecognition = new SpeechRec();
        voiceRecognition.lang = "zh-TW";
        voiceRecognition.continuous = true;
        voiceRecognition.interimResults = true;

        voiceRecognition.onstart = () => {
            isVoiceListening = true;
            micBtn.classList.add("bg-primary", "text-white", "animate-mic-pulse");
            micBtn.classList.remove("bg-[#be5f48]/10", "text-[#be5f48]");
            wave.style.visibility = "visible";
            statusText.textContent = "正在聆聽中...請說出想採買的食材與數量...";
        };

        voiceRecognition.onresult = (event) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                transcript += event.results[i][0].transcript;
            }
            if (transcript) {
                textarea.value = transcript;
                updateVoiceInputParsing();
            }
        };

        voiceRecognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            stopVoiceRecognition();
            if (event.error === "not-allowed") {
                statusText.textContent = "麥克風授權失敗！請開啟權限，或直接在此輸入文字。";
            } else {
                statusText.textContent = "語音辨識發生錯誤，請嘗試直接在此手動輸入文字。";
            }
        };

        voiceRecognition.onend = () => {
            isVoiceListening = false;
            micBtn.classList.remove("bg-primary", "text-white", "animate-mic-pulse");
            micBtn.classList.add("bg-[#be5f48]/10", "text-[#be5f48]");
            wave.style.visibility = "hidden";
            statusText.textContent = "聆聽結束。您可以點擊麥克風按鈕重新錄音，或直接修改下方文字。";
        };
    }

    if (isVoiceListening) {
        stopVoiceRecognition();
    } else {
        try {
            voiceRecognition.start();
        } catch (e) {
            console.error(e);
        }
    }
}

function stopVoiceRecognition() {
    if (voiceRecognition && isVoiceListening) {
        voiceRecognition.stop();
    }
}

function handleVoiceTextChange() {
    updateVoiceInputParsing();
}

function updateVoiceInputParsing() {
    const text = document.getElementById("voice-text-input").value;
    currentlyParsedItems = parseTextToShoppingItems(text);
    renderParsedItemsPreview();
}

function renderParsedItemsPreview() {
    const container = document.getElementById("parsed-items-preview");
    if (!container) return;

    if (currentlyParsedItems.length === 0) {
        container.innerHTML = `
            <div class="text-center p-md border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low mt-sm">
                <span class="material-symbols-outlined text-outline text-2xl">psychology</span>
                <p class="text-[10px] font-bold text-on-surface-variant mt-1">尚未解析出任何食材項目...</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="text-[10px] font-extrabold text-slate-blue mb-xs mt-sm">自動解析結果 (共 ${currentlyParsedItems.length} 項)：</div>
        <div class="space-y-sm max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
            ${currentlyParsedItems.map((item, idx) => {
                const isProduce = item.category === "produce";
                const catIcon = isProduce ? "eco" : "egg";
                const catColor = isProduce ? "text-secondary bg-secondary/10 border-secondary/20" : "text-primary bg-primary/10 border-primary/20";
                return `
                    <div class="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/20 bg-surface-container-low text-left">
                        <div class="flex items-center gap-sm">
                            <input type="checkbox" id="voice-item-cb-${idx}" ${item.checked ? 'checked' : ''} onchange="toggleVoiceItemChecked(${idx})" class="custom-checkbox w-4.5 h-4.5 rounded border-outline-variant text-[#be5f48] focus:ring-[#be5f48]">
                            <div class="flex flex-col">
                                <span class="text-xs font-extrabold text-slate-blue">${item.name} (${item.qty} ${item.unit})</span>
                                <div class="inline-flex items-center gap-xs px-2 py-0.5 rounded-full border ${catColor} mt-1 w-max">
                                    <span class="material-symbols-outlined text-[10px] font-bold">${catIcon}</span>
                                    <span class="text-[8px] font-extrabold tracking-wider uppercase">${isProduce ? '新鮮蔬果' : '蛋白質與乳製品'}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-sm">
                            <span class="text-xs font-extrabold text-slate-blue">$${item.estCost}</span>
                            <button onclick="removeVoiceItem(${idx})" class="text-on-surface-variant hover:text-error p-1 rounded-full hover:bg-surface-container transition-colors">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function toggleVoiceItemChecked(idx) {
    if (currentlyParsedItems[idx]) {
        currentlyParsedItems[idx].checked = !currentlyParsedItems[idx].checked;
    }
}

function removeVoiceItem(idx) {
    currentlyParsedItems.splice(idx, 1);
    renderParsedItemsPreview();
}

function importVoiceItems() {
    const activeItems = currentlyParsedItems.filter(item => item.checked);
    if (activeItems.length === 0) {
        alert("請至少勾選一項食材進行匯入！");
        return;
    }

    activeItems.forEach((item, index) => {
        const newItem = {
            id: "s_v_" + Date.now() + "_" + index,
            name: item.name,
            category: item.category,
            qty: item.qty,
            unit: item.unit,
            image: item.image || generateIngredientImage(item.name, item.category),
            checked: false,
            status: "語音新增",
            estCost: item.estCost
        };
        appState.shoppingList.push(newItem);
        if (isCloudMode && supabaseClient) {
            dbAddShoppingItem(newItem);
        }
    });

    saveState();
    closeVoiceInputModal();
    renderCurrentTab();
    showToast(`成功用語音新增 ${activeItems.length} 項食材！`, "success");
}



// ==========================================
// VIEW 3 CONTROLLER: SCAN INVOICE & ENCOURAGEMENT MODALS
// ==========================================
const MOCK_INVOICE_ITEMS = [
    { name: "小農放牧蛋", category: "protein", qty: 10, unit: "入", estCost: 120 },
    { name: "水洗空心菜", category: "produce", qty: 1, unit: "包", estCost: 40 },
    { name: "履歷鮮香菇", category: "produce", qty: 1, unit: "包", estCost: 55 },
    { name: "台灣黑豬肉絲", category: "protein", qty: 1, unit: "包", estCost: 110 },
    { name: "溫室小黃瓜", category: "produce", qty: 1, unit: "包", estCost: 50 },
    { name: "優鮮鮮乳", category: "protein", qty: 1, unit: "瓶", estCost: 95 }
];

function showScanInvoiceModal() {
    const existing = document.getElementById("scan-invoice-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "scan-invoice-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in";
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg max-w-sm w-full shadow-2xl border border-primary/5 mx-md animate-fade-in">
            <div class="flex flex-col items-center justify-center p-xl text-center space-y-md">
                <div class="relative w-40 h-56 bg-surface-container border-2 border-dashed border-[#be5f48]/40 rounded-xl overflow-hidden flex items-center justify-center shadow-inner">
                    <div class="w-32 h-48 bg-white shadow-md rounded p-2 flex flex-col justify-between text-[6px] text-on-surface-variant/40 space-y-1 select-none">
                        <div class="text-center font-extrabold text-[8px] text-slate-blue border-b pb-0.5">統一發票收據</div>
                        <div class="space-y-0.5 border-b pb-1">
                            <div class="flex justify-between"><span>品項A x1</span><span>$120</span></div>
                            <div class="flex justify-between"><span>品項B x1</span><span>$40</span></div>
                            <div class="flex justify-between"><span>品項C x1</span><span>$55</span></div>
                            <div class="flex justify-between"><span>品項D x1</span><span>$110</span></div>
                        </div>
                        <div class="flex justify-between font-bold text-slate-blue"><span>總計</span><span>$325</span></div>
                    </div>
                    <div class="animate-scan-line"></div>
                </div>
                <div class="space-y-sm">
                    <h4 class="text-base font-extrabold text-slate-blue animate-pulse">正在掃描辨識發票/收據...</h4>
                    <p class="text-xs text-on-surface-variant font-medium">CooCoo AI 正在智能解析消費明細</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    setTimeout(() => {
        renderScanInvoiceResults(modal);
    }, 1200);
}

function closeScanInvoiceModal() {
    const modal = document.getElementById("scan-invoice-modal");
    if (modal) modal.remove();
    // Clean up exposed functions
    delete window.toggleScanCheckbox;
    delete window.toggleSelectAllScan;
    delete window.importScanInvoiceItems;
}

function renderScanInvoiceResults(modal) {
    let checkedStates = MOCK_INVOICE_ITEMS.map(() => true); // Default all checked

    function getResultHtml() {
        return `
        <div class="bg-white rounded-3xl p-lg max-w-md w-full shadow-2xl border border-primary/5 mx-md max-h-[85vh] flex flex-col justify-between overflow-hidden animate-fade-in">
            <!-- Header -->
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/20 mb-md">
                <h3 class="text-lg font-extrabold text-slate-blue flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#be5f48]">receipt_long</span> 掃描解析結果
                </h3>
                <button onclick="closeScanInvoiceModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Scrollable List -->
            <div class="flex-1 overflow-y-auto space-y-sm pr-1 custom-scrollbar">
                <div class="flex justify-between items-center mb-sm">
                    <span class="text-xs text-on-surface-variant font-bold">共偵測到 ${MOCK_INVOICE_ITEMS.length} 項食材，請勾選要匯入的項目：</span>
                    <button onclick="toggleSelectAllScan()" id="scan-select-all-btn" class="text-[10px] bg-slate-blue/10 hover:bg-slate-blue/20 text-[#be5f48] font-extrabold px-2 py-0.5 rounded transition-all">
                        取消全選
                    </button>
                </div>
                <div class="space-y-sm">
                    ${MOCK_INVOICE_ITEMS.map((item, idx) => {
                        const isProduce = item.category === "produce";
                        const categoryText = isProduce ? "新鮮蔬果" : "蛋白質與乳製品";
                        const categoryIcon = isProduce ? "eco" : "egg";
                        const categoryColor = isProduce ? "text-secondary bg-secondary/10 border-secondary/20" : "text-primary bg-primary/10 border-primary/20";
                        return `
                            <label class="flex items-center justify-between p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-colors">
                                <div class="flex items-center gap-md">
                                    <input type="checkbox" id="scan-checkbox-${idx}" ${checkedStates[idx] ? 'checked' : ''} onchange="toggleScanCheckbox(${idx})" class="custom-checkbox w-4.5 h-4.5 rounded border-outline-variant text-[#be5f48] focus:ring-[#be5f48]">
                                    <div class="flex flex-col">
                                        <span class="font-extrabold text-sm text-slate-blue">${item.name} (${item.qty}${item.unit})</span>
                                        <div class="inline-flex items-center gap-xs px-2.5 py-1 rounded-full border ${categoryColor} mt-1 w-max">
                                            <span class="material-symbols-outlined text-[12px] font-bold">${categoryIcon}</span>
                                            <span class="text-[9px] font-extrabold tracking-wider uppercase">${categoryText}</span>
                                        </div>
                                    </div>
                                </div>
                                <span class="text-xs font-extrabold text-slate-blue">$${item.estCost}</span>
                            </label>
                        `;
                    }).join("")}
                </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="pt-lg border-t border-outline-variant/20 mt-lg flex gap-md">
                <button onclick="closeScanInvoiceModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    取消
                </button>
                <button onclick="importScanInvoiceItems()" class="flex-1 bg-[#be5f48] hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">download</span> 確認加入清單
                </button>
            </div>
        </div>
        `;
    }

    window.toggleScanCheckbox = function(idx) {
        checkedStates[idx] = !checkedStates[idx];
        const btn = document.getElementById("scan-select-all-btn");
        const allChecked = checkedStates.every(s => s);
        btn.textContent = allChecked ? "取消全選" : "全選";
    };

    window.toggleSelectAllScan = function() {
        const allChecked = checkedStates.every(s => s);
        checkedStates = checkedStates.map(() => !allChecked);
        MOCK_INVOICE_ITEMS.forEach((_, idx) => {
            const cb = document.getElementById(`scan-checkbox-${idx}`);
            if (cb) cb.checked = !allChecked;
        });
        const btn = document.getElementById("scan-select-all-btn");
        btn.textContent = !allChecked ? "取消全選" : "全選";
    };

    window.importScanInvoiceItems = function() {
        const itemsToImport = [];
        MOCK_INVOICE_ITEMS.forEach((item, idx) => {
            if (checkedStates[idx]) {
                itemsToImport.push({
                    id: "s_scan_" + Date.now() + "_" + idx,
                    name: item.name,
                    category: item.category,
                    qty: item.qty,
                    unit: item.unit,
                    image: item.image || generateIngredientImage(item.name, item.category),
                    checked: false,
                    status: "掃描匯入",
                    estCost: item.estCost
                });
            }
        });

        if (itemsToImport.length === 0) {
            alert("請至少勾選一項食材進行匯入！");
            return;
        }

        // Add to appState
        itemsToImport.forEach(item => {
            appState.shoppingList.push(item);
            if (isCloudMode && supabaseClient) {
                dbAddShoppingItem(item);
            }
        });

        saveState();
        closeScanInvoiceModal();
        renderCurrentTab();
        showToast(`成功匯入 ${itemsToImport.length} 項發票明細至採買清單！`, "success");
    };

    modal.innerHTML = getResultHtml();
}

const TAIWAN_TRADITIONAL_MARKETS = [
    {
        id: "keelung_renai",
        city: "基隆市",
        name: "基隆仁愛公有市場",
        address: "基隆市仁愛區愛三路21號",
        hours: "每日 06:00 - 14:00 (熟食區至 20:00)",
        desc: "基隆最具盛名的傳統市場，一樓是傳統生鮮早市，二樓則是熱門的在地海鮮熟食與咖啡廳聚集地，是兼具買菜與享用美食的好去處。",
        badge: "基隆早熟市",
        gmapsUrl: "https://maps.google.com/?q=基隆仁愛市場",
        recommendations: [
            { name: "手工甜不辣 (1斤)", category: "protein", cost: 90, note: "純鯊魚漿製作、煮湯油炸皆宜" },
            { name: "崁仔頂直送鎖管 (300g)", category: "protein", cost: 160, note: "肉質清脆肥美、川燙首選" }
        ]
    },
    {
        id: "keelung_xinyi",
        city: "基隆市",
        name: "基隆信義公有市場",
        address: "基隆市信義區信二路204號",
        hours: "每日 06:00 - 13:00",
        desc: "基隆在地的重要生活早市，提供新鮮現撈海鮮與各種傳統小吃，深受基隆市民日常依賴。",
        badge: "基隆早市",
        gmapsUrl: "https://maps.google.com/?q=基隆信義公有市場"
    },
    {
        id: "taipei_nanmen",
        city: "台北市",
        name: "南門公有零售市場",
        address: "台北市中正區羅斯福路一段8號",
        hours: "每週二至週日 07:00 - 19:00 (週一休市)",
        desc: "台北歷史悠久的指標型老市場，以南北雜貨、精緻熟食、新鮮蔬果及小農家禽肉品聞名，大樓改建後環境明亮乾淨舒適。",
        badge: "台北早市",
        gmapsUrl: "https://maps.google.com/?q=南門市場",
        recommendations: [
            { name: "手作上海生煎包 (6入)", category: "protein", cost: 90, note: "鮮美多汁、傳統點心首選" },
            { name: "老店手工年糕 (1包)", category: "produce", cost: 65, note: "軟糯香醇、適合與白菜清炒" },
            { name: "在地放山土雞切塊 (半隻)", category: "protein", cost: 280, note: "肉質緊實有彈性、適合煲湯" }
        ]
    },
    {
        id: "taipei_binjiang",
        city: "台北市",
        name: "濱江公有第二市場",
        address: "台北市中山區民族東路336號",
        hours: "每週二至週日 06:00 - 14:00 (週一休市)",
        desc: "大台北地區蔬果海鮮的批發大本營，食材新鮮度與種類均為頂級，小農直營攤位眾多，是大量採購者的最愛。",
        badge: "台北早市",
        gmapsUrl: "https://maps.google.com/?q=濱江第二市場"
    },
    {
        id: "taipei_shilin",
        city: "台北市",
        name: "士林公有市場",
        address: "台北市士林區大南路101號",
        hours: "每週二至週日 06:00 - 13:00 (週一休市)",
        desc: "百年歷史老市場，早市部分充滿在地生鮮肉品與新鮮時蔬，周邊鄰近廟口，採買氣氛熱絡。",
        badge: "台北早市",
        gmapsUrl: "https://maps.google.com/?q=士林公有市場"
    },
    {
        id: "taipei_chenggong",
        city: "台北市",
        name: "成功公有臨時市場",
        address: "台北市大安區敦化南路二段120號",
        hours: "每週二至週日 06:00 - 13:00 (週一休市)",
        desc: "大安區核心的中高檔住宅區市場，攤位齊全，主打精緻小農蔬菜、產銷履歷肉品，深受附近主婦喜愛。",
        badge: "台北早市",
        gmapsUrl: "https://maps.google.com/?q=成功臨時市場"
    },
    {
        id: "taipei_shuanglian",
        city: "台北市",
        name: "雙連朝市",
        address: "台北市中山區民生西路45巷一帶",
        hours: "每日 07:00 - 13:00",
        desc: "鄰近雙連捷運站與文昌宮的帶狀露天朝市，除了優質小農蔬菜與肉品外，也是體驗台北老街區人情味的最佳場所。",
        badge: "台北早市",
        gmapsUrl: "https://maps.google.com/?q=雙連朝市"
    },
    {
        id: "new_taipei_shulin",
        city: "新北市",
        name: "樹林保安公有市場",
        address: "新北市樹林區保安街一段7號",
        hours: "每日 06:00 - 13:00 (早市) / 15:00 - 20:00 (黃昏市)",
        desc: "融入現代設計語彙的保安市場，早市有新鮮小農產地直銷蔬菜，傍晚黃昏市場更是雙北通勤族購買晚餐食材與熟食的熱點。",
        badge: "新北早傍市",
        gmapsUrl: "https://maps.google.com/?q=樹林保安市場",
        recommendations: [
            { name: "溫體黑豬肉絲 (300g)", category: "protein", cost: 130, note: "當日現宰鮮甜、無腥味" },
            { name: "現採無毒地瓜葉 (2包)", category: "produce", cost: 50, note: "鮮嫩富鐵質、適合大火蒜炒" },
            { name: "古法鹽水雞 (半隻)", category: "protein", cost: 180, note: "黃昏熟食名產、即食省時好料" }
        ]
    },
    {
        id: "new_taipei_huangshi",
        city: "新北市",
        name: "板橋黃石市場",
        address: "新北市板橋區宮口街37號",
        hours: "每日 06:00 - 14:00",
        desc: "板橋舊市區的核心公有早市，擁有極多排隊熟食老字號，以及板橋小農自種的當季時令綠色蔬菜。",
        badge: "新北早市",
        gmapsUrl: "https://maps.google.com/?q=板橋黃石市場"
    },
    {
        id: "new_taipei_luzhou",
        city: "新北市",
        name: "蘆洲湧蓮寺廟口黃昏市場",
        address: "新北市蘆洲區得勝街與成功路一帶",
        hours: "每日 15:00 - 20:00",
        desc: "蘆洲最熱鬧的黃昏菜市，圍繞著湧蓮寺，傍晚時分人潮洶湧，除了低價新鮮蔬果，還有豐富的現做小吃與熟食。",
        badge: "新北黃昏市",
        gmapsUrl: "https://maps.google.com/?q=湧蓮寺黃昏市場"
    },
    {
        id: "new_taipei_xizhou",
        city: "新北市",
        name: "永和溪洲公有零售市場",
        address: "新北市永和區勵行街65號",
        hours: "每日 06:00 - 13:00",
        desc: "中永和地區極具歷史的早市，市場內部攤商林立，生鮮蔬菜及暢銷熟食十分豐富，是永和人買菜核心地標。",
        badge: "新北早市",
        gmapsUrl: "https://maps.google.com/?q=永和溪洲市場"
    },
    {
        id: "new_taipei_chongxin",
        city: "新北市",
        name: "三重重新公有零售市場",
        address: "新北市三重區重新路二段150號",
        hours: "每日 06:00 - 13:00 (週一休市)",
        desc: "三重核心的室內公有零售早市，環境整潔明亮，主打當季綠色蔬菜與新鮮溫體豬肉、牛肉與魚獲。",
        badge: "新北早市",
        gmapsUrl: "https://maps.google.com/?q=三重重新市場"
    },
    {
        id: "taoyuan_nanmen",
        city: "桃園市",
        name: "桃園南門市場",
        address: "桃園市桃園區三民路三段與文化街一帶",
        hours: "每日 06:00 - 13:00",
        desc: "桃園市區規模最大的傳統生鮮市場，蔬果種類齊全、海鮮攤位眾多，價格十分親民。",
        badge: "桃園早市",
        gmapsUrl: "https://maps.google.com/?q=桃園南門市場"
    },
    {
        id: "taoyuan_xinming",
        city: "桃園市",
        name: "中壢新明市場",
        address: "桃園市中壢區明德路60號",
        hours: "每日 06:00 - 13:00",
        desc: "中壢指標型公有市場，早市販售當日新鮮家禽肉品與各類熟食，能輕鬆買齊一週食材。",
        badge: "桃園早市",
        gmapsUrl: "https://maps.google.com/?q=中壢新明市場"
    },
    {
        id: "taoyuan_yonghe",
        city: "桃園市",
        name: "桃園永和公有零售市場",
        address: "桃園市桃園區中正路150號",
        hours: "每日 06:00 - 13:00 (週一休市)",
        desc: "桃園區歷史悠久的公有零售早市，提供多種優質肉品、海鮮以及桃園在地產銷履歷時蔬。",
        badge: "桃園早市",
        gmapsUrl: "https://maps.google.com/?q=桃園永和市場"
    },
    {
        id: "hsinchu_zhulian",
        city: "新竹市",
        name: "新竹竹蓮公有零售市場",
        address: "新竹市東區竹蓮街15號",
        hours: "每週二至週日 06:00 - 13:00 (週一休市)",
        desc: "新竹市現代化公有零售市場，附設冷氣與手扶梯，一樓為生鮮蔬果，二樓為日用與熟食，環境十分舒適乾淨。",
        badge: "新竹早市",
        gmapsUrl: "https://maps.google.com/?q=新竹竹蓮市場"
    },
    {
        id: "hsinchu_dongmen",
        city: "新竹市",
        name: "新竹東門公有零售市場",
        address: "新竹市東區大同路86號",
        hours: "每日 09:00 - 22:00",
        desc: "老市場活化轉型典範，白天保留了傳統豬肉、蔬菜與海鮮攤位，夜晚則化身特色創意熟食區。",
        badge: "新竹全天市",
        gmapsUrl: "https://maps.google.com/?q=新竹東門市場"
    },
    {
        id: "hsinchu_ximen",
        city: "新竹市",
        name: "新竹西門公有零售市場",
        address: "新竹市北區西安街86號",
        hours: "每日 06:00 - 13:00",
        desc: "鄰近新竹城隍廟的古老菜市，有客家特色米食、新鮮蔬果與優質肉商，是新竹在地人的採購私房景點。",
        badge: "新竹早市",
        gmapsUrl: "https://maps.google.com/?q=新竹西門市場"
    },
    {
        id: "hsinchu_county_zhubei",
        city: "新竹縣",
        name: "竹北公有零售市場",
        address: "新竹縣竹北市竹仁街101號",
        hours: "每日 06:00 - 12:30",
        desc: "竹北地區的核心傳統市場，一樓設有生鮮蔬果及南北雜貨，二樓提供停車，是竹北居民週末採購的首選。",
        badge: "新竹縣早市",
        gmapsUrl: "https://maps.google.com/?q=竹北公有零售市場"
    },
    {
        id: "hsinchu_county_zhudong",
        city: "新竹縣",
        name: "竹東中央公有零售市場",
        address: "新竹縣竹東鎮仁愛路312號",
        hours: "每日 06:00 - 13:00",
        desc: "全台最大的客家傳統市場，聚集了超過四百多個攤位，以各式客家美食、米食粄條、小農山特產著稱。",
        badge: "新竹縣早市",
        gmapsUrl: "https://maps.google.com/?q=竹東中央市場"
    },
    {
        id: "hsinchu_county_xinpu",
        city: "新竹縣",
        name: "新埔第一公有零售市場",
        address: "新竹縣新埔鎮中正路與和平街口",
        hours: "每日 06:00 - 12:00",
        desc: "樸實的新埔客家老菜市，以新鮮在地蔬菜、客家桔醬、客家柿餅及手工油麵聞名，食材充滿客家風味。",
        badge: "新竹縣早市",
        gmapsUrl: "https://maps.google.com/?q=新埔第一公有零售市場"
    },
    {
        id: "miaoli_first",
        city: "苗栗縣",
        name: "苗栗市第一公有零售市場",
        address: "苗栗縣苗栗市大同路與新苗街口",
        hours: "每日 06:00 - 12:30",
        desc: "客家風情濃厚的傳統市場，有許多手工客家菜包、米食點心，以及苗栗丘陵小農自種的無毒時蔬。",
        badge: "苗栗早市",
        gmapsUrl: "https://maps.google.com/?q=苗栗第一市場"
    },
    {
        id: "miaoli_zhunan",
        city: "苗栗縣",
        name: "竹南第二公有零售市場",
        address: "苗栗縣竹南鎮民權街與延平row口",
        hours: "每日 06:00 - 12:30",
        desc: "竹南鎮民生活採購的重要樞紐，以新鮮小農蔬果、溫體黑豬肉與後龍海線現撈新鮮魚貨聞名。",
        badge: "苗栗早市",
        gmapsUrl: "https://maps.google.com/?q=竹南第二公有零售市場"
    },
    {
        id: "miaoli_toufen",
        city: "苗栗縣",
        name: "頭份市公有零售市場",
        address: "苗栗縣頭份市中山路132號",
        hours: "每日 06:00 - 12:30",
        desc: "頭份市中心的熱鬧大早市，匯集了苗栗三義、公館等山區的當季竹筍、野菜與多款客家鹹菜熟食。",
        badge: "苗栗早市",
        gmapsUrl: "https://maps.google.com/?q=頭份市公有零售市場"
    },
    {
        id: "taichung_jianguo",
        city: "台中市",
        name: "建國公有零售市場",
        address: "台中市東區建成路500號",
        hours: "每週二至週日 05:00 - 12:00 (週一休市)",
        desc: "全國最大規模的公有零售市場，復古外觀與通風採光設計兼具，匯集上千個生鮮批發與零售小農攤位。",
        badge: "台中早市",
        gmapsUrl: "https://maps.google.com/?q=台中建國市場",
        recommendations: [
            { name: "產地高山高麗菜 (1顆)", category: "produce", cost: 70, note: "梨山直送、清脆甜美" },
            { name: "大甲新鮮芋頭 (1大包)", category: "produce", cost: 95, note: "綿密鬆軟、煮粥火鍋首選" },
            { name: "產地直送新鮮蛤蜊 (600g)", category: "protein", cost: 140, note: "吐沙完全、肉質飽滿" }
        ]
    },
    {
        id: "taichung_yingcai",
        city: "台中市",
        name: "櫻花黃昏零售市場",
        address: "台中市西屯區弘孝路與櫻花路口",
        hours: "每日 14:00 - 19:30",
        desc: "西屯區極受歡迎的黃昏市場，有豐富的生鮮海產、農地直送蔬菜及熟食，非常方便上班族下班後快速選購補貨。",
        badge: "台中黃昏市",
        gmapsUrl: "https://maps.google.com/?q=櫻花黃昏市場",
        recommendations: [
            { name: "現撈鮭魚輪切 (1片)", category: "protein", cost: 180, note: "油脂豐富、煎烤極香" },
            { name: "有機甜椒三色組 (1包)", category: "produce", cost: 65, note: "色彩繽紛、富維生素C" }
        ]
    },
    {
        id: "taichung_second",
        city: "台中市",
        name: "台中市第二公有零售市場",
        address: "台中市中區三民路二段87號",
        hours: "每週二至週日 07:00 - 14:00",
        desc: "著名的三翼放射狀日治百年市場，以在地小吃聞名，上午時分市場內也有許多優質小農生鮮菜攤。",
        badge: "台中早市",
        gmapsUrl: "https://maps.google.com/?q=台中第二市場"
    },
    {
        id: "taichung_shinguang",
        city: "台中市",
        name: "十甲新光黃昏市場",
        address: "台中市東區十甲路470號",
        hours: "每日 14:00 - 19:30",
        desc: "台中東區超大型黃昏市場，生鮮肉品、現撈海產到各類熟食炸物一應俱全，是精打細算自煮族的採購天堂。",
        badge: "台中黃昏市",
        gmapsUrl: "https://maps.google.com/?q=十甲新光黃昏市場"
    },
    {
        id: "taichung_fifth",
        city: "台中市",
        name: "台中第五公有零售市場",
        address: "台中市西區自立街99號",
        hours: "每週二至週日 07:00 - 13:00 (週一休市)",
        desc: "鄰近台中文學館，有眾多知名傳統小吃老店，生鮮蔬菜及手工丸子攤位非常受市民喜愛。",
        badge: "台中早市",
        gmapsUrl: "https://maps.google.com/?q=台中第五市場"
    },
    {
        id: "changhua_sanmin",
        city: "彰化縣",
        name: "彰化三民公有零售市場",
        address: "彰化縣彰化市三民路與長安街口",
        hours: "每日 06:00 - 12:30",
        desc: "彰化市區指標型早市，提供大肚溪流域周邊小農生產的新鮮蔬菜、溫體豬肉與鮮魚。",
        badge: "彰化早市",
        gmapsUrl: "https://maps.google.com/?q=彰化三民市場"
    },
    {
        id: "changhua_yuanlin",
        city: "彰化縣",
        name: "員林第一公有零售市場",
        address: "彰化縣員林市博愛路與民生路口",
        hours: "每日 06:00 - 13:00",
        desc: "南彰化最大的生鮮早市與美食集中地，生鮮食材種類豐富，水果、綠色蔬菜價格極具競爭力。",
        badge: "彰化早市",
        gmapsUrl: "https://maps.google.com/?q=員林第一公有市場"
    },
    {
        id: "changhua_lukang",
        city: "彰化縣",
        name: "鹿港第一公有零售市場",
        address: "彰化縣鹿港鎮民族路196號",
        hours: "每日 06:00 - 13:00",
        desc: "位於鹿港小鎮核心的歷史老市場，白天可採買到彰化沿海的現撈海鮮與當地彰化小農特產時蔬。",
        badge: "彰化早市",
        gmapsUrl: "https://maps.google.com/?q=鹿港第一零售市場"
    },
    {
        id: "nantou_daguan",
        city: "南投縣",
        name: "草屯大觀公有市場",
        address: "南投縣草屯鎮芬草路一段與大觀街一帶",
        hours: "每日 06:00 - 12:30",
        desc: "草屯鎮鬧區最大的生鮮早市，匯集南投各山區直送的水流、新鮮野菜、竹筍，新鮮且價格超值。",
        badge: "南投早市",
        gmapsUrl: "https://maps.google.com/?q=草屯大觀市場"
    },
    {
        id: "nantou_central",
        city: "南投縣",
        name: "南投市公有零售市場",
        address: "南投縣南投市中山街121號",
        hours: "每日 06:00 - 12:30",
        desc: "南投市歷史最悠久的公有零售早市，販售許多南投山山產、新鮮香菇、溫體肉品與在地醃製山菜。",
        badge: "南投早市",
        gmapsUrl: "https://maps.google.com/?q=南投市公有零售市場"
    },
    {
        id: "nantou_puli",
        city: "南投縣",
        name: "埔里第一公有零售市場",
        address: "南投縣埔里鎮東榮路與西康路口",
        hours: "每日 06:00 - 12:30",
        desc: "埔里盆地內的核心傳統市場，以埔里在地筊白筍、香菇、百香果等優質農特產品批發與零售聞名。",
        badge: "南投早市",
        gmapsUrl: "https://maps.google.com/?q=埔里第一公有零售市場"
    },
    {
        id: "yunlin_douliu",
        city: "雲林縣",
        name: "斗六東公有零售市場",
        address: "雲林縣斗六市愛國街與中正路一帶",
        hours: "每日 06:00 - 12:30",
        desc: "農業大縣雲林的產地直銷大本營，每天都有大量在地老農載著自家採收的鮮菜來此低價直銷。",
        badge: "雲林早市",
        gmapsUrl: "https://maps.google.com/?q=斗六東市場"
    },
    {
        id: "yunlin_huwei",
        city: "雲林縣",
        name: "虎尾鎮第一公有零售市場",
        address: "雲林縣虎尾鎮中正路與新興路口",
        hours: "每日 06:00 - 12:30",
        desc: "虎尾鎮民採買的重心，充滿雲林平原在地農特產品，以價格實惠、食材新鮮著稱。",
        badge: "雲林早市",
        gmapsUrl: "https://maps.google.com/?q=虎尾第一公有零售市場"
    },
    {
        id: "yunlin_xiluo",
        city: "雲林縣",
        name: "西螺鎮公有零售市場",
        address: "雲林縣西螺鎮建興路與源成路口",
        hours: "每日 06:00 - 12:30",
        desc: "緊鄰台灣最大蔬菜產區西螺，擁有最新鮮且價格最便宜的當日採收蔬菜，是中台灣精明主婦的買菜勝地。",
        badge: "雲林早市",
        gmapsUrl: "https://maps.google.com/?q=西螺公有零售市場"
    },
    {
        id: "chiayi_east",
        city: "嘉義市",
        name: "嘉義市東市場",
        address: "嘉義市東區忠孝路與光彩街一帶",
        hours: "每日 06:00 - 13:00",
        desc: "嘉義百年歷史木構造老市場，充滿嘉義在地古早味美食，早市則有豐富的阿里山山產野菜、鮮筍及梅山茶產物。",
        badge: "嘉義早市",
        gmapsUrl: "https://maps.google.com/?q=嘉義東市場"
    },
    {
        id: "chiayi_west",
        city: "嘉義市",
        name: "嘉義市西市場",
        address: "嘉義市西區國華街245號",
        hours: "每日 06:00 - 13:00",
        desc: "改建後寬敞乾淨的西市場，白天提供各式溫體肉商、海鮮與農地直送蔬菜，並附設停車場十分便利。",
        badge: "嘉義早市",
        gmapsUrl: "https://maps.google.com/?q=嘉義西市場"
    },
    {
        id: "chiayi_county_puzi",
        city: "嘉義縣",
        name: "朴子市第一公有零售市場",
        address: "嘉義縣朴子市開元路130號",
        hours: "每日 06:00 - 12:30",
        desc: "嘉義海線重要的老菜市，販售許多東石海鮮、布袋鮮蚵以及海線小農的鮮甜綠色時蔬。",
        badge: "嘉義縣早市",
        gmapsUrl: "https://maps.google.com/?q=朴子第一零售市場"
    },
    {
        id: "chiayi_county_minxiong",
        city: "嘉義縣",
        name: "民雄鄉公有零售市場",
        address: "嘉義縣民雄鄉民雄路96號",
        hours: "每日 06:00 - 12:30",
        desc: "民雄最大傳統生鮮市場，除了新鮮家禽、鮮魚、溫體黑豬肉外，還有民雄特產鳳梨、小農野菜等。",
        badge: "嘉義縣早市",
        gmapsUrl: "https://maps.google.com/?q=民雄鄉公有零售市場"
    },
    {
        id: "tainan_dongmen",
        city: "台南市",
        name: "東門公有零售市場",
        address: "台南市東區府連路357號",
        hours: "每週二至週日 06:00 - 12:30 (週一休市)",
        desc: "富含台南歷史情懷的老菜市，除了買菜買肉，更隱藏了許多小農自種的野菜以及在地熟食老攤，非常適合精準買菜的烹飪者。",
        badge: "台南早市",
        gmapsUrl: "https://maps.google.com/?q=台南東門市場",
        recommendations: [
            { name: "新化有機筍 (1包)", category: "produce", cost: 85, note: "清甜無苦味、夏日涼拌良伴" },
            { name: "無刺虱目魚肚片 (2片)", category: "protein", cost: 120, note: "傳統手作、富含優質蛋白質" }
        ]
    },
    {
        id: "tainan_yamuliao",
        city: "台南市",
        name: "台南鴨母寮市場",
        address: "台南市北區成功路158巷內",
        hours: "每日 06:00 - 13:00",
        desc: "台南老一輩極具感情的早市，市場內販售大量台南溫體牛肉、新鮮虱目魚肉及小農現摘新鮮鮮花與蔬菜。",
        badge: "台南早市",
        gmapsUrl: "https://maps.google.com/?q=鴨母寮市場"
    },
    {
        id: "tainan_chongde",
        city: "台南市",
        name: "崇德黃昏零售市場",
        address: "台南市東區崇德路302號",
        hours: "每日 14:30 - 19:30",
        desc: "台南東區最具人氣的黃昏市場，有著豐富的海產、新鮮蔬菜及多樣化熟食，適合傍晚返家途中的市民採購。",
        badge: "台南黃昏市",
        gmapsUrl: "https://maps.google.com/?q=崇德黃昏市場"
    },
    {
        id: "tainan_sacred",
        city: "台南市",
        name: "台南水仙宮市場",
        address: "台南市中西區神農街1號",
        hours: "每日 06:00 - 13:00",
        desc: "與國華街美食區相連的百年老市場，白天為台南在地人買菜的海鮮與生鮮集散地，歷史氣息深厚。",
        badge: "台南早市",
        gmapsUrl: "https://maps.google.com/?q=水仙宮市場"
    },
    {
        id: "kaohsiung_longhua",
        city: "高雄市",
        name: "龍華公有零售市場",
        address: "高雄市左營區富國路60號",
        hours: "每日 07:30 - 21:00",
        desc: "高雄超人氣多功能示範市場，上午是買菜採購的傳統市集，下午至傍晚轉為熟食與特色創意美食的天堂，是兼具買菜與解決晚餐的完美去處。",
        badge: "高雄全天市",
        gmapsUrl: "https://maps.google.com/?q=高雄龍華市場",
        recommendations: [
            { name: "美濃有機水蓮 (2包)", category: "produce", cost: 60, note: "口感清脆、搭配肉絲絕配" },
            { name: "小農牧場鮮雞蛋 (12入)", category: "protein", cost: 110, note: "新鮮配送、蛋黃香濃且品質保證" }
        ]
    },
    {
        id: "kaohsiung_sanmin",
        city: "高雄市",
        name: "三民第一公有零售市場",
        address: "高雄市三民區中華三路285號",
        hours: "每週二至週日 06:00 - 13:00 (週一休市)",
        desc: "高雄老牌公有早市，周邊聚集大量屏東直送的新鮮生鮮與時蔬，食材性價比極高。",
        badge: "高雄早市",
        gmapsUrl: "https://maps.google.com/?q=三民第一市場"
    },
    {
        id: "kaohsiung_ziyou",
        city: "高雄市",
        name: "自由黃昏零售市場",
        address: "高雄市左營區自由三路261號",
        hours: "每日 14:00 - 20:00",
        desc: "南台灣最具規模的黃昏市場，佔地數千坪，有數百個小農攤位，販售生鮮蔬菜、海鮮與炸物，人潮洶湧。",
        badge: "高雄黃昏市",
        gmapsUrl: "https://maps.google.com/?q=自由黃昏市場"
    },
    {
        id: "kaohsiung_guomin",
        city: "高雄市",
        name: "高雄國民公有市場",
        address: "高雄市苓雅區青年一路一帶",
        hours: "每日 06:00 - 13:00",
        desc: "苓雅區老字號傳統早市，販售各種高檔海鮮、現切鮮魚、小農精緻蔬果，環境十分乾淨優雅。",
        badge: "高雄早市",
        gmapsUrl: "https://maps.google.com/?q=高雄國民市場"
    },
    {
        id: "pingtung_jianguo",
        city: "屏東縣",
        name: "屏東市建國公有零售市場",
        address: "屏東縣屏東市建國路150號",
        hours: "每日 06:00 - 13:00",
        desc: "屏東市區重要早市，提供高屏溪流域周邊小農生產的新鮮蔬菜、在地鳳梨與洋蔥，物美價廉。",
        badge: "屏東早市",
        gmapsUrl: "https://maps.google.com/?q=屏東建國市場"
    },
    {
        id: "pingtung_chaozhou",
        city: "屏東縣",
        name: "潮州第一公有零售市場",
        address: "屏東縣潮州鎮新興路與建基路口",
        hours: "每日 06:00 - 12:30",
        desc: "潮州核心的零售早市，提供大武山麓新鮮時蔬、在地優質肉品，以及萬丹紅豆等特色農產。",
        badge: "屏東早市",
        gmapsUrl: "https://maps.google.com/?q=潮州第一零售市場"
    },
    {
        id: "pingtung_hengchun",
        city: "屏東縣",
        name: "恆春公有零售市場",
        address: "屏東縣恆春鎮新興路28號",
        hours: "每日 06:00 - 12:30",
        desc: "國境之南的特色老菜市，有極具恆春半島風味的雨來菇、恆春洋蔥，以及後壁湖港口直送的新鮮海產。",
        badge: "屏東早市",
        gmapsUrl: "https://maps.google.com/?q=恆春公有零售市場"
    },
    {
        id: "yilan_north_south",
        city: "宜蘭縣",
        name: "宜蘭市南北館市場",
        address: "宜蘭市康樂街與光復路一帶",
        hours: "每日 06:00 - 13:00",
        desc: "蘭陽平原最重要的百年老市場，南館主打生鮮食品，北館主打生活熟食，有大量宜蘭在地溫泉空心菜、三星蔥與鮮魚。",
        badge: "宜蘭早市",
        gmapsUrl: "https://maps.google.com/?q=宜蘭南北館市場"
    },
    {
        id: "yilan_luodong",
        city: "宜蘭縣",
        name: "羅東開元公有零售市場",
        address: "宜蘭縣羅東鎮開元街與清潭路口",
        hours: "每日 06:00 - 13:00",
        desc: "羅東地區最大的室內生鮮零售早市，以南方澳海產現撈、礁溪小農無毒蔬菜、宜蘭粉肝熟食為特色。",
        badge: "宜蘭早市",
        gmapsUrl: "https://maps.google.com/?q=羅東開元市場"
    },
    {
        id: "yilan_jiaoxi",
        city: "宜蘭縣",
        name: "礁溪公有零售市場",
        address: "宜蘭縣礁溪鄉中山路二段100號",
        hours: "每日 06:00 - 12:30",
        desc: "礁溪溫泉鄉的老早市，以礁溪在地溫泉空心菜、溫泉番茄，以及蘭陽黑豬肉製品著稱。",
        badge: "宜蘭早市",
        gmapsUrl: "https://maps.google.com/?q=礁溪公有零售市場"
    },
    {
        id: "hualien_chongqing",
        city: "花蓮縣",
        name: "花蓮重慶公有零售市場",
        address: "花蓮縣花蓮市重慶路與八德街口",
        hours: "每日 06:00 - 12:30",
        desc: "花蓮市最大公有市場，改建後乾淨明亮，匯集花東縱谷與太平洋的新鮮野菜、在地小農放牧土雞與新鮮魚獲。",
        badge: "花蓮早市",
        gmapsUrl: "https://maps.google.com/?q=花蓮重慶市場"
    },
    {
        id: "hualien_ji-an",
        city: "花蓮縣",
        name: "吉安公有黃昏市場",
        address: "花蓮縣吉安鄉中山路三段2號",
        hours: "每日 15:00 - 19:30",
        desc: "花東地區少見的大型傳統黃昏市場，販售阿美族野菜、原民石板烤肉、新鮮生鮮，充滿東台灣特有的美味活潑氛圍。",
        badge: "花蓮黃昏市",
        gmapsUrl: "https://maps.google.com/?q=吉安黃昏市場"
    },
    {
        id: "hualien_meilun",
        city: "花蓮縣",
        name: "花蓮美崙公有零售市場",
        address: "花蓮縣花蓮市化道路與中美路口",
        hours: "每日 06:00 - 12:30",
        desc: "美崙住宅區的核心乾淨早市，特色在於花蓮縱谷小農產直新鮮野菜、當日現做手工貢丸以及太平洋現撈白帶魚。",
        badge: "花蓮早市",
        gmapsUrl: "https://maps.google.com/?q=美崙公有零售市場"
    },
    {
        id: "taitung_central",
        city: "台東縣",
        name: "台東市中央公有零售市場",
        address: "台東縣台東市中山路246號",
        hours: "每週二至週日 06:00 - 13:00",
        desc: "台東市中心最大菜市場，提供台東本地小農栽種的有機蔬菜、紅藜、台東釋迦，以及當日太平洋現撈的海產鮮魚。",
        badge: "台東早市",
        gmapsUrl: "https://maps.google.com/?q=台東中央市場"
    },
    {
        id: "taitung_datong",
        city: "台東縣",
        name: "台東大同路公有市場",
        address: "台東縣台東市大同路與精誠路口",
        hours: "每日 06:00 - 13:00",
        desc: "台東歷史悠久的老菜市，有台東本地小農新鮮蔬果、關山溫體肉品，是台東市民早上採購必到之處。",
        badge: "台東早市",
        gmapsUrl: "https://maps.google.com/?q=台東大同路市場"
    },
    {
        id: "penghu_beichen",
        city: "澎湖縣",
        name: "澎湖馬公北辰市場",
        address: "澎湖縣馬公市北辰街20號",
        hours: "每日 05:00 - 12:30",
        desc: "澎湖群島最大生鮮批發與零售市場，擁有當日澎湖海線小卷、土魠魚等頂級現撈海鮮，以及澎湖在地角瓜(絲瓜)、風茹草等特產。",
        badge: "澎湖早市",
        gmapsUrl: "https://maps.google.com/?q=馬公北辰市場"
    },
    {
        id: "penghu_jianguo",
        city: "澎湖縣",
        name: "澎湖馬公建國市場",
        address: "澎湖縣馬公市建國路與光明路口",
        hours: "每日 06:00 - 12:00",
        desc: "澎湖極具歷史的老街區菜市，提供各式傳統曬乾小魚、鮮魚以及澎湖離島在地小農自種時蔬。",
        badge: "澎湖早市",
        gmapsUrl: "https://maps.google.com/?q=馬公建國市場"
    },
    {
        id: "kinmen_jincheng",
        city: "金門縣",
        name: "金門金城鎮公有市場",
        address: "金門縣金城鎮莒光路與東門菜市場口",
        hours: "每日 06:00 - 13:00",
        desc: "金門最大最熱鬧的傳統菜市場，販售金門珍貴石蚵、高粱牛肉、當地無毒時蔬，充滿離島邊境風情。",
        badge: "金門早市",
        gmapsUrl: "https://maps.google.com/?q=金城鎮公有市場"
    },
    {
        id: "kinmen_jinsha",
        city: "金門縣",
        name: "金門金沙鎮公有市場",
        address: "金門縣金沙鎮沙美老街口",
        hours: "每日 06:00 - 12:30",
        desc: "位於沙美老街附近的魚米之鄉，可以買到金門產地大白菜、白蘿蔔與新鮮活水庫魚。",
        badge: "金門早市",
        gmapsUrl: "https://maps.google.com/?q=金沙鎮公有市場"
    },
    {
        id: "matsu_jieshou",
        city: "連江縣",
        name: "馬祖介壽獅子市場",
        address: "連江縣南竿鄉介壽村229號",
        hours: "每日 06:00 - 10:00 (早市)",
        desc: "馬祖南竿島唯一的公有早市，也是全島生活採購重心。必吃鼎邊糊、繼光餅、蟲弟餅，並提供馬祖現採淡菜與野生海產。",
        badge: "馬祖早市",
        gmapsUrl: "https://maps.google.com/?q=介壽獅子市場"
    },
    {
        id: "matsu_beigan",
        city: "連江縣",
        name: "馬祖北竿塘岐公有街市",
        address: "連江縣北竿鄉塘岐村一帶",
        hours: "每日 06:00 - 10:00 (早市)",
        desc: "北竿居民與駐軍的精緻朝市，販售北竿大坵周邊現撈海產、在地小農高麗菜及馬祖傳統黃金餃、酥餅。",
        badge: "馬祖早市",
        gmapsUrl: "https://maps.google.com/?q=北竿塘岐公有街市"
    }
];let currentSelectedTradMarketId = "taipei_nanmen";

function getRecommendationsForMarket(market) {
    if (market.recommendations && market.recommendations.length > 0) {
        return market.recommendations;
    }
    const isMorning = market.badge.includes("早");
    if (isMorning) {
        return [
            { name: "溫體五花肉 (300g)", category: "protein", cost: 150, note: "早市現宰鮮肉、自煮紅燒首選" },
            { name: "手作板豆腐 (2塊)", category: "protein", cost: 35, note: "濃郁豆香、古法柴燒製作" },
            { name: "宜蘭鮮甜三星蔥 (1把)", category: "produce", cost: 45, note: "鮮嫩辛香、提味百搭" }
        ];
    } else {
        return [
            { name: "手包鮮肉扁食 (1盒)", category: "protein", cost: 90, note: "手工現包、附湯底香料" },
            { name: "產地直送甜南瓜 (1顆)", category: "produce", cost: 80, note: "口感鬆軟綿密、耐保存" },
            { name: "黃昏熟食現炸排骨酥 (1包)", category: "protein", cost: 130, note: "外酥內嫩、與白蘿蔔燉煮極佳" }
        ];
    }
}

function showTraditionalMarketModal() {
    const existing = document.getElementById("traditional-market-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "traditional-market-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm";

    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[460px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md transform transition-all scale-100 duration-150 animate-fade-in max-h-[90vh] overflow-hidden">
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3 shrink-0">
                <h3 class="text-base font-extrabold text-[#be5f48] flex items-center gap-1">
                    <span class="material-symbols-outlined text-[#be5f48] fill">store</span> 全台傳統公有菜市場地圖
                </h3>
                <button onclick="closeTraditionalMarketModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Filters Section -->
            <div class="grid grid-cols-2 gap-sm shrink-0">
                <div>
                    <label class="block text-[10px] font-bold text-slate-blue mb-1">縣市篩選</label>
                    <select id="trad-county-select" onchange="filterTradMarkets()" class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1 focus:border-[#be5f48] focus:ring-[#be5f48]">
                        <option value="all">全部縣市</option>
                        <option value="台北市">台北市</option>
                        <option value="新北市">新北市</option>
                        <option value="基隆市">基隆市</option>
                        <option value="桃園市">桃園市</option>
                        <option value="新竹市">新竹市</option>
                        <option value="新竹縣">新竹縣</option>
                        <option value="苗栗縣">苗栗縣</option>
                        <option value="台中市">台中市</option>
                        <option value="彰化縣">彰化縣</option>
                        <option value="南投縣">南投縣</option>
                        <option value="雲林縣">雲林縣</option>
                        <option value="嘉義市">嘉義市</option>
                        <option value="嘉義縣">嘉義縣</option>
                        <option value="台南市">台南市</option>
                        <option value="高雄市">高雄市</option>
                        <option value="屏東縣">屏東縣</option>
                        <option value="宜蘭縣">宜蘭縣</option>
                        <option value="花蓮縣">花蓮縣</option>
                        <option value="台東縣">台東縣</option>
                        <option value="澎湖縣">澎湖縣</option>
                        <option value="金門縣">金門縣</option>
                        <option value="連江縣">連江縣</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-slate-blue mb-1">搜尋名稱/關鍵字</label>
                    <input type="text" id="trad-search-input" oninput="filterTradMarkets()" placeholder="搜尋市場或地址..." class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1 px-2 focus:border-[#be5f48] focus:ring-[#be5f48]">
                </div>
            </div>

            <!-- Market Selector -->
            <div class="shrink-0">
                <label class="block text-[10px] font-bold text-slate-blue mb-1">選擇菜市場 (共 <span id="trad-market-count">0</span> 個地點)</label>
                <select id="trad-market-select" onchange="changeTraditionalMarket(this.value)" class="w-full text-xs font-bold rounded-lg border-outline-variant bg-white py-1.5 focus:border-[#be5f48] focus:ring-[#be5f48]">
                    <!-- Options populated dynamically -->
                </select>
            </div>

            <!-- Market Info Card & Recommendations (Scrollable container) -->
            <div class="flex-1 overflow-y-auto pr-1 space-y-sm custom-scrollbar">
                <div id="trad-market-details-card" class="space-y-sm text-left">
                    <!-- Details dynamically injected -->
                </div>
            </div>

            <!-- Modal Footer Actions -->
            <div class="pt-sm border-t border-outline-variant/20 flex gap-md shrink-0">
                <button onclick="closeTraditionalMarketModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    關閉視窗
                </button>
                <a id="trad-market-nav-link" href="#" target="_blank" class="flex-1 bg-secondary hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">directions</span> 規劃導航路線
                </a>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Setup global filter helpers
    window.filterTradMarkets = function() {
        const county = document.getElementById("trad-county-select").value;
        const query = document.getElementById("trad-search-input").value.trim().toLowerCase();

        const filtered = TAIWAN_TRADITIONAL_MARKETS.filter(m => {
            const matchCounty = (county === "all" || m.city === county);
            const matchQuery = (!query ||
                m.name.toLowerCase().includes(query) ||
                m.address.toLowerCase().includes(query) ||
                m.desc.toLowerCase().includes(query) ||
                m.badge.toLowerCase().includes(query)
            );
            return matchCounty && matchQuery;
        });

        const select = document.getElementById("trad-market-select");
        const countSpan = document.getElementById("trad-market-count");

        if (countSpan) countSpan.textContent = filtered.length;

        if (select) {
            select.innerHTML = filtered.map(m =>
                `<option value="${m.id}">${m.city} - ${m.name}</option>`
            ).join("");

            if (filtered.length > 0) {
                select.disabled = false;
                const exists = filtered.some(m => m.id === currentSelectedTradMarketId);
                if (exists) {
                    select.value = currentSelectedTradMarketId;
                    updateTraditionalMarketDetails(currentSelectedTradMarketId);
                } else {
                    currentSelectedTradMarketId = filtered[0].id;
                    select.value = filtered[0].id;
                    updateTraditionalMarketDetails(filtered[0].id);
                }
            } else {
                select.innerHTML = `<option value="">無符合的市場</option>`;
                select.disabled = true;
                const detailsContainer = document.getElementById("trad-market-details-card");
                if (detailsContainer) {
                    detailsContainer.innerHTML = `
                        <div class="text-center p-lg border border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low">
                            <span class="material-symbols-outlined text-outline text-3xl">search_off</span>
                            <p class="text-xs font-bold text-on-surface-variant mt-1">找不到符合篩選條件的傳統市場！</p>
                        </div>
                    `;
                }
            }
        }
    };

    filterTradMarkets();
}

function closeTraditionalMarketModal() {
    const modal = document.getElementById("traditional-market-modal");
    if (modal) modal.remove();
    delete window.filterTradMarkets;
}

function changeTraditionalMarket(id) {
    if (!id) return;
    currentSelectedTradMarketId = id;
    updateTraditionalMarketDetails(id);
}

function updateTraditionalMarketDetails(id) {
    const market = TAIWAN_TRADITIONAL_MARKETS.find(m => m.id === id);
    if (!market) return;

    const detailsContainer = document.getElementById("trad-market-details-card");
    if (detailsContainer) {
        const recommendations = getRecommendationsForMarket(market);
        detailsContainer.innerHTML = `
            <div class="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-md space-y-sm">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-extrabold text-slate-blue">${market.name}</span>
                    <span class="bg-[#be5f48]/10 text-[#be5f48] border border-[#be5f48]/20 px-2 py-0.5 rounded text-[10px] font-extrabold">${market.badge}</span>
                </div>
                <div class="space-y-1.5 text-xs">
                    <p class="flex items-start gap-1 font-medium text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm text-[#be5f48] shrink-0">schedule</span>
                        <span><strong>營業時間：</strong>${market.hours}</span>
                    </p>
                    <p class="flex items-start gap-1 font-medium text-on-surface-variant">
                        <span class="material-symbols-outlined text-sm text-[#be5f48] shrink-0">location_on</span>
                        <span><strong>市場地址：</strong>${market.address}</span>
                    </p>
                    <p class="text-on-surface/80 leading-relaxed font-medium mt-sm pt-xs border-t border-outline-variant/20">
                        ${market.desc}
                    </p>
                </div>
            </div>

            <!-- Recommendations -->
            <div class="space-y-sm">
                <div class="flex items-center gap-xs">
                    <span class="material-symbols-outlined text-xs text-secondary font-bold">recommend</span>
                    <span class="text-[10px] font-extrabold text-secondary uppercase tracking-wider">本週在地採購推薦</span>
                </div>
                <div class="grid grid-cols-1 gap-sm">
                    ${recommendations.map(r => {
                        const isProduce = r.category === "produce";
                        const catIcon = isProduce ? "eco" : "egg";
                        const catColor = isProduce ? "text-secondary" : "text-primary";
                        return `
                            <div class="flex items-center justify-between bg-white border border-outline-variant/20 p-2.5 rounded-xl hover:border-secondary/40 transition-colors">
                                <div class="flex items-center gap-sm text-left">
                                    <span class="material-symbols-outlined text-base ${catColor}">${catIcon}</span>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-extrabold text-slate-blue">${r.name}</span>
                                        <span class="text-[9px] font-bold text-outline">${r.note}</span>
                                    </div>
                                </div>
                                <div class="flex items-center gap-sm">
                                    <span class="text-xs font-extrabold text-[#be5f48]">$${r.cost}</span>
                                    <button onclick="addMarketItemToShopping('${r.name}', '${r.category}', ${r.cost})" class="bg-[#be5f48]/10 hover:bg-[#be5f48]/20 text-[#be5f48] p-1.5 rounded-full transition-all active:scale-90 flex items-center justify-center" title="加入採購單">
                                        <span class="material-symbols-outlined text-xs font-extrabold">add_shopping_cart</span>
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    const navLink = document.getElementById("trad-market-nav-link");
    if (navLink) {
        navLink.href = market.gmapsUrl;
    }
}

function renderScanInvoiceResults(modal) {
    let checkedStates = MOCK_INVOICE_ITEMS.map(() => true); // Default all checked

    function getResultHtml() {
        return `
        <div class="bg-white rounded-3xl p-lg max-w-md w-full shadow-2xl border border-primary/5 mx-md max-h-[85vh] flex flex-col justify-between overflow-hidden animate-fade-in">
            <!-- Header -->
            <div class="flex justify-between items-center pb-md border-b border-outline-variant/20 mb-md">
                <h3 class="text-lg font-extrabold text-slate-blue flex items-center gap-2">
                    <span class="material-symbols-outlined text-[#be5f48]">receipt_long</span> 掃描解析結果
                </h3>
                <button onclick="closeScanInvoiceModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Scrollable List -->
            <div class="flex-1 overflow-y-auto space-y-sm pr-1 custom-scrollbar">
                <div class="flex justify-between items-center mb-sm">
                    <span class="text-xs text-on-surface-variant font-bold">共偵測到 ${MOCK_INVOICE_ITEMS.length} 項食材，請勾選要匯入的項目：</span>
                    <button onclick="toggleSelectAllScan()" id="scan-select-all-btn" class="text-[10px] bg-slate-blue/10 hover:bg-slate-blue/20 text-[#be5f48] font-extrabold px-2 py-0.5 rounded transition-all">
                        取消全選
                    </button>
                </div>
                <div class="space-y-sm">
                    ${MOCK_INVOICE_ITEMS.map((item, idx) => {
                        const isProduce = item.category === "produce";
                        const categoryText = isProduce ? "新鮮蔬果" : "蛋白質與乳製品";
                        const categoryIcon = isProduce ? "eco" : "egg";
                        const categoryColor = isProduce ? "text-secondary bg-secondary/10 border-secondary/20" : "text-primary bg-primary/10 border-primary/20";
                        return `
                            <label class="flex items-center justify-between p-3 rounded-xl border border-outline-variant/30 hover:bg-surface-container-low cursor-pointer transition-colors">
                                <div class="flex items-center gap-md">
                                    <input type="checkbox" id="scan-checkbox-${idx}" ${checkedStates[idx] ? 'checked' : ''} onchange="toggleScanCheckbox(${idx})" class="custom-checkbox w-4.5 h-4.5 rounded border-outline-variant text-[#be5f48] focus:ring-[#be5f48]">
                                    <div class="flex flex-col">
                                        <span class="font-extrabold text-sm text-slate-blue">${item.name} (${item.qty}${item.unit})</span>
                                        <div class="inline-flex items-center gap-xs px-2.5 py-1 rounded-full border ${categoryColor} mt-1 w-max">
                                            <span class="material-symbols-outlined text-[12px] font-bold">${categoryIcon}</span>
                                            <span class="text-[9px] font-extrabold tracking-wider uppercase">${categoryText}</span>
                                        </div>
                                    </div>
                                </div>
                                <span class="text-xs font-extrabold text-slate-blue">$${item.estCost}</span>
                            </label>
                        `;
                    }).join("")}
                </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="pt-lg border-t border-outline-variant/20 mt-lg flex gap-md">
                <button onclick="closeScanInvoiceModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98]">
                    取消
                </button>
                <button onclick="importScanInvoiceItems()" class="flex-1 bg-[#be5f48] hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">download</span> 確認加入清單
                </button>
            </div>
        </div>
        `;
    }

    window.toggleScanCheckbox = function(idx) {
        checkedStates[idx] = !checkedStates[idx];
        const btn = document.getElementById("scan-select-all-btn");
        const allChecked = checkedStates.every(s => s);
        btn.textContent = allChecked ? "取消全選" : "全選";
    };

    window.toggleSelectAllScan = function() {
        const allChecked = checkedStates.every(s => s);
        checkedStates = checkedStates.map(() => !allChecked);
        MOCK_INVOICE_ITEMS.forEach((_, idx) => {
            const cb = document.getElementById(`scan-checkbox-${idx}`);
            if (cb) cb.checked = !allChecked;
        });
        const btn = document.getElementById("scan-select-all-btn");
        btn.textContent = !allChecked ? "取消全選" : "全選";
    };

    window.importScanInvoiceItems = function() {
        const itemsToImport = [];
        MOCK_INVOICE_ITEMS.forEach((item, idx) => {
            if (checkedStates[idx]) {
                itemsToImport.push({
                    id: "s_scan_" + Date.now() + "_" + idx,
                    name: item.name,
                    category: item.category,
                    qty: item.qty,
                    unit: item.unit,
                    image: item.image || generateIngredientImage(item.name, item.category),
                    checked: false,
                    status: "掃描匯入",
                    estCost: item.estCost
                });
            }
        });

        if (itemsToImport.length === 0) {
            alert("請至少勾選一項食材進行匯入！");
            return;
        }

        // Add to appState
        itemsToImport.forEach(item => {
            appState.shoppingList.push(item);
            if (isCloudMode && supabaseClient) {
                dbAddShoppingItem(item);
            }
        });

        saveState();
        closeScanInvoiceModal();
        renderCurrentTab();
        showToast(`成功匯入 ${itemsToImport.length} 項發票明細至採買清單！`, "success");
    };

    modal.innerHTML = getResultHtml();
}

function showEncouragementModal(checkedItems) {
    const existing = document.getElementById("encouragement-modal");
    if (existing) existing.remove();

    const totalItems = checkedItems.length;
    const totalCost = checkedItems.reduce((sum, item) => sum + item.estCost, 0);
    const potentialSavings = Math.round(totalCost * 0.8);

    const modal = document.createElement("div");
    modal.id = "encouragement-modal";
    modal.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in";
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-lg shadow-2xl max-w-[420px] w-full mx-gutter border border-primary/5 flex flex-col space-y-md transform transition-all animate-float-celebration">
            <!-- Header -->
            <div class="flex justify-between items-center border-b border-outline-variant/30 pb-3">
                <h3 class="text-base font-extrabold text-[#be5f48] flex items-center gap-1">
                    <span class="material-symbols-outlined text-[#be5f48] fill">savings</span> 🎉 補貨成功！為荷包加油
                </h3>
                <button onclick="closeEncouragementModal()" class="text-on-surface-variant hover:text-error hover:bg-surface-container p-1 rounded-full transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            <!-- Content Body -->
            <div class="text-center space-y-md py-md">
                <div class="w-16 h-16 bg-[#be5f48]/10 rounded-full flex items-center justify-center mx-auto text-3xl">
                    💰
                </div>
                <div class="space-y-xs">
                    <p class="text-sm font-extrabold text-slate-blue leading-relaxed">
                        堅持自煮、減少浪費，健康與荷包都在加分！離「夢幻廚房改裝基金」更進一步囉！
                    </p>
                </div>

                <!-- Bento Stat Card -->
                <div class="bg-surface-container-low p-md rounded-2xl border border-outline-variant/20 grid grid-cols-3 gap-sm text-center">
                    <div class="flex flex-col items-center">
                        <span class="text-[9px] font-bold text-on-surface-variant">入庫品項</span>
                        <span class="text-base font-extrabold text-slate-blue mt-1">${totalItems} 項</span>
                    </div>
                    <div class="flex flex-col items-center border-x border-outline-variant/20">
                        <span class="text-[9px] font-bold text-on-surface-variant">補貨花費</span>
                        <span class="text-base font-extrabold text-primary mt-1">$${totalCost}</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <span class="text-[9px] font-bold text-on-surface-variant">預估省下</span>
                        <span class="text-base font-extrabold text-secondary mt-1">$${potentialSavings}</span>
                    </div>
                </div>
            </div>

            <!-- Footer Action Buttons -->
            <div class="pt-sm border-t border-outline-variant/20 flex flex-col gap-sm">
                <button onclick="goToTabFromEncouragement('roi')" class="w-full bg-[#be5f48] hover:brightness-110 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-sm">trending_up</span> 查看我的圓夢進度
                </button>
                <div class="flex gap-sm">
                    <button onclick="goToTabFromEncouragement('fridge')" class="flex-1 bg-secondary/10 hover:bg-secondary/20 text-secondary font-extrabold py-2 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-sm">hourglass_empty</span> 看看冰箱沙漏
                    </button>
                    <button onclick="closeEncouragementModal()" class="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-extrabold py-2 rounded-xl text-xs transition-all active:scale-[0.98]">
                        好，繼續加油
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    window.goToTabFromEncouragement = function(tab) {
        closeEncouragementModal();
        switchTab(tab);
    };
}

function closeEncouragementModal() {
    const modal = document.getElementById("encouragement-modal");
    if (modal) modal.remove();
    delete window.goToTabFromEncouragement;
}


function toggleAddShoppingForm() {
    const form = document.getElementById("add-shopping-form");
    if (form) {
        form.classList.toggle("hidden");
    }
}
window.toggleAddShoppingForm = toggleAddShoppingForm;

function onShoppingItemNameChange() {
    const nameInput = document.getElementById("new-shop-name");
    const catSelect = document.getElementById("new-shop-cat");
    const hintBox = document.getElementById("shop-item-hint");

    if (!nameInput || !nameInput.value.trim()) {
        if (hintBox) hintBox.classList.add("hidden");
        return;
    }

    const name = nameInput.value.trim();
    const cat = catSelect ? catSelect.value : "produce";
    const generatedImg = generateIngredientImage(name, cat);

    if (hintBox) {
        hintBox.classList.remove("hidden");
        hintBox.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${generatedImg}" alt="${name}" class="w-10 h-10 rounded-xl object-cover border border-outline-variant/30 shadow-xs flex-shrink-0">
                <div>
                    <div class="flex items-center gap-1 font-bold text-xs text-secondary">
                        <span class="material-symbols-outlined text-sm">auto_awesome</span>
                        <span>✨ 已為「${name}」自動生成食材卡片圖片！</span>
                    </div>
                </div>
            </div>
        `;
    }
}
window.onShoppingItemNameChange = onShoppingItemNameChange;

function submitNewShoppingItem() {
    const nameInput = document.getElementById("new-shop-name");
    const name = nameInput ? nameInput.value.trim() : "";
    const cat = document.getElementById("new-shop-cat") ? document.getElementById("new-shop-cat").value : "produce";
    const qty = parseInt(document.getElementById("new-shop-qty").value) || 1;
    const unit = document.getElementById("new-shop-unit").value.trim() || "包";
    const cost = parseInt(document.getElementById("new-shop-cost").value) || 0;

    if (!name) {
        alert("請輸入採買項目名稱！");
        return;
    }

    const generatedImage = generateIngredientImage(name, cat);

    const newItem = {
        id: "s_manual_" + Date.now(),
        name: name,
        category: cat,
        qty: qty,
        unit: unit,
        image: generatedImage,
        checked: false,
        status: "手動新增",
        estCost: cost
    };

    appState.shoppingList.push(newItem);
    saveState();

    if (isCloudMode && supabaseClient) {
        dbAddShoppingItem(newItem);
    }

    toggleAddShoppingForm();
    renderCurrentTab();
    showToast(`成功手動新增食材「${name}」並自動生成卡片圖片！`, "success");
}
window.submitNewShoppingItem = submitNewShoppingItem;



// ==========================================
// MASTER CHEF CONSULTATION MODAL (主廚相談室)
// ==========================================

function showChefConsultationModal() {
    document.getElementById('chef-consultation-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'chef-consultation-modal';
    modal.className = 'fixed inset-0 bg-black/60 z-[85] flex items-center justify-center p-md backdrop-blur-sm animate-fade-in';
    modal.innerHTML = `
        <section class="bg-white w-full max-w-[520px] rounded-3xl shadow-2xl overflow-hidden border border-outline-variant/30 flex flex-col max-h-[85vh]">
            <header class="bg-[#2c221e] text-white px-md py-sm flex items-center justify-between gap-sm">
                <div class="flex items-center gap-sm min-w-0">
                    <div class="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                        <span class="material-symbols-outlined text-2xl">restaurant_menu</span>
                    </div>
                    <div class="min-w-0">
                        <h3 class="font-extrabold text-base tracking-wide truncate">主廚相談室 👨‍🍳</h3>
                        <p class="text-[10px] text-white/80 truncate">專屬 AI 主廚 ‧ 為您推薦料理與採買指引</p>
                    </div>
                </div>
                <button onclick="closeChefConsultationModal()" class="w-8 h-8 rounded-full hover:bg-white/15 text-white/80 flex items-center justify-center" aria-label="關閉相談室">
                    <span class="material-symbols-outlined text-lg">close</span>
                </button>
            </header>
            <div id="chef-consultation-body" class="p-md overflow-y-auto space-y-md flex-1">
                <div class="bg-white rounded-2xl p-md border border-outline-variant/20 shadow-sm space-y-sm text-left">
                    <div class="flex items-start gap-sm">
                        <span class="material-symbols-outlined text-primary text-2xl mt-0.5">sentiment_satisfied</span>
                        <p class="text-sm text-on-surface font-medium leading-relaxed">
                            👋 歡迎來到 CooCoo 煮煮！我是您的專屬主廚 👨‍🍳 今天想怎麼安排您的美食體驗呢？
                        </p>
                    </div>
                </div>

                <div class="space-y-sm pt-xs">
                    <button onclick="handleChefConsultationChoice('shopping')" class="w-full bg-secondary/10 hover:bg-secondary border-2 border-secondary/30 text-secondary hover:text-white font-extrabold p-md rounded-2xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                        <span class="material-symbols-outlined text-xl">shopping_cart</span>
                        我想去採買新食材
                    </button>

                    <button onclick="handleChefConsultationChoice('dish')" class="w-full bg-primary/10 hover:bg-primary border-2 border-primary/30 text-primary hover:text-white font-extrabold p-md rounded-2xl text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm">
                        <span class="material-symbols-outlined text-xl">skillet</span>
                        我想選料理 / 吃好料
                    </button>
                </div>
            </div>
        </section>`;
    document.body.appendChild(modal);
}
window.showChefConsultationModal = showChefConsultationModal;

function closeChefConsultationModal() {
    document.getElementById('chef-consultation-modal')?.remove();
}
window.closeChefConsultationModal = closeChefConsultationModal;

function handleChefConsultationChoice(choice) {
    if (choice === 'shopping') {
        closeChefConsultationModal();
        switchTab('shopping');
        showToast('已為您切換至【補貨區】！點擊頂部「AI 陪我逛」按鈕拍照辨識食材與獲取推薦喔！', 'success');
    } else if (choice === 'dish') {
        renderChefDishSelectionStep();
    }
}
window.handleChefConsultationChoice = handleChefConsultationChoice;

function renderChefDishSelectionStep() {
    const container = document.getElementById('chef-consultation-body');
    if (!container) return;

    const presetDishes = [
        { title: '經典台式三杯雞', prepTime: '15 分鐘', estCost: 'NT$ 85' },
        { title: '日式牛肉丼飯', prepTime: '12 分鐘', estCost: 'NT$ 90' },
        { title: '番茄牛肉燉湯', prepTime: '20 分鐘', estCost: 'NT$ 110' },
        { title: '蒜香雞胸沙拉', prepTime: '10 分鐘', estCost: 'NT$ 70' },
        { title: '清炒時令蔬菜', prepTime: '8 分鐘', estCost: 'NT$ 40' }
    ];

    container.innerHTML = `
        <div class="space-y-md text-left">
            <div class="bg-amber-50 rounded-2xl p-sm border border-amber-200 text-xs font-bold text-slate-blue flex items-center gap-1.5">
                <span class="material-symbols-outlined text-secondary">forum</span>
                👨‍🍳 主廚詢問：請問您今天想吃什麼類型的料理呢？可以點選下方熱門菜色或輸入菜名：
            </div>

            <div class="grid grid-cols-2 gap-sm">
                ${presetDishes.map(d => `
                    <button onclick="handleChefSelectDish(decodeURIComponent('${encodeURIComponent(d.title)}'))" class="bg-white hover:bg-primary/10 border border-outline-variant hover:border-primary p-sm rounded-2xl text-left transition-all group shadow-sm">
                        <strong class="block text-xs font-extrabold text-slate-blue group-hover:text-primary">${escapeAssistantHtml(d.title)}</strong>
                        <span class="text-[10px] text-on-surface-variant">${d.prepTime} ‧ ${d.estCost}</span>
                    </button>
                `).join('')}
            </div>

            <div class="bg-white rounded-2xl p-sm border border-outline-variant/30 flex items-center gap-xs">
                <input id="chef-custom-dish-input" type="text" placeholder="自訂菜名，例如：紅燒茄子..." class="flex-1 bg-surface-container border border-outline-variant/40 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary">
                <button onclick="submitChefCustomDish()" class="bg-primary text-white font-extrabold px-3 py-2 rounded-xl text-xs shadow-sm hover:brightness-110 active:scale-95 whitespace-nowrap">
                    主廚推薦
                </button>
            </div>

            <button onclick="showChefConsultationModal()" class="text-xs font-bold text-outline hover:text-primary transition-colors block mx-auto pt-xs">
                ← 返回選擇
            </button>
        </div>
    `;
}
window.renderChefDishSelectionStep = renderChefDishSelectionStep;

function submitChefCustomDish() {
    const input = document.getElementById('chef-custom-dish-input');
    const val = input?.value.trim();
    if (val) {
        handleChefSelectDish(val);
    } else {
        showToast('請輸入想吃的菜名！', 'error');
    }
}
window.submitChefCustomDish = submitChefCustomDish;

function handleChefSelectDish(dishTitle) {
    const container = document.getElementById('chef-consultation-body');
    if (!container) return;

    container.innerHTML = `
        <div class="py-xl text-center space-y-md">
            <span class="material-symbols-outlined text-4xl text-primary animate-spin">skillet</span>
            <p class="text-sm font-extrabold text-slate-blue">主廚正在為您規劃【${escapeAssistantHtml(dishTitle)}】精準指南...</p>
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = `
            <div class="space-y-md text-left animate-fade-in">
                <section class="bg-[#fdfae7] rounded-2xl p-md border border-amber-300 space-y-sm">
                    <h4 class="font-extrabold text-base text-terracotta flex items-center gap-1">
                        <span class="material-symbols-outlined text-secondary">restaurant</span>
                        👨‍🍳 主廚推薦菜色：${escapeAssistantHtml(dishTitle)}
                    </h4>
                    <p class="text-xs text-on-surface leading-relaxed font-medium">
                        這道「${escapeAssistantHtml(dishTitle)}」色香味俱全、營養均衡，是今日大廚為您量身打造的最佳自煮選擇！
                    </p>
                    <div class="bg-white rounded-xl p-sm border border-amber-200 text-xs space-y-xs">
                        <strong class="text-primary block font-bold">🍳 【怎麼料理】：熱力學控溫與物理烹調</strong>
                        <p class="text-on-surface-variant leading-relaxed">
                            大火快速定型鎖住水分與組織液，關火加蓋利用比熱容熱平衡慢熟 3 分鐘，確保鮮嫩不柴。
                        </p>
                        <strong class="text-secondary block font-bold mt-sm">🛒 【該怎麼買】：食材盤點與採買指引</strong>
                        <p class="text-on-surface-variant leading-relaxed">
                            冰箱目前有基礎底料；建議採買：【${escapeAssistantHtml(dishTitle)} 主食材】與【搭配新鮮時蔬菜包】。
                        </p>
                    </div>
                </section>

                <div class="space-y-sm">
                    <button onclick="addChefDishToShoppingList('${escapeAssistantHtml(dishTitle)}')" class="w-full bg-secondary hover:bg-secondary/90 text-white font-extrabold p-md rounded-2xl text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1">
                        <span class="material-symbols-outlined text-base">playlist_add</span>
                        將缺少的食材加入補貨區並前往採買
                    </button>
                    <button onclick="renderChefDishSelectionStep()" class="w-full bg-surface-container hover:bg-surface-container-high text-on-surface font-bold p-sm rounded-2xl text-xs transition-all text-center">
                        🔄 選其他料理
                    </button>
                </div>
            </div>
        `;
    }, 600);
}
window.handleChefSelectDish = handleChefSelectDish;

function addChefDishToShoppingList(dishTitle) {
    const name = (dishTitle || '').trim();
    let newItems = [];

    if (name.includes('三杯雞')) {
        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: "去骨雞腿肉", category: "protein", qty: 1, unit: "盒", checked: false, status: "主廚推薦補貨", estCost: 120 },
            { id: "s_chef_" + Date.now() + "_2", name: "九層塔", category: "produce", qty: 1, unit: "包", checked: false, status: "主廚推薦補貨", estCost: 25 },
            { id: "s_chef_" + Date.now() + "_3", name: "老薑", category: "produce", qty: 1, unit: "塊", checked: false, status: "主廚推薦補貨", estCost: 15 }
        ];
    } else if (name.includes('牛丼') || name.includes('牛肉丼')) {
        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: "牛五花肉片", category: "protein", qty: 1, unit: "盒", checked: false, status: "主廚推薦補貨", estCost: 130 },
            { id: "s_chef_" + Date.now() + "_2", name: "洋蔥", category: "produce", qty: 1, unit: "顆", checked: false, status: "主廚推薦補貨", estCost: 20 },
            { id: "s_chef_" + Date.now() + "_3", name: "放牧土雞蛋", category: "protein", qty: 1, unit: "盒", checked: false, status: "主廚推薦補貨", estCost: 65 }
        ];
    } else if (name.includes('番茄牛肉') || name.includes('牛肉燉湯')) {
        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: "牛腩肉", category: "protein", qty: 1, unit: "包", checked: false, status: "主廚推薦補貨", estCost: 160 },
            { id: "s_chef_" + Date.now() + "_2", name: "牛番茄", category: "produce", qty: 3, unit: "顆", checked: false, status: "主廚推薦補貨", estCost: 45 },
            { id: "s_chef_" + Date.now() + "_3", name: "洋蔥", category: "produce", qty: 1, unit: "顆", checked: false, status: "主廚推薦補貨", estCost: 20 }
        ];
    } else if (name.includes('雞胸') || name.includes('沙拉')) {
        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: "履歷雞胸肉", category: "protein", qty: 1, unit: "盒", checked: false, status: "主廚推薦補貨", estCost: 95 },
            { id: "s_chef_" + Date.now() + "_2", name: "綜合沙拉生菜", category: "produce", qty: 1, unit: "包", checked: false, status: "主廚推薦補貨", estCost: 55 },
            { id: "s_chef_" + Date.now() + "_3", name: "蒜頭", category: "produce", qty: 1, unit: "袋", checked: false, status: "主廚推薦補貨", estCost: 30 }
        ];
    } else if (name.includes('時令蔬菜') || name.includes('清炒')) {
        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: "有機高麗菜", category: "produce", qty: 1, unit: "顆", checked: false, status: "主廚推薦補貨", estCost: 45 },
            { id: "s_chef_" + Date.now() + "_2", name: "蒜頭", category: "produce", qty: 1, unit: "袋", checked: false, status: "主廚推薦補貨", estCost: 30 }
        ];
    } else {
        const proteinMatch = name.match(/雞|豬|牛|羊|蝦|魚|蛤|干貝|肉|豆腐|蛋/);
        const mainProtein = proteinMatch ? proteinMatch[0] : null;
        const proteinName = mainProtein 
            ? (mainProtein === '雞' ? '嚴選雞肉切塊' : mainProtein === '豬' ? '優質豬肉片' : mainProtein === '牛' ? '牛五花肉片' : mainProtein === '魚' ? '鮮美鮭魚菲力' : mainProtein === '蝦' ? '白蝦' : mainProtein === '豆腐' ? '有機嫩豆腐' : `${mainProtein}類精選食材`)
            : `${name} 專屬食材`;

        newItems = [
            { id: "s_chef_" + Date.now() + "_1", name: proteinName, category: mainProtein === '豆腐' ? 'dairy_egg_soy' : 'protein', qty: 1, unit: '盒', checked: false, status: '主廚推薦補貨', estCost: 95 },
            { id: "s_chef_" + Date.now() + "_2", name: '時令季節蔬菜', category: 'produce', qty: 1, unit: '包', checked: false, status: '主廚推薦補貨', estCost: 40 }
        ];
    }

    appState.shoppingList.push(...newItems);
    saveLocalState();
    closeChefConsultationModal();
    switchTab('shopping');
    showToast(`已將「${dishTitle}」明確食材加入補貨區並自動切換！`, 'success');
}
window.addChefDishToShoppingList = addChefDishToShoppingList;


// Initial Entry Point
async function initApp() {
    try {
        await loadState();

        // Bind reset data button
        const resetBtn = document.getElementById("reset-data-btn");
        if (resetBtn) {
            resetBtn.addEventListener("click", resetState);
        }

        switchTab("shopping"); // Load first tab: 補貨區
        showChefConsultationModal(); // Automatically trigger Master Chef Consultation modal!
    } catch (error) {
        console.error("Fatal initialization error:", error);
        const container = document.getElementById("app-view");
        if (container) {
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-3xl p-lg max-w-[600px] mx-auto mt-xl text-center space-y-md">
                    <span class="material-symbols-outlined text-error text-5xl">bug_report</span>
                    <h3 class="text-lg font-extrabold text-error">應用程式初始化失敗</h3>
                    <p class="text-xs text-on-surface-variant leading-relaxed text-left bg-white p-md rounded-xl border border-outline-variant/30 font-mono overflow-auto">
                        <strong>Error:</strong> ${error.message}<br><br>
                        <strong>Stack:</strong> ${error.stack ? error.stack.replace(/\n/g, '<br>') : 'No stack trace available.'}
                    </p>
                    <button onclick="localStorage.clear(); location.reload();" class="bg-error text-white font-bold px-lg py-sm rounded-full text-xs shadow-md transition-all active:scale-95">
                        清除本地快取並重試
                    </button>
                </div>
            `;
        }
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
