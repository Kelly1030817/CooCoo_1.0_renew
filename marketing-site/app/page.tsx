import styles from './page.module.css';
import Link from 'next/link';
import { blogs } from './data/blogs';

export default function Home() {
  const latestBlogs = blogs.slice(0, 3);

  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <h1 className={styles.title}>
            智慧自煮與 <span>圓夢儲蓄</span>
          </h1>
          <p className={styles.subtitle}>
            下班意志力破產？外食費太高？CooCoo煮煮為都市單身租屋族設計，15分鐘快速上桌，幫你省下每一分錢。
          </p>
          <Link href="/recipes" className={styles.ctaButton}>
            開始第一餐
          </Link>
        </div>
      </section>

      <section className={`${styles.features} container`}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem' }}>四大核心功能</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🛒</div>
            <h3 className={styles.featureTitle}>精益採買</h3>
            <p className={styles.featureDesc}>不浪費任何食材，精準計算單人份量，買得剛剛好。</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🍱</div>
            <h3 className={styles.featureTitle}>科學分裝</h3>
            <p className={styles.featureDesc}>週末一次處理，平日隨取隨用，告別備料煩惱。</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⏱️</div>
            <h3 className={styles.featureTitle}>15分鐘烹飪</h3>
            <p className={styles.featureDesc}>專為快煮鍋、電磁爐設計，一鍋到底，快速美味。</p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>💰</div>
            <h3 className={styles.featureTitle}>圓夢儲蓄</h3>
            <p className={styles.featureDesc}>記錄每一筆省下的外食費，讓存款數字看得見。</p>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: '4rem 1rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '2rem' }}>最新文章</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {latestBlogs.map((blog) => (
            <Link href={`/blog/${blog.slug}`} key={blog.slug} style={{ display: 'block', backgroundColor: 'white', borderRadius: 'var(--radius-global)', padding: '1.5rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.8rem' }}>
                <span style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>{blog.category}</span>
                <span style={{ opacity: 0.6 }}>{new Date(blog.publishDate).toLocaleDateString('zh-TW')}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--color-dark)' }}>{blog.title}</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{blog.description}</p>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link href="/blog" style={{ display: 'inline-block', padding: '0.75rem 2rem', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: '99px', fontWeight: 600 }}>
            閱讀更多文章
          </Link>
        </div>
      </section>
    </>
  );
}
