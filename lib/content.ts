import PocketBase from "pocketbase";

export type WorkspaceSlug = "supabase" | "directus" | "pocketbase";
export type ContentStatus = "draft" | "published";

export type ContentPost = {
  [key: string]: string;
  id: string;
  collectionId: string;
  collectionName: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  platform: WorkspaceSlug;
  status: ContentStatus;
  publishedAt: string;
  cover: string;
  coverUrl: string;
  created: string;
  updated: string;
};

export const workspaceContent: Record<
  WorkspaceSlug,
  { name: string; collection: string; studioName: string; subtitle: string }
> = {
  supabase: {
    name: "Supabase",
    collection: "supabase_posts",
    studioName: "Supabase Studio",
    subtitle: "A clean, database-first editorial workspace.",
  },
  directus: {
    name: "Directus",
    collection: "directus_posts",
    studioName: "Directus Editorial",
    subtitle: "A structured content desk for connected stories.",
  },
  pocketbase: {
    name: "PocketBase",
    collection: "pocketbase_posts",
    studioName: "PocketBase Press",
    subtitle: "A lightweight publishing desk, all in one place.",
  },
};

function createPocketBaseClient() {
  const url =
    process.env.POCKETBASE_URL ||
    process.env.NEXT_PUBLIC_POCKETBASE_URL ||
    "http://127.0.0.1:8090";
  return new PocketBase(url);
}

export function getWorkspaceCollection(platform: WorkspaceSlug) {
  return workspaceContent[platform].collection;
}

export async function getPublishedPosts(
  platform: WorkspaceSlug,
): Promise<ContentPost[]> {
  const pocketbase = createPocketBaseClient();
  const filter = 'status = "published"';

  const posts = await pocketbase
    .collection(getWorkspaceCollection(platform))
    .getFullList<ContentPost>({ filter, sort: "-publishedAt" });
  return posts.map((post) => ({
    ...post,
    platform,
    coverUrl: post.cover ? pocketbase.files.getURL(post, post.cover, { thumb: "960x600f" }) : "",
  }));
}

export async function getPublishedPost(
  platform: WorkspaceSlug,
  slug: string,
): Promise<ContentPost | null> {
  const pocketbase = createPocketBaseClient();
  const filter = `slug = ${JSON.stringify(slug)} && status = "published"`;

  try {
    const post = await pocketbase
      .collection(getWorkspaceCollection(platform))
      .getFirstListItem<ContentPost>(filter);
    return {
      ...post,
      platform,
      coverUrl: post.cover ? pocketbase.files.getURL(post, post.cover, { thumb: "960x600f" }) : "",
    };
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }
    throw error;
  }
}
