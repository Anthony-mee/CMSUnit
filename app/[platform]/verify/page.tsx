import { notFound } from "next/navigation";
import EmailVerificationPage from "@/components/auth/EmailVerificationPage";
import type { AuthPlatform } from "@/lib/auth-client";

const authPlatforms: AuthPlatform[] = ["supabase", "directus", "pocketbase"];

function isAuthPlatform(platform: string): platform is AuthPlatform {
  return authPlatforms.includes(platform as AuthPlatform);
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ platform: string }>;
}) {
  const { platform } = await params;
  if (!isAuthPlatform(platform)) notFound();

  return <EmailVerificationPage platform={platform} />;
}
