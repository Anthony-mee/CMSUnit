import type { Metadata } from "next";
import ProfileEditor from "@/components/account/ProfileEditor";

export const metadata: Metadata = {
  title: "My profile | Fieldnotes",
};

export default function ProfilePage() {
  return <ProfileEditor />;
}
