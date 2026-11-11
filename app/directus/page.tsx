import type { Metadata } from "next";
import Link from "next/link";
import PlatformLogo from "@/components/brand/PlatformLogo";
import { getPlatforms, platformSlug } from "@/lib/platforms";
import { getPublishedPosts } from "@/lib/content";
import WorkspacePosts from "@/components/content/WorkspacePosts";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Directus | Fieldnotes",
  description: "Learn about Directus, an open data platform for managing SQL data and content.",
};

export default async function DirectusWorkspace() {
  const [platforms, posts] = await Promise.all([
    getPlatforms(),
    getPublishedPosts("directus"),
  ]);

  return (
    <main className="cms-landing cms-landing-directus">
      <header className="landing-nav directus-landing-nav">
        <Link href="/" className="landing-brand">
          <span className="landing-logo landing-logo-directus" aria-hidden="true"><PlatformLogo className="platform-logo" platform="directus" /></span>
          <strong>directus</strong>
        </Link>
        <WorkspaceNavigation platform="directus" />
      </header>

      <section className="landing-hero directus-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span className="directus-eyebrow-mark">✳</span> THE DATA PLATFORM FOR EVERYONE</p>
          <h1>Your data, <span>beautifully</span> connected.</h1>
          <p className="landing-lede">
            Directus connects to your SQL database and adds an API and visual
            app for teams to manage data, content, and workflows.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary directus-primary" href="#product-preview">Explore the platform <span>↗</span></a>
            <a className="landing-secondary" href="#features">See what you can build <span>↓</span></a>
          </div>
          <div className="directus-trust-note"><span>◈</span> Open data. No silos. Your rules.</div>
        </div>
        <div className="directus-hero-art" aria-hidden="true">
          <div className="directus-art-card art-card-back"><span>▤</span><i /><i /><i /></div>
          <div className="directus-art-card art-card-front"><span className="art-card-spark">✳</span><strong>Your content,<br />in good company.</strong><small>One connected workspace</small></div>
          <span className="directus-art-orbit" />
          <span className="directus-art-star">✳</span>
        </div>
      </section>

      <section className="directus-content-preview" id="product-preview">
        <div className="directus-preview-intro"><p className="landing-eyebrow">A WORKSPACE THAT FITS YOUR FLOW</p><h2>Meet your content hub.</h2><p>Bring every collection into focus and keep your team moving.</p></div>
        <div className="directus-dashboard">
          <aside className="directus-preview-sidebar">
            <div className="directus-preview-brand"><span><PlatformLogo className="platform-logo" platform="directus" /></span><strong>directus</strong></div>
            <div className="directus-preview-workspace"><span>F</span> Fieldnotes <b>⌄</b></div>
            <p>WORKSPACE</p>
            <a className="directus-preview-active" href="#platforms"><span>▦</span> Content</a>
            <a href="#product-preview"><span>▥</span> Insights</a>
            <a href="#product-preview"><span>▧</span> Files</a>
            <p className="directus-preview-collections">COLLECTIONS <b>＋</b></p>
            <a className="directus-collection-active" href="#platforms"><span>▤</span> Platforms <small>{platforms.length}</small></a>
            <a href="#platforms"><span>▤</span> Team</a>
            <div className="directus-preview-user"><span>F</span><strong>Fieldnotes Admin</strong><b>···</b></div>
          </aside>
          <div className="directus-preview-main" id="platforms">
            <div className="directus-preview-topbar"><span>Content</span><span>/</span><strong>Platforms</strong><span className="directus-preview-avatar">F</span></div>
            <div className="directus-preview-content">
              <div className="directus-preview-title"><div><p>COLLECTION</p><h3>Platforms</h3><small>Manage your platform directory and see which workspace is active.</small></div><button type="button">＋ Create Item</button></div>
              <div className="directus-preview-stats"><span><strong>{platforms.length}</strong><small>Total items</small></span><span><strong>{platforms.filter((platform) => platformSlug(platform.name) === "directus").length}</strong><small>Active</small></span><span><strong>Just now</strong><small>Last updated</small></span></div>
              <div className="directus-preview-toolbar"><span>⌕ &nbsp; Search items</span><button type="button">☷ Filter</button><button type="button">↕ Sort</button><button type="button">⚙ Display</button></div>
              <div className="directus-preview-table-scroll">
                <table className="landing-table directus-landing-table">
                  <thead><tr><th><span className="landing-checkbox" /></th><th>Name</th><th>Category</th><th>Details</th><th>Active</th></tr></thead>
                  <tbody>{platforms.map((platform) => {
                    const isActive = platformSlug(platform.name) === "directus";

                    return <tr key={platform.id}><td><span className="landing-checkbox" /></td><td><span className={`directus-table-icon icon-${platform.accent}`}>▤</span><strong>{platform.name}</strong></td><td>{platform.category}</td><td>{platform.details}</td><td><span className={`directus-featured-pill ${isActive ? "featured-pill-on" : ""}`}>{isActive ? "Active" : "Inactive"}</span></td></tr>;
                  })}</tbody>
                </table>
              </div>
              <div className="directus-preview-footer"><span>Showing 1–{platforms.length} of {platforms.length}</span><span>‹ &nbsp; 1 &nbsp; ›</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features directus-features" id="features">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">WHAT IS DIRECTUS?</p>
          <h2>Your SQL data, made useful.<br /><span>For people and products.</span></h2>
          <p className="landing-lede">
            Directus is an open data platform that connects to your SQL database
            and gives teams an API and visual app to manage data, content, and
            workflows—while keeping the data in your database.
          </p>
        </div>
        <div className="landing-feature-grid">
          <article><span className="feature-icon feature-violet">▤</span><h3>Content, your way</h3><p>Shape collections around the way your team thinks, works, and creates.</p><a href="#product-preview">Explore content <span>↗</span></a></article>
          <article><span className="feature-icon feature-peach">◈</span><h3>Connected by design</h3><p>Bring related information together and give everyone a clearer view.</p><a href="#product-preview">Explore relationships <span>↗</span></a></article>
          <article><span className="feature-icon feature-lilac">✳</span><h3>Workflows that flow</h3><p>Give teams the structure they need without slowing down good ideas.</p><a href="#product-preview">Explore workflows <span>↗</span></a></article>
        </div>
      </section>

      <WorkspacePosts platform="directus" posts={posts} />
      <footer className="landing-footer directus-landing-footer"><Link href="/">← All workspaces</Link><span>One connected content universe.</span><Link href="/pocketbase">Explore PocketBase →</Link></footer>
    </main>
  );
}
