"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSignedInAccount, type AuthPlatform, type SignedInAccount } from "@/lib/auth-client";
import { pocketbaseClient } from "@/lib/pocketbase-client";

const workspaces: AuthPlatform[] = ["supabase", "directus", "pocketbase"];

export default function WorkspaceNavigation({ platform }: { platform: AuthPlatform }) {
  const [account, setAccount] = useState<SignedInAccount | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const unsubscribe = pocketbaseClient.authStore.onChange(() => {
      const signedInAccount = getSignedInAccount(platform);
      setAccount(signedInAccount);
      const record = pocketbaseClient.authStore.record;
      setAvatarUrl(
        signedInAccount?.avatar && record
          ? pocketbaseClient.files.getURL(record, signedInAccount.avatar, { thumb: "80x80f" })
          : "",
      );
    }, true);
    return unsubscribe;
  }, [platform]);

  return (
    <details className={`workspace-navigation workspace-navigation-${platform}`}>
      <summary>
        <span
          aria-hidden="true"
          className={`workspace-nav-avatar ${avatarUrl ? "workspace-nav-avatar-image" : ""}`}
          style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined}
        >
          {!avatarUrl && account?.name.slice(0, 1).toUpperCase()}
        </span>
        <span className="workspace-nav-summary-label">Navigation</span>
        <span className="workspace-nav-summary-status">
          {account ? `Signed in as ${account.name}` : "Explore workspace"}
        </span>
      </summary>
      <nav aria-label={`${platform} workspace navigation`}>
        <Link href={`/${platform}`}>Workspace home</Link>
        <Link href="/sample-system">Raspberry Pi camera sample</Link>
        <Link href="/sample-iot">Sample IoT · ESP32 sensors</Link>
        <Link href="/charts">Charts</Link>
        <Link href="/supabase#features">About Supabase</Link>
        <Link href="/directus#features">About Directus</Link>
        <Link href="/pocketbase#features">About PocketBase</Link>
        {account ? (
          <>
            <Link href="/account">My profile</Link>
            {account.role === "admin" && <Link href={`/${platform}/admin`}>Content studio</Link>}
            <button
              onClick={() => {
                pocketbaseClient.authStore.clear();
                setAccount(null);
              }}
              type="button"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href={`/${platform}/login`}>Log in</Link>
            <Link href={`/${platform}/register`}>Create account</Link>
          </>
        )}
        {workspaces.filter((workspace) => workspace !== platform).map((workspace) => (
          <Link href={`/${workspace}`} key={workspace}>{workspace}</Link>
        ))}
      </nav>
    </details>
  );
}
