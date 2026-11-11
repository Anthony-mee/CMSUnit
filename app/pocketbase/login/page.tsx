import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Sign in to PocketBase | Fieldnotes",
};

export default function PocketBaseLoginPage() {
  return <AuthPage mode="login" platform="pocketbase" />;
}
