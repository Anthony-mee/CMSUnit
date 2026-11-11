import AuthPage from "@/components/auth/AuthPage";

export const metadata = {
  title: "Create a PocketBase account | Fieldnotes",
};

export default function PocketBaseRegisterPage() {
  return <AuthPage mode="register" platform="pocketbase" />;
}
