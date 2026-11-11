"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSignedInAccount, type AuthPlatform, type SignedInAccount } from "@/lib/auth-client";
import { pocketbaseClient } from "@/lib/pocketbase-client";

type ProfileRecord = SignedInAccount & { id: string };

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "data" in data) {
      const fields = data.data;
      if (fields && typeof fields === "object" && "username" in fields) {
        return "That username is already in use or does not meet the username requirements.";
      }
    }
  }
  return error instanceof Error ? error.message : "Your profile could not be updated. Try again.";
}

function getAvatarUrl(record: ProfileRecord) {
  const authRecord = pocketbaseClient.authStore.record;
  return record.avatar && authRecord
    ? pocketbaseClient.files.getURL(authRecord, record.avatar, { thumb: "160x160f" })
    : "";
}

export default function ProfileEditor() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const record = pocketbaseClient.authStore.record;
    const account = getSignedInAccount("pocketbase");
    if (!record || !account) {
      router.replace("/pocketbase/login");
      return;
    }
    setProfile({ ...account, id: record.id });
    setName(account.name);
    setUsername(account.username);
  }, [router]);

  useEffect(() => {
    if (!avatar) {
      setAvatarPreview("");
      return;
    }
    const url = URL.createObjectURL(avatar);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatar]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setErrorMessage("Use a username with 3–30 letters, numbers, or underscores.");
      return;
    }
    if (avatar && avatar.size > 5 * 1024 * 1024) {
      setErrorMessage("The profile photo must be 5 MB or smaller.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setNotice("");
    try {
      const payload = new FormData();
      payload.set("name", name.trim());
      payload.set("username", cleanUsername);
      payload.set("role", profile.role);
      if (avatar) payload.set("avatar", avatar);
      if (removeAvatar) payload.set("avatar", "");
      const updated = await pocketbaseClient
        .collection("fieldnotes_accounts")
        .update(profile.id, payload);
      pocketbaseClient.authStore.save(pocketbaseClient.authStore.token, updated);
      const account = getSignedInAccount("pocketbase");
      if (account) setProfile({ ...account, id: profile.id });
      setAvatar(null);
      setRemoveAvatar(false);
      setNotice("Your profile was updated.");
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return <main className="profile-page"><p aria-live="polite">Loading your profile…</p></main>;
  }

  const previewUrl = avatarPreview || (removeAvatar ? "" : getAvatarUrl(profile));
  const platform: AuthPlatform = "pocketbase";

  return (
    <main className="profile-page">
      <header className="profile-header">
        <Link className="content-admin-brand" href="/"> <span>f.</span> Fieldnotes</Link>
        <details className="profile-navigation">
          <summary>Navigation <span>Signed in</span></summary>
          <nav aria-label="Profile navigation">
            <Link href="/supabase">Supabase workspace</Link>
            <Link href="/directus">Directus workspace</Link>
            <Link href="/pocketbase">PocketBase workspace</Link>
            {profile.role === "admin" && <Link href={`/${platform}/admin`}>Content studio</Link>}
            <button
              onClick={() => {
                pocketbaseClient.authStore.clear();
                router.replace("/pocketbase/login");
              }}
              type="button"
            >Log out</button>
          </nav>
        </details>
      </header>
      <section className="profile-card">
        <div className="profile-heading">
          <p className="landing-eyebrow">ACCOUNT SETTINGS</p>
          <h1>Your profile</h1>
          <p>Signed in as <strong>{profile.email}</strong></p>
          <span className="profile-signed-in-badge"><i /> You’re signed in</span>
        </div>

        {errorMessage && <p className="profile-message profile-error" role="alert">{errorMessage}</p>}
        {notice && <p className="profile-message profile-success" role="status">{notice}</p>}

        <form className="profile-form" onSubmit={saveProfile}>
          <div className="profile-photo-section">
            <div
              aria-label={previewUrl ? "Profile photo preview" : "No profile photo"}
              className={`profile-avatar ${previewUrl ? "profile-avatar-image" : ""}`}
              role="img"
              style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}
            >
              {!previewUrl && (name.trim().slice(0, 1).toUpperCase() || "F")}
            </div>
            <div>
              <label className="profile-photo-picker">
                <span>Change photo</span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    setAvatar(event.target.files?.[0] || null);
                    setRemoveAvatar(false);
                  }}
                  type="file"
                />
              </label>
              <p>JPG, PNG, or WebP. Maximum size 5 MB.</p>
              {profile.avatar && (
                <button className="profile-remove-photo" onClick={() => {
                  setAvatar(null);
                  setRemoveAvatar(true);
                }} type="button">Remove photo</button>
              )}
            </div>
          </div>
          <label>
            <span>Display name</span>
            <input maxLength={100} minLength={2} onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label>
            <span>Username</span>
            <input
              autoComplete="username"
              maxLength={30}
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              pattern="[A-Za-z0-9_]{3,30}"
              required
              value={username}
            />
            <small>3–30 letters, numbers, or underscores. Must be unique.</small>
          </label>
          <div className="profile-form-actions">
            <Link href="/">Cancel</Link>
            <button className="content-admin-button" disabled={saving} type="submit">
              {saving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
