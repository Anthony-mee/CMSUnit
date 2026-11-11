"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  getWorkspaceCollection,
  workspaceContent,
  type ContentPost,
  type ContentStatus,
  type WorkspaceSlug,
} from "@/lib/content";
import { pocketbaseClient } from "@/lib/pocketbase-client";

type AccessState = "checking" | "admin" | "signed-out" | "forbidden";
type PostForm = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: ContentStatus;
};

const emptyForm: PostForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  status: "draft",
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The content could not be saved. Please try again.";
}

export default function ContentAdmin({ platform }: { platform: WorkspaceSlug }) {
  const workspace = workspaceContent[platform];
  const collection = getWorkspaceCollection(platform);
  const [access, setAccess] = useState<AccessState>("checking");
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [form, setForm] = useState<PostForm>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const records = await pocketbaseClient
        .collection(collection)
        .getFullList<ContentPost>({ sort: "-publishedAt" });
      setPosts(records.map((post) => ({ ...post, platform })));
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [collection, platform]);

  useEffect(() => {
    const record = pocketbaseClient.authStore.record;
    if (!pocketbaseClient.authStore.isValid || !record) {
      setAccess("signed-out");
      return;
    }
    if (record.role !== "admin") {
      setAccess("forbidden");
      return;
    }

    setAccess("admin");
    void loadPosts();
  }, [loadPosts]);

  function startNewPost() {
    setEditingId("");
    setForm(emptyForm);
    setCoverFile(null);
    setErrorMessage("");
    setNotice("");
  }

  function editPost(post: ContentPost) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      body: post.body,
      status: post.status,
    });
    setCoverFile(null);
    setErrorMessage("");
    setNotice("");
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");
    const slug = toSlug(form.slug || form.title);
    const authorId = pocketbaseClient.authStore.record?.id;
    if (!authorId) {
      setAccess("signed-out");
      return;
    }
    if (!slug) {
      setErrorMessage("Add a title that can be used to create a post URL.");
      return;
    }
    if (coverFile && coverFile.size > 5 * 1024 * 1024) {
      setErrorMessage("The cover image must be 5 MB or smaller.");
      return;
    }

    setIsSaving(true);
    try {
      const existing = posts.find((post) => post.id === editingId);
      const data = {
        ...form,
        slug,
        author: authorId,
        publishedAt:
          form.status === "published"
            ? existing?.publishedAt || new Date().toISOString()
            : null,
        ...(coverFile ? { cover: coverFile } : {}),
      };
      if (editingId) {
        await pocketbaseClient.collection(collection).update(editingId, data);
      } else {
        await pocketbaseClient.collection(collection).create(data);
      }
      await loadPosts();
      setEditingId("");
      setForm(emptyForm);
      setCoverFile(null);
      setNotice(form.status === "published" ? "Post published." : "Draft saved.");
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function deletePost(post: ContentPost) {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setErrorMessage("");
    setNotice("");
    try {
      await pocketbaseClient.collection(collection).delete(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      if (editingId === post.id) startNewPost();
      setNotice("Post deleted.");
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  if (access === "checking") {
    return <main className="content-admin-loading" aria-live="polite">Checking admin access…</main>;
  }
  if (access === "signed-out") {
    return (
      <main className="content-admin-gate">
        <p className="landing-eyebrow">CONTENT STUDIO</p>
        <h1>Sign in to continue.</h1>
        <p>Sign in with an account that has been granted the admin role.</p>
        <Link className="content-admin-button" href={`/${platform}/login`}>Go to sign in</Link>
      </main>
    );
  }
  if (access === "forbidden") {
    return (
      <main className="content-admin-gate">
        <p className="landing-eyebrow">CONTENT STUDIO</p>
        <h1>Admin access required.</h1>
        <p>An administrator can grant access by changing your account role to “admin” in PocketBase.</p>
        <Link className="content-admin-button" href={`/${platform}`}>Back to {workspace.name}</Link>
      </main>
    );
  }

  return (
    <main className={`content-admin content-admin-${platform}`}>
      <header className="content-admin-topbar">
        <Link href={`/${platform}`} className="content-admin-brand"><span>f.</span> {workspace.studioName}</Link>
        <details className="content-admin-nav">
          <summary>
            Navigation
            <span>{pocketbaseClient.authStore.record?.name || pocketbaseClient.authStore.record?.email || "Signed in"}</span>
          </summary>
          <nav aria-label="Admin navigation">
            <Link href={`/${platform}`}>{workspace.name} home</Link>
            <Link href={`/${platform}/admin`}>Content studio</Link>
            <Link href="/account">My profile</Link>
            <Link href="/supabase">Supabase</Link>
            <Link href="/directus">Directus</Link>
            <Link href="/pocketbase">PocketBase</Link>
            <button onClick={() => {
              pocketbaseClient.authStore.clear();
              window.location.assign(`/${platform}/login`);
            }} type="button">Log out</button>
          </nav>
        </details>
        <button
          className="content-admin-button content-admin-new-button"
          onClick={startNewPost}
          type="button"
        >
          + New post
        </button>
      </header>

      <div className="content-admin-layout">
        <aside className="content-admin-sidebar">
          <p className="landing-eyebrow">PUBLISHING</p>
          <button className="content-admin-sidebar-active" type="button">Posts</button>
          <p className="content-admin-sidebar-note">{workspace.subtitle} Content is stored in <code>{collection}</code>.</p>
          <div className="content-admin-count"><span>All posts</span><strong>{posts.length}</strong></div>
        </aside>

        <section className="content-admin-main">
          <div className="content-admin-heading">
            <div>
              <p className="landing-eyebrow">YOUR CONTENT</p>
              <h1>{workspace.name} posts</h1>
              <p>Create and publish stories for the {workspace.name} workspace.</p>
            </div>
          </div>

          {errorMessage && <p className="content-admin-error" role="alert">{errorMessage}</p>}
          {notice && <p className="content-admin-notice" role="status">{notice}</p>}

          <section className="content-editor-card" aria-labelledby="content-editor-title">
            <div className="content-editor-card-heading">
              <div>
                <p className="landing-eyebrow">{editingId ? "EDITING" : "NEW STORY"}</p>
                <h2 id="content-editor-title">{editingId ? "Edit post" : "Write a post"}</h2>
              </div>
              {editingId && <button className="content-admin-quiet-button" onClick={startNewPost} type="button">Cancel</button>}
            </div>
            <form className="content-editor-form" onSubmit={handleSave}>
              <label>
                <span>Title</span>
                <input
                  maxLength={180}
                  onChange={(event) => {
                    const title = event.target.value;
                    setForm((current) => ({
                      ...current,
                      title,
                      slug: current.slug || toSlug(title),
                    }));
                  }}
                  required
                  value={form.title}
                />
              </label>
              <div className="content-editor-row">
                <label>
                  <span>URL slug</span>
                  <input
                    maxLength={180}
                    onChange={(event) => setForm((current) => ({ ...current, slug: toSlug(event.target.value) }))}
                    required
                    value={form.slug}
                  />
                </label>
                <div className={`content-workspace-badge content-workspace-${platform}`}>
                  Writing for <strong>{workspace.name}</strong>
                  <small>Saved in {collection}</small>
                </div>
              </div>
              <label>
                <span>Excerpt <small>Optional summary shown on the workspace home page</small></span>
                <textarea
                  maxLength={500}
                  onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                  rows={3}
                  value={form.excerpt}
                />
              </label>
              <label>
                <span>Cover image <small>JPG, PNG, or WebP · up to 5 MB</small></span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setCoverFile(event.target.files?.[0] || null)}
                  type="file"
                />
                {coverFile && <small className="content-cover-filename">Selected: {coverFile.name}</small>}
                {!coverFile && editingId && posts.find((post) => post.id === editingId)?.cover && (
                  <small className="content-cover-filename">An existing cover image will be kept.</small>
                )}
              </label>
              <label>
                <span>Content</span>
                <textarea
                  className="content-editor-body"
                  onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                  required
                  rows={12}
                  value={form.body}
                />
              </label>
              <div className="content-editor-actions">
                <label className="content-status-field">
                  <span>Status</span>
                  <select
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ContentStatus }))}
                    value={form.status}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </label>
                <button className="content-admin-button" disabled={isSaving} type="submit">
                  {isSaving ? "Saving…" : form.status === "published" ? "Publish" : "Save draft"}
                </button>
              </div>
            </form>
          </section>

          <section className="content-post-list" aria-labelledby="content-post-list-title">
            <div className="content-post-list-heading">
              <h2 id="content-post-list-title">All posts</h2>
              <span>{isLoading ? "Loading…" : `${posts.length} total`}</span>
            </div>
            {posts.length ? (
              <div className="content-post-table-wrap">
                <table className="content-post-table">
                  <thead><tr><th>Title</th><th>Status</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id}>
                        <td><strong>{post.title}</strong><small>/{platform}/posts/{post.slug}</small></td>
                        <td><span className={`content-status-pill content-status-${post.status}`}>{post.status}</span></td>
                        <td>{new Date(post.updated || post.created).toLocaleDateString()}</td>
                        <td className="content-post-actions">
                          {post.status === "published" && <Link href={`/${post.platform}/posts/${post.slug}`} target="_blank">View</Link>}
                          <button onClick={() => editPost(post)} type="button">Edit</button>
                          <button onClick={() => void deletePost(post)} type="button">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !isLoading && <p className="content-admin-empty">No posts yet. Start with a draft above.</p>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
