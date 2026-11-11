import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Sign in to Directus | Fieldnotes",
};

export default function DirectusLoginPage() {
  return <AuthPage mode="login" platform="directus" />;
}
