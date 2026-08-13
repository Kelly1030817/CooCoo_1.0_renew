import { recipes } from '../data/recipes';
import Link from 'next/link';
import styles from './page.module.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '快速食譜 | CooCoo煮煮',
  description: '15分鐘快速上桌！專為快煮鍋、電磁爐設計的一鍋到底食譜。省錢、省時、免洗大量碗盤。',
};

export default function RecipesPage() {
  return (
    <div className="container">
      <div className={styles.header}>
        <h1 className={styles.title}>15分鐘快速食譜</h1>
        <p className={styles.subtitle}>
          專為都市單身租屋族設計，只需簡單的快煮鍋或單口電磁爐，
          一鍋到底，快速美味，告別外送費！
        </p>
      </div>

      <div className={styles.grid}>
        {recipes.map(recipe => (
          <Link href={`/recipes/${recipe.slug}`} key={recipe.slug} className={styles.card}>
            <div className={styles.cardImagePlaceholder}>
              🍲
            </div>
            <div className={styles.cardContent}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h2 className={styles.cardTitle}>{recipe.name}</h2>
              </div>
              <p className={styles.cardDesc}>{recipe.description}</p>
              <div className={styles.cardMeta}>
                <span>⏳ 烹飪 {recipe.cookTime.replace('PT', '').replace('M', '分鐘')}</span>
                <span>💰 成本約 ${recipe.estimatedCost}</span>
                <span className={styles.badge}>{recipe.equipment}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
