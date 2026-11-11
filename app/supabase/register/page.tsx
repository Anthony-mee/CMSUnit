import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Create a Supabase account | Fieldnotes",
};

export default function SupabaseRegisterPage() {
  return <AuthPage mode="register" platform="supabase" />;
}
