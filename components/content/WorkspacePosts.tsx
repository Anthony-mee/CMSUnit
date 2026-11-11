import Link from "next/link";
import type { ContentPost, WorkspaceSlug } from "@/lib/content";

const workspaceNames: Record<WorkspaceSlug, string> = {
  supabase: "Supabase",
  directus: "Directus",
  pocketbase: "PocketBase",
};

export default function WorkspacePosts({
  platform,
  posts,
}: {
  platform: WorkspaceSlug;
  posts: ContentPost[];
}) {
  return (
    <section className="workspace-posts" aria-labelledby={`${platform}-posts-title`}>
      <div className="workspace-posts-heading">
        <div>
          <p className="landing-eyebrow">FROM THE WORKSPACE</p>
          <h2 id={`${platform}-posts-title`}>Latest stories</h2>
        </div>
        <span>{workspaceNames[platform]}</span>
      </div>
      {posts.length ? (
        <div className="workspace-post-grid">
          {posts.map((post) => (
            <article className="workspace-post-card" key={post.id}>
              {post.coverUrl && (
                <div
                  aria-hidden="true"
                  className="workspace-post-cover"
                  style={{ backgroundImage: `url("${post.coverUrl}")` }}
                />
              )}
              <p>{new Date(post.publishedAt || post.created).toLocaleDateString()}</p>
              <h3>{post.title}</h3>
              <p className="workspace-post-excerpt">
                {post.excerpt || post.body.slice(0, 180)}
              </p>
              <Link href={`/${platform}/posts/${post.slug}`}>
                Read story <span aria-hidden="true">↗</span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="workspace-posts-empty">
          Published stories for this workspace will appear here.
        </p>
      )}
    </section>
  );
}
