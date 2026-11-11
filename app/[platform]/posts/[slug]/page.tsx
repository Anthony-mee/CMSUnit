import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedPost, type WorkspaceSlug } from "@/lib/content";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";
import ArticleBody from "@/components/content/ArticleBody";

export const dynamic = "force-dynamic";

const workspaceNames: Record<WorkspaceSlug, string> = {
  supabase: "Supabase",
  directus: "Directus",
  pocketbase: "PocketBase",
};

type PostPageProps = {
  params: Promise<{ platform: string; slug: string }>;
};

function isWorkspace(platform: string): platform is WorkspaceSlug {
  return platform in workspaceNames;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { platform, slug } = await params;
  if (!isWorkspace(platform)) return {};
  const post = await getPublishedPost(platform, slug);
  return post
    ? { title: `${post.title} | ${workspaceNames[platform]}`, description: post.excerpt || post.title }
    : {};
}

export default async function WorkspacePostPage({ params }: PostPageProps) {
  const { platform, slug } = await params;
  if (!isWorkspace(platform)) notFound();
  const post = await getPublishedPost(platform, slug);
  if (!post) notFound();

  return (
    <main className={`cms-landing cms-landing-${platform} content-reader`}>
      <header className="landing-nav">
        <Link href={`/${platform}`} className="landing-brand">
          <strong>{workspaceNames[platform]}</strong>
        </Link>
        <WorkspaceNavigation platform={platform} />
      </header>
      <article className="content-reader-article">
        <Link className="content-reader-back" href={`/${platform}`}>← {workspaceNames[platform]} home</Link>
        <p className="landing-eyebrow">{workspaceNames[platform]} · ARTICLE</p>
        <h1>{post.title}</h1>
        {post.coverUrl && (
          <div
            aria-label={`${post.title} cover image`}
            className="content-reader-cover"
            role="img"
            style={{ backgroundImage: `url("${post.coverUrl}")` }}
          />
        )}
        {post.excerpt && <p className="content-reader-excerpt">{post.excerpt}</p>}
        <p className="content-reader-date">
          {new Date(post.publishedAt || post.created).toLocaleDateString()}
        </p>
        <ArticleBody content={post.body} />
      </article>
    </main>
  );
}
