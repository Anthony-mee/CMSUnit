import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Create a Directus account | Fieldnotes",
};

export default function DirectusRegisterPage() {
  return <AuthPage mode="register" platform="directus" />;
}
