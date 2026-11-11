import { notFound, redirect } from "next/navigation";

type LegacyStudioPageProps = {
  params: Promise<{ slug: string }>;
};

const workspaceRoutes: Record<string, string> = {
  supabase: "/supabase",
  directus: "/directus",
  pocketbase: "/pocketbase",
};

export default async function LegacyStudioPage({ params }: LegacyStudioPageProps) {
  const { slug } = await params;
  const destination = workspaceRoutes[slug];

  if (!destination) {
    notFound();
  }

  redirect(destination);
}
