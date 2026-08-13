export function cleanJsonResponse(text) {
    if (!text) return null;
    let cleaned = text.trim();
    if (cleaned.startsWith("\`\`\`json")) {
        cleaned = cleaned.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
    } else if (cleaned.startsWith("\`\`\`")) {
        cleaned = cleaned.replace(/^\`\`\`\s*/, "").replace(/\s*\`\`\`$/, "");
    }
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.warn("Failed to parse Gemini response as JSON:", e, cleaned);
        return null;
    }
}
