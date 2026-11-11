import type { Metadata } from "next";
import Link from "next/link";
import PlatformLogo from "@/components/brand/PlatformLogo";
import { getPlatforms, platformSlug } from "@/lib/platforms";
import { getPublishedPosts } from "@/lib/content";
import WorkspacePosts from "@/components/content/WorkspacePosts";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PocketBase | Fieldnotes",
  description: "Learn about PocketBase, an open-source backend with SQLite, authentication, and file storage.",
};

export default async function PocketBaseWorkspace() {
  const [platforms, posts] = await Promise.all([
    getPlatforms(),
    getPublishedPosts("pocketbase"),
  ]);

  return (
    <main className="cms-landing cms-landing-pocketbase">
      <header className="landing-nav pocketbase-landing-nav">
        <Link href="/" className="landing-brand">
          <span className="landing-logo landing-logo-pocketbase" aria-hidden="true"><PlatformLogo className="platform-logo" platform="pocketbase" /></span>
          <strong>PocketBase</strong>
        </Link>
        <WorkspaceNavigation platform="pocketbase" />
      </header>

      <section className="landing-hero pocketbase-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span className="pocketbase-spark">✳</span> OPEN SOURCE · SELF HOSTED · DEVELOPER FRIENDLY</p>
          <h1>Backend in a box.<br /><span>Room to build.</span></h1>
          <p className="landing-lede">
            PocketBase is a lightweight, open-source backend shipped as one Go
            application with embedded SQLite, authentication, file storage,
            realtime, and a built-in admin UI.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary pocketbase-primary" href="#product-preview">Explore the admin <span>↓</span></a>
            <a className="landing-secondary" href="#features">Discover PocketBase <span>↗</span></a>
          </div>
          <div className="pocketbase-hero-meta"><span>✦ Single executable</span><span>✦ SQLite powered</span><span>✦ Ready to run</span></div>
        </div>
        <div className="pocketbase-hero-art" aria-hidden="true">
          <div className="pocketbase-art-window"><div className="pocketbase-art-window-top"><span /><span /><span /><b>admin.pb</b></div>          <div className="pocketbase-art-window-body"><span className="pocketbase-art-cube"><PlatformLogo className="pocketbase-art-logo" platform="pocketbase" /></span><strong>Your backend,<br />beautifully simple.</strong><small>one app · endless possibilities</small><i className="pocketbase-art-cursor" /></div></div>
          <span className="pocketbase-art-star pocket-star-one">✳</span><span className="pocketbase-art-star pocket-star-two">✦</span>
        </div>
      </section>

      <section className="pocketbase-admin-preview" id="product-preview">
        <div className="pocketbase-preview-heading"><div><p className="landing-eyebrow">THE BUILT-IN ADMIN</p><h2>Your data at a glance.</h2><p>Manage collections and records from one clean interface.</p></div><span className="pocketbase-preview-health"><i /> Instance ready</span></div>
        <div className="pocketbase-dashboard">
          <aside className="pocketbase-preview-sidebar">
            <div className="pocketbase-preview-brand"><span><PlatformLogo className="platform-logo" platform="pocketbase" /></span><strong>PocketBase</strong></div>
            <div className="pocketbase-preview-instance"><i /> LOCAL INSTANCE</div>
            <p>ADMIN</p>
            <a href="#pb-records"><span>⌂</span> Overview</a>
            <a className="pocketbase-preview-active" href="#pb-records"><span>▦</span> Collections</a>
            <a href="#pb-records"><span>♙</span> Users</a>
            <a href="#pb-records"><span>▧</span> Files</a>
            <a href="#pb-records"><span>⚙</span> Settings</a>
            <p className="pocketbase-data-label">YOUR DATA</p>
            <a className="pocketbase-collection-active" href="#pb-records"><span>▤</span> platforms <small>{platforms.length}</small></a>
            <div className="pocketbase-preview-user"><span>F</span><strong>Fieldnotes</strong><b>···</b></div>
          </aside>
          <div className="pocketbase-preview-main" id="pb-records">
            <div className="pocketbase-preview-topbar"><span>Collections</span><span>/</span><strong>platforms</strong><span className="pocketbase-instance-live"><i /> All systems ready</span></div>
            <div className="pocketbase-preview-content">
              <div className="pocketbase-preview-title"><div><p>COLLECTION</p><h3>Platforms</h3><small>Your platform profiles, all in one place.</small></div><button type="button">＋ New record</button></div>
              <div className="pocketbase-preview-stats"><span><small>RECORDS</small><strong>{platforms.length}</strong></span><span><small>ACTIVE</small><strong>{platforms.filter((platform) => platformSlug(platform.name) === "pocketbase").length}</strong></span><span><small>COLLECTION</small><strong>platforms</strong></span></div>
              <div className="pocketbase-records-heading"><div><strong>All records</strong><small>{platforms.length} total</small></div><button type="button">⌕ Search</button><button type="button">＋ Add filter</button></div>
              <div className="pocketbase-preview-table-scroll">
                <table className="landing-table pocketbase-landing-table">
                  <thead><tr><th><span className="landing-checkbox" /></th><th>Name</th><th>Category</th><th>Description</th><th>Active</th></tr></thead>
                  <tbody>{platforms.map((platform) => {
                    const isActive = platformSlug(platform.name) === "pocketbase";

                    return <tr key={platform.id}><td><span className="landing-checkbox" /></td><td><span className={`pocketbase-row-icon row-${platform.accent}`}>{platform.name.slice(0, 1)}</span><strong>{platform.name}</strong></td><td>{platform.category}</td><td className="pocketbase-row-description">{platform.description}</td><td><span className={`pocketbase-featured-pill ${isActive ? "pocketbase-featured-on" : ""}`}>{isActive ? "Active" : "Inactive"}</span></td></tr>;
                  })}</tbody>
                </table>
              </div>
              <div className="pocketbase-preview-footer"><span>Showing {platforms.length} of {platforms.length} records</span><span>Collection <strong>platforms</strong></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features pocketbase-features" id="features">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">WHAT IS POCKETBASE?</p>
          <h2>A backend in one app.<br /><span>Simple to run and build on.</span></h2>
          <p className="landing-lede">
            PocketBase is an open-source backend packaged as a single Go
            application. It includes an embedded SQLite database, authentication,
            file storage, realtime subscriptions, and a built-in admin dashboard.
          </p>
        </div>
        <div className="landing-feature-grid">
          <article><span className="feature-icon feature-blue">▤</span><h3>Database & APIs</h3><p>Store structured data and get a ready-to-use API without assembling a stack of services.</p><a href="#product-preview">Explore collections <span>↗</span></a></article>
          <article><span className="feature-icon feature-violet">♙</span><h3>Authentication</h3><p>Built-in user management and authentication help you get from idea to app faster.</p><a href="#product-preview">Explore auth <span>↗</span></a></article>
          <article><span className="feature-icon feature-peach">▧</span><h3>Files & realtime</h3><p>Keep uploads close to your records and let your app react as data changes.</p><a href="#product-preview">Explore files <span>↗</span></a></article>
        </div>
      </section>

      <WorkspacePosts platform="pocketbase" posts={posts} />
      <footer className="landing-footer pocketbase-landing-footer"><Link href="/">← All workspaces</Link><span>One binary. A whole lot of possibility.</span><Link href="/supabase">Explore Supabase →</Link></footer>
    </main>
  );
}
