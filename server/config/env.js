import dotenv from 'dotenv';
dotenv.config();

const MOCK_KEY = 'MOCK_GEMINI_KEY';

export const config = {
    port:          process.env.PORT        || 5001,
    env:           process.env.NODE_ENV    || 'development',
    geminiApiKey:  process.env.GEMINI_API_KEY,
    supabaseUrl:   process.env.SUPABASE_URL,
    supabaseKey:   process.env.SUPABASE_ANON_KEY,

    // Helper flags
    get isMockAI() {
        return !this.geminiApiKey || this.geminiApiKey === MOCK_KEY;
    },
    get isMockDB() {
        return !this.supabaseUrl || !this.supabaseKey;
    },
    get isProduction() {
        return this.env === 'production';
    },
};

// ── Startup validation ─────────────────────────────────────────────────────
if (config.isMockAI) {
    console.warn('[Config] ⚠️  GEMINI_API_KEY 未設定或為 Mock Key — AI 功能將使用 Mock 模式');
}

if (config.isMockDB) {
    console.warn('[Config] ⚠️  SUPABASE_URL / SUPABASE_ANON_KEY 未設定 — 資料庫將使用 In-memory Mock');
}

if (config.isProduction && config.isMockAI) {
    console.error('[Config] ❌  生產環境不應使用 Mock AI Key，請設定真實的 GEMINI_API_KEY！');
    process.exit(1);
}
