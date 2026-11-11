import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Content studios | Fieldnotes",
  description: "Choose a workspace-specific content studio.",
};

const studios = [
  { name: "Supabase Studio", workspace: "Supabase", slug: "supabase", collection: "supabase_posts" },
  { name: "Directus Editorial", workspace: "Directus", slug: "directus", collection: "directus_posts" },
  { name: "PocketBase Press", workspace: "PocketBase", slug: "pocketbase", collection: "pocketbase_posts" },
] as const;

export default function AdminIndexPage() {
  return (
    <main className="admin-studio-index">
      <p className="landing-eyebrow">FIELDNOTES PUBLISHING</p>
      <h1>Choose a content studio</h1>
      <p>Each workspace has its own editorial design and content collection.</p>
      <div>
        {studios.map((studio) => (
          <Link
            className={`admin-studio-card content-admin-${studio.slug}`}
            href={`/${studio.slug}/admin`}
            key={studio.slug}
          >
            <span>{studio.workspace}</span>
            <h2>{studio.name}</h2>
            <small>Database collection: {studio.collection}</small>
            <strong>Open studio ↗</strong>
          </Link>
        ))}
      </div>
    </main>
  );
}
