import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContentAdmin from "@/components/content/ContentAdmin";
import type { WorkspaceSlug } from "@/lib/content";

type WorkspaceAdminPageProps = {
  params: Promise<{ platform: string }>;
};

function isWorkspace(platform: string): platform is WorkspaceSlug {
  return platform === "supabase" || platform === "directus" || platform === "pocketbase";
}

export async function generateMetadata({ params }: WorkspaceAdminPageProps): Promise<Metadata> {
  const { platform } = await params;
  const title = platform[0]?.toUpperCase() + platform.slice(1);
  return { title: `${title} Content Studio | Fieldnotes` };
}

export default async function WorkspaceAdminPage({ params }: WorkspaceAdminPageProps) {
  const { platform } = await params;
  if (!isWorkspace(platform)) notFound();
  return <ContentAdmin platform={platform} />;
}
