"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PlatformLogo from "@/components/brand/PlatformLogo";
import {
  getSignedInAccount,
  logoutAccount,
  type AuthPlatform,
  type SignedInAccount,
} from "@/lib/auth-client";

const workspaces: Array<{
  platform: AuthPlatform;
  name: string;
  description: string;
  detail: string;
  accent: string;
}> = [
  {
    platform: "supabase",
    name: "Supabase",
    description: "A Postgres database, authentication, APIs, realtime, and storage.",
    detail: "Postgres · Auth · Realtime",
    accent: "mint",
  },
  {
    platform: "directus",
    name: "Directus",
    description: "A flexible content platform for managing data and digital experiences.",
    detail: "SQL · Admin app · APIs",
    accent: "lavender",
  },
  {
    platform: "pocketbase",
    name: "PocketBase",
    description: "A lightweight all-in-one backend with a database and built-in admin.",
    detail: "SQLite · Auth · File storage",
    accent: "blue",
  },
];

export default function AccountDashboard({ platform }: { platform: AuthPlatform }) {
  const router = useRouter();
  const [account, setAccount] = useState<SignedInAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const signedInAccount = getSignedInAccount(platform);
    if (!signedInAccount) {
      router.replace(`/${platform}/login`);
      return;
    }

    setAccount(signedInAccount);
    setIsLoading(false);
  }, [platform, router]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage("");
    try {
      await logoutAccount();
      router.replace(`/${platform}/login`);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? `Your browser session was cleared, but the provider could not fully sign you out: ${error.message}`
          : "Your browser session was cleared, but the provider could not fully sign you out.",
      );
      setAccount(null);
    } finally {
      setIsSigningOut(false);
    }
  }

  if (isLoading || !account) {
    return (
      <main className="home-landing account-dashboard-loading" aria-live="polite">
        <p>{errorMessage || "Opening your workspace dashboard…"}</p>
        {errorMessage && <Link href={`/${platform}/login`}>Return to sign in</Link>}
      </main>
    );
  }

  return (
    <main className="home-landing account-dashboard">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </Link>
        <details className="dashboard-navigation">
          <summary>Signed in as {account.name}</summary>
          <nav aria-label="Dashboard navigation">
            <a href="#workspaces">Your workspaces</a>
            <Link href="/account">My profile</Link>
            {account.role === "admin" && <Link href={`/${platform}/admin`}>Content studio</Link>}
            <Link href="/supabase">Supabase workspace</Link>
            <Link href="/directus">Directus workspace</Link>
            <Link href="/pocketbase">PocketBase workspace</Link>
          <button
            className="dashboard-signout"
            disabled={isSigningOut}
            onClick={handleSignOut}
            type="button"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
          </nav>
        </details>
      </header>

      <section className="dashboard-welcome" aria-labelledby="dashboard-title">
        <p className="eyebrow"><span className="eyebrow-line" /> YOUR FIELDNOTES</p>
        <h1 id="dashboard-title">Welcome, <span>{account.name}</span>.</h1>
        <p className="hero-description">
          Your shared PocketBase account is signed in through {platform}. Choose a workspace to continue.
        </p>
      </section>

      <section className="comparison dashboard-workspaces" id="workspaces">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Your workspace collection</p>
            <h2>Where would you like to go?</h2>
          </div>
          <p className="section-note">Three platforms.<br />One place to start.</p>
        </div>

        <div className="platform-grid">
          {workspaces.map((workspace) => (
            <article className="platform-card" key={workspace.platform}>
              <div className="card-topline">
                <span className={`platform-symbol symbol-${workspace.accent}`}>
                  <PlatformLogo className="platform-logo" platform={workspace.platform} />
                </span>
                <span className="card-index">↗</span>
              </div>
              <p className="platform-category">Workspace</p>
              <h3>{workspace.name}</h3>
              <p className="platform-description">{workspace.description}</p>
              <div className="card-footer">
                <span className="platform-details">{workspace.detail}</span>
                <Link href={`/${workspace.platform}`} aria-label={`Open ${workspace.name} workspace`}>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
