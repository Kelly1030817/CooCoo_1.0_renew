import { recipes } from '../../data/recipes';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import styles from './page.module.css';

// For static site generation (SSG)
export function generateStaticParams() {
  return recipes.map((recipe) => ({
    slug: recipe.slug,
  }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> | { slug: string } }): Metadata {
  // @ts-ignore
  const slug = params?.slug || '';
  const recipe = recipes.find(r => r.slug === slug);
  
  if (!recipe) {
    return {
      title: 'Recipe Not Found',
    };
  }

  return {
    title: `${recipe.name} | CooCoo煮煮`,
    description: recipe.description,
  };
}

export default async function RecipeDetail({ params }: { params: Promise<{ slug: string }> | { slug: string } }) {
  // @ts-ignore
  const slug = params?.slug || '';
  const recipe = recipes.find(r => r.slug === slug);

  if (!recipe) {
    notFound();
  }

  // Schema.org Recipe structured data
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: recipe.name,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    recipeYield: `${recipe.servings} serving`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps.map((step, index) => ({
      '@type': 'HowToStep',
      name: `Step ${index + 1}`,
      text: step,
    })),
  };

  return (
    <article className="container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <div className={styles.heroImage}>🍲</div>
          <div className={styles.headerContent}>
            <span className={styles.badge}>{recipe.equipment}</span>
            <h1 className={styles.title}>{recipe.name}</h1>
            <p className={styles.desc}>{recipe.description}</p>
            
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>準備時間</span>
                <span className={styles.statValue}>{recipe.prepTime.replace('PT', '').replace('M', '分鐘')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>烹飪時間</span>
                <span className={styles.statValue}>{recipe.cookTime.replace('PT', '').replace('M', '分鐘')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>自煮成本</span>
                <span className={styles.statValue}>${recipe.estimatedCost}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>外食花費</span>
                <span className={styles.statValue} style={{textDecoration: 'line-through'}}>${recipe.comparisonCost}</span>
              </div>
            </div>
            
            <div className={styles.savingsBox}>
              💡 這一餐幫你省下了 <strong>${recipe.comparisonCost - recipe.estimatedCost}</strong>！
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.ingredients}>
            <h2>食材清單</h2>
            <ul className={styles.list}>
              {recipe.ingredients.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section className={styles.steps}>
            <h2>料理步驟</h2>
            <ol className={styles.list}>
              {recipe.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </article>
  );
}
