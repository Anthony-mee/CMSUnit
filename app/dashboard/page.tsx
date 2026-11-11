import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AccountDashboard from "@/components/dashboard/AccountDashboard";
import type { AuthPlatform } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Your workspaces | Fieldnotes",
};

function isAuthPlatform(platform: string | undefined): platform is AuthPlatform {
  return platform === "supabase" || platform === "directus" || platform === "pocketbase";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const { platform } = await searchParams;
  if (!isAuthPlatform(platform)) redirect("/");

  return <AccountDashboard platform={platform} />;
}
