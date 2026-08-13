import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: '關於我們 | CooCoo煮煮',
  description: '了解CooCoo煮煮的品牌故事與使命，我們如何幫助都市單身租屋族享受自煮生活並達成儲蓄目標。',
};

export default function AboutPage() {
  return (
    <div className="container">
      <div className={styles.wrapper}>
        <header className={styles.header}>
          <h1 className={styles.title}>關於 CooCoo煮煮</h1>
          <p className={styles.subtitle}>為了每一個在城市打拼的你，打造的智慧廚房與儲蓄助手</p>
        </header>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>我們的故事</h2>
            <p className={styles.text}>
              在擁擠的城市裡，許多單身租屋族面臨著相同的困境：下班後身心俱疲，外食費不斷攀升，想自己煮卻受限於狹小的空間、簡陋的設備，以及每次買食材總是容易浪費的挫折感。
            </p>
            <p className={styles.text}>
              CooCoo煮煮誕生於這樣的日常痛點之中。我們相信，即使只有一個快煮鍋、一個單口電磁爐，也能享受溫暖、健康的自煮生活。
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>我們的使命</h2>
            <p className={styles.text}>
              我們致力於推廣「精益自煮」的概念，透過科學化的食材分裝、專為極簡設備設計的15分鐘食譜，降低自煮的門檻。
            </p>
            <p className={styles.text}>
              更重要的是，我們將「自煮」與「儲蓄」結合。每一次自己動手做飯省下的外食花費，都會在我們的系統中轉換為看得到的儲蓄進度，幫助你在享受健康飲食的同時，一步步達成自己的圓夢目標。
            </p>
          </section>

          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>核心價值</h2>
            <ul style={{ paddingLeft: '1.5rem', color: '#444', lineHeight: '1.8' }}>
              <li><strong>零浪費 (Zero Waste)：</strong> 剛好的份量，精準的採買。</li>
              <li><strong>極簡烹飪 (Minimalist Cooking)：</strong> 一鍋到底，最少的清洗負擔。</li>
              <li><strong>看得見的價值 (Visible Savings)：</strong> 將健康與省錢具象化。</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
