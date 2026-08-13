import { Metadata } from 'next';
import { blogs } from '../../data/blogs';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';

export async function generateStaticParams() {
  return blogs.map((blog) => ({
    slug: blog.slug,
  }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const blog = blogs.find((b) => b.slug === resolvedParams.slug);

  if (!blog) {
    return {
      title: '文章未找到 | CooCoo煮煮',
    };
  }

  return {
    title: `${blog.title} | CooCoo煮煮`,
    description: blog.description,
    openGraph: {
      title: `${blog.title} | CooCoo煮煮`,
      description: blog.description,
      type: 'article',
      publishedTime: blog.publishDate,
      authors: ['CooCoo煮煮'],
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const blog = blogs.find((b) => b.slug === resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.title,
    description: blog.description,
    datePublished: blog.publishDate,
    author: {
      '@type': 'Organization',
      name: 'CooCoo煮煮',
    },
    publisher: {
      '@type': 'Organization',
      name: 'CooCoo煮煮',
      logo: {
        '@type': 'ImageObject',
        url: 'https://coocoo.tw/logo.png',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className={styles.article}>
        <div className={styles.container}>
          <Link href="/blog" className={styles.backLink}>
            ← 返回部落格
          </Link>
          <header className={styles.header}>
            <div className={styles.meta}>
              <span className={styles.category}>{blog.category}</span>
              <span className={styles.date}>{new Date(blog.publishDate).toLocaleDateString('zh-TW')}</span>
              <span className={styles.readTime}>閱讀時間 {blog.readTime}</span>
            </div>
            <h1 className={styles.title}>{blog.title}</h1>
          </header>
          <div 
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </div>
      </article>
    </>
  );
}
