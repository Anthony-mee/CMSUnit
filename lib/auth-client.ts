import { pocketbaseClient } from "@/lib/pocketbase-client";

export type AuthPlatform = "supabase" | "directus" | "pocketbase";

export type SignedInAccount = {
  platform: AuthPlatform;
  email: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
};

export async function registerAccount(
  values: { name: string; email: string; password: string },
): Promise<void> {
  const email = values.email.trim();

  await pocketbaseClient.collection("fieldnotes_accounts").create({
    name: values.name.trim(),
    email,
    password: values.password,
    passwordConfirm: values.password,
    role: "author",
  });
  try {
    await pocketbaseClient.collection("fieldnotes_accounts").requestVerification(email);
  } catch (error) {
    throw new Error(
      `Your account was saved, but the verification email could not be sent. ${
        error instanceof Error ? error.message : "Please check PocketBase email settings."
      }`,
    );
  }
}

export async function loginAccount(
  email: string,
  password: string,
): Promise<void> {
  await pocketbaseClient
    .collection("fieldnotes_accounts")
    .authWithPassword(email.trim(), password);
}

export function getSignedInAccount(platform: AuthPlatform): SignedInAccount | null {
  const record = pocketbaseClient.authStore.record;
  if (!pocketbaseClient.authStore.isValid || !record) return null;

  const email = typeof record.email === "string" ? record.email : "";
  if (!email) return null;

  const name = typeof record.name === "string" ? record.name : "";
  const username = typeof record.username === "string" ? record.username : "";
  const avatar = typeof record.avatar === "string" ? record.avatar : "";
  const role = typeof record.role === "string" ? record.role : "author";
  return { platform, email, name: name || email, username, avatar, role };
}

export async function logoutAccount(): Promise<void> {
  pocketbaseClient.authStore.clear();
}

export async function verifyRegisteredEmail(
  token: string,
): Promise<void> {
  await pocketbaseClient.collection("fieldnotes_accounts").confirmVerification(token);
}
