import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Sign in to Supabase | Fieldnotes",
};

export default function SupabaseLoginPage() {
  return <AuthPage mode="login" platform="supabase" />;
}
