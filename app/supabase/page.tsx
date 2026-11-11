import type { Metadata } from "next";
import Link from "next/link";
import PlatformLogo from "@/components/brand/PlatformLogo";
import { getPlatforms, platformSlug } from "@/lib/platforms";
import { getPublishedPosts } from "@/lib/content";
import WorkspacePosts from "@/components/content/WorkspacePosts";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Supabase | Fieldnotes",
  description: "Learn about Supabase, an open-source backend platform built around PostgreSQL.",
};

export default async function SupabaseWorkspace() {
  const [platforms, posts] = await Promise.all([
    getPlatforms(),
    getPublishedPosts("supabase"),
  ]);

  return (
    <main className="cms-landing cms-landing-supabase">
      <header className="landing-nav">
        <Link href="/" className="landing-brand">
          <span className="landing-logo landing-logo-supabase" aria-hidden="true"><PlatformLogo className="platform-logo" platform="supabase" /></span>
          <strong>supabase</strong>
        </Link>
        <WorkspaceNavigation platform="supabase" />
      </header>

      <section className="landing-hero supabase-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow"><span className="live-dot" /> THE OPEN SOURCE DEVELOPER PLATFORM</p>
          <h1>Build at the speed of <span>thought.</span></h1>
          <p className="landing-lede">
            Supabase is an open-source developer platform built around
            PostgreSQL, with a database, authentication, APIs, realtime, and
            storage in one backend.
          </p>
          <div className="landing-hero-actions">
            <a className="landing-primary supabase-primary" href="#product-preview">Start building <span>↗</span></a>
            <a className="landing-secondary" href="#features">Explore the platform <span>↓</span></a>
          </div>
          <div className="landing-proof"><span>● ● ●</span> Built for makers, loved by developers</div>
        </div>
        <div className="landing-hero-aside" aria-hidden="true">
          <span className="supabase-orbit supabase-orbit-one" />
          <span className="supabase-orbit supabase-orbit-two" />
          <span className="supabase-orbit supabase-orbit-three" />
          <PlatformLogo className="supabase-bolt platform-logo-hero" platform="supabase" />
          <span className="supabase-orbit-caption">One project. Infinite possibilities.</span>
        </div>
      </section>

      <section className="landing-product-preview supabase-product-preview" id="product-preview">
        <div className="product-preview-heading">
          <div><p className="landing-eyebrow">YOUR PROJECT</p><h2>Everything in one place.</h2></div>
          <span className="product-health"><i /> Project healthy</span>
        </div>
        <div className="supabase-dashboard">
          <aside className="supabase-preview-sidebar">
            <div className="supabase-preview-project"><span>F</span><strong>Fieldnotes</strong><b>⌄</b></div>
            <p>PROJECT</p>
            <a href="#product-preview"><span>◫</span> Overview</a>
            <a className="supabase-preview-active" href="#platforms"><span>▦</span> Table Editor</a>
            <a href="#product-preview"><span>⌘</span> SQL Editor</a>
            <a href="#product-preview"><span>◉</span> Authentication</a>
            <a href="#product-preview"><span>▧</span> Storage</a>
            <Link href="/sample-system"><span>◉</span> Chili camera sample</Link>
            <div className="supabase-preview-schema"><span>SCHEMA</span><strong>public</strong></div>
            <a className="supabase-schema-active" href="#platforms"><span>▤</span> platforms</a>
          </aside>
          <div className="supabase-preview-main" id="platforms">
            <div className="supabase-preview-topbar"><span>Fieldnotes project</span><span>/</span><strong>Table Editor</strong><button type="button">Connect</button></div>
            <div className="supabase-preview-content">
              <div className="supabase-preview-title"><div><p>DATABASE <span>/</span> PUBLIC</p><h3>platforms</h3><small>Browse and manage your project data.</small></div><button type="button">＋ Insert row</button></div>
              <div className="supabase-preview-table-scroll">
                <table className="landing-table supabase-landing-table">
                  <thead><tr><th><span className="landing-checkbox" /></th><th><small>#</small> id</th><th><small>Aa</small> name</th><th><small>Aa</small> category</th><th><small>◉</small> active</th></tr></thead>
                  <tbody>{platforms.map((platform, index) => {
                    const isActive = platformSlug(platform.name) === "supabase";

                    return <tr key={platform.id}><td><span className="landing-checkbox" /></td><td className="landing-id">{String(index + 1).padStart(2, "0")}</td><td className="landing-table-name">{platform.name}</td><td>{platform.category}</td><td><span className={`landing-bool ${isActive ? "landing-bool-on" : ""}`}>{String(isActive)}</span></td></tr>;
                  })}</tbody>
                </table>
              </div>
              <div className="supabase-preview-footer"><span>Showing {platforms.length} rows</span><span>Realtime enabled <i /></span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-features supabase-features" id="features">
        <div className="landing-section-heading">
          <p className="landing-eyebrow">WHAT IS SUPABASE?</p>
          <h2>A backend built around Postgres.<br /><span>Tools to build your app.</span></h2>
          <p className="landing-lede">
            Supabase is an open-source backend platform centered on PostgreSQL. It
            brings a database, authentication, APIs, realtime updates, and file
            storage together so developers can build application backends faster.
          </p>
        </div>
        <div className="landing-feature-grid">
          <article><span className="feature-icon feature-green">▤</span><h3>Postgres database</h3><p>A powerful database with a familiar SQL workflow and the flexibility to grow alongside your product.</p><a href="#product-preview">Explore database <span>↗</span></a></article>
          <article><span className="feature-icon feature-orange">♙</span><h3>Authentication</h3><p>Give your users a secure way to sign in and keep their data protected from day one.</p><a href="#product-preview">Explore authentication <span>↗</span></a></article>
          <article><span className="feature-icon feature-blue">ϟ</span><h3>Instant APIs</h3><p>Turn your data into ready-to-use APIs so you can spend more time building the experience.</p><a href="#product-preview">Explore APIs <span>↗</span></a></article>
        </div>
      </section>

      <WorkspacePosts platform="supabase" posts={posts} />
      <footer className="landing-footer"><Link href="/">← All workspaces</Link><span>Build something wonderful.</span><Link href="/directus">Explore Directus →</Link></footer>
    </main>
  );
}
