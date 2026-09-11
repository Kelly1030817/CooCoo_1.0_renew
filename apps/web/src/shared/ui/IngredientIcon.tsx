
import { detectIngredientCategory } from "./ingredient-category";

interface IngredientIconProps {
  name: string;
  className?: string;
  size?: number;
}

/**
 * Scheme 1: Semantic Category Default Vector SVG Icon
 * - Common staples have dedicated vector representations.
 * - Any new/unregistered ingredient is deterministically assigned to its category default SVG.
 * - 100% Crisp vector SVG, 0 emojis, 0ms latency, zero AI API cost.
 */
export function IngredientIcon({ name, className = "w-5 h-5", size }: IngredientIconProps) {
  const n = name.trim();
  const style = size ? { width: size, height: size } : undefined;

  // Specific high-frequency common items
  if (/番茄|西紅柿/.test(n)) {
    // Tomato: red circle with green calyx
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
        <circle cx="12" cy="14" r="7" fill="#fef2f2" stroke="#e07a5f" />
        <path d="M12 7V3.5" stroke="#386753" strokeWidth="2" />
        <path d="M9.5 5c1 .8 2.5.8 2.5.8s1.5 0 2.5-.8" stroke="#386753" strokeWidth="2" />
      </svg>
    );
  }

  if (/蛋/.test(n) && !/皮蛋|鹹蛋/.test(n)) {
    // Egg: warm yellow oval
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
        <path d="M12 3.5C8.5 3.5 6 8.5 6 14a6 6 0 0 0 12 0c0-5.5-2.5-10.5-6-10.5z" fill="#fef9c3" stroke="#d97706" />
      </svg>
    );
  }

  if (/豆腐/.test(n)) {
    // Tofu: clean white block
    return (
      <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
        <rect x="4" y="6" width="16" height="14" rx="2" fill="#ffffff" stroke="#386753" />
        <line x1="12" y1="6" x2="12" y2="20" stroke="#ede7d5" strokeWidth="1.5" />
        <line x1="4" y1="13" x2="20" y2="13" stroke="#ede7d5" strokeWidth="1.5" />
      </svg>
    );
  }

  // Category-level fallback SVGs (Scheme 1)
  const category = detectIngredientCategory(n);

  switch (category) {
    case "melon":
      // Melon/Gourd: light green oval
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <ellipse cx="12" cy="13" rx="8" ry="6" fill="#dcfce7" stroke="#15803d" />
          <path d="M12 7V4" stroke="#15803d" strokeWidth="2" />
          <path d="M8 13c0-2.5 4-3 4-3s4 .5 4 3" stroke="#15803d" />
        </svg>
      );

    case "mushroom":
      // Mushroom: umbrella cap with stem
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M12 3a9 9 0 0 0-9 9c0 1 1 2 2 2h14c1 0 2-1 2-2a9 9 0 0 0-9-9z" fill="#fef08a" stroke="#854d0e" />
          <path d="M10 14v6a2 2 0 0 0 4 0v-6" stroke="#854d0e" strokeWidth="2" />
        </svg>
      );

    case "root":
      // Root / Tuber / Carrot
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="m14 3 4 4L9 16c-1 1-3 1-4 0s-1-3 0-4l9-9z" fill="#fed7aa" stroke="#c2410c" />
          <path d="M14 3c1-2 4-2 5-1s1 4-1 5" stroke="#15803d" strokeWidth="2" />
        </svg>
      );

    case "leafy":
      // Leafy greens
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c0 4-1 9-5 13-1.5 1.5-2 3-3 5z" fill="#bbf7d0" stroke="#16a34a" />
          <path d="M10.5 13.5 14 10" stroke="#16a34a" strokeWidth="2" />
        </svg>
      );

    case "meat_seafood":
      // Protein / Fish / Cutlet
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M6.5 12c.5-3.5 3-6.5 7.5-6.5 4 0 6 3 6 6.5s-2 6.5-6 6.5c-4.5 0-7-3-7.5-6.5z" fill="#fee2e2" stroke="#dc2626" />
          <circle cx="16" cy="11" r="1" fill="#dc2626" />
        </svg>
      );

    case "egg_dairy_bean":
      // Bean / Dairy
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M12 3C8 3 5 8.5 5 14a7 7 0 0 0 12 0c0-5.5-3-11-7-11z" fill="#fef9c3" stroke="#ca8a04" />
        </svg>
      );

    case "staple":
      // Rice / Grain bowl
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M4 11h16a8 8 0 0 1-16 0z" fill="#fef3c7" stroke="#d97706" />
          <path d="M8 8c1-1.5 2-1.5 3 0" stroke="#d97706" strokeWidth="1.5" />
          <path d="M13 8c1-1.5 2-1.5 3 0" stroke="#d97706" strokeWidth="1.5" />
        </svg>
      );

    case "condiment":
      // Condiment / Seasoning jar
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <rect x="6" y="8" width="12" height="12" rx="3" fill="#f5f5f4" stroke="#78716c" />
          <path d="M8 8V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3" stroke="#78716c" />
          <line x1="6" y1="12" x2="18" y2="12" stroke="#78716c" />
        </svg>
      );

    default:
      // General sprout
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-label={name}>
          <path d="M7 20h10" stroke="#386753" />
          <path d="M12 20V10" stroke="#386753" />
          <path d="M12 10c2-3 5-4 8-3-1 3-3 5-6 5" fill="#d1fae5" stroke="#065f46" />
          <path d="M12 14c-2-2-4.5-3-7-2 1 3 3 4 5 4" fill="#d1fae5" stroke="#065f46" />
        </svg>
      );
  }
}
