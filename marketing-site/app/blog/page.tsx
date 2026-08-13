import styles from './page.module.css';
import Link from 'next/link';
import { blogs } from '../data/blogs';

export const metadata = {
  title: '部落格 | CooCoo煮煮',
  description: '專為單身租屋族準備的省錢攻略、食材保存技巧與新手食譜。',
};

export default function BlogPage() {
  const categories = ['全部', '省錢攻略', '食材保存', '套房廚房', '新手入門', '健康飲食'];

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>最新文章</h1>
        <p>跟著 CooCoo煮煮，一起探索自煮的樂趣與省錢秘訣</p>
      </div>

      <div className={styles.categoryFilter}>
        {categories.map((cat) => (
          <span key={cat} className={`${styles.categoryPill} ${cat === '全部' ? styles.active : ''}`}>
            {cat}
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {blogs.map((blog) => (
          <Link href={`/blog/${blog.slug}`} key={blog.slug} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.category}>{blog.category}</span>
              <span className={styles.readTime}>{blog.readTime} 閱讀</span>
            </div>
            <h2 className={styles.title}>{blog.title}</h2>
            <p className={styles.description}>{blog.description}</p>
            <div className={styles.footer}>
              <span className={styles.date}>{new Date(blog.publishDate).toLocaleDateString('zh-TW')}</span>
              <span className={styles.readMore}>閱讀全文 →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
