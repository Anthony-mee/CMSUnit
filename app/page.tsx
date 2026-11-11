import { getPlatforms, platformSlug } from "@/lib/platforms";
import PlatformLogo, { resolvePlatformBrand } from "@/components/brand/PlatformLogo";
import Link from "next/link";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";

export const dynamic = "force-dynamic";

function ArrowUpRight() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      viewBox="0 0 16 16"
      className="arrow-icon"
    >
      <path
        d="M4 12 12 4M5 4h7v7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default async function Home() {
  const platforms = await getPlatforms();

  return (
    <main className="home-landing">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">
            f.
          </span>
          <span>fieldnotes</span>
        </Link>
        <WorkspaceNavigation platform="supabase" />
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-line" />
            Three familiar spaces for your content
          </div>
          <h1 id="hero-title">
            Find your
            <br />
            <span>workspace.</span>
          </h1>
          <p className="hero-description">
            Explore a developer console, a flexible content studio, or a
            lightweight all-in-one admin.
          </p>
          <a className="hero-link" href="#platforms">
            Explore the workspaces <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="orbit orbit-center">
            <span className="orbit-star">✳</span>
          </div>
          <div className="orbit-label orbit-label-top">your next idea</div>
          <div className="orbit-label orbit-label-bottom">starts somewhere</div>
          <span className="orbit-dot dot-one" />
          <span className="orbit-dot dot-two" />
          <span className="orbit-dot dot-three" />
        </div>
        <div className="hero-index">
          <span>01</span>
          <span className="index-rule" />
          <span>03</span>
        </div>
      </section>

      <section className="comparison" id="platforms" aria-labelledby="comparison-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Choose the workspace that fits</p>
            <h2 id="comparison-title">Three ways to work.</h2>
          </div>
          <p className="section-note">
            Explore each workspace.
            <br />
            Find your flow.
          </p>
        </div>

        <div className="platform-grid">
          {platforms.map((platform, index) => {
            const brand = resolvePlatformBrand(platform.name);

            return (
              <article
                className={`platform-card ${platform.active ? "platform-card-active" : ""}`}
                key={platform.id}
              >
                <div className="card-topline">
                  <span className={`platform-symbol symbol-${platform.accent}`}>
                    {brand ? <PlatformLogo className="platform-logo" platform={brand} /> : <span />}
                  </span>
                  <span className="card-index">0{index + 1}</span>
                </div>
                <p className="platform-category">
                  {platform.category}
                  {platform.active && <span className="active-indicator">Featured</span>}
                </p>
                <h3>{platform.name}</h3>
                <p className="platform-description">{platform.description}</p>
                <div className="card-footer">
                  <span className="platform-details">{platform.details}</span>
                  <Link
                    href={`/${platformSlug(platform.name)}`}
                    aria-label={`Open the ${platform.name} workspace`}
                  >
                    <ArrowUpRight />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bottom-note" id="how-it-works">
        <div className="bottom-note-symbol" aria-hidden="true">
          ✳
        </div>
        <div>
          <p className="section-kicker">A small stack, with room to grow</p>
          <h2>A workspace for every way you build.</h2>
          <p>
            Explore each dashboard to find the tools, layout, and content flow
            that feel right for your project.
          </p>
        </div>
        <div className="stack-label">
          <span>Workspaces</span>
          <strong>Supabase</strong>
          <span className="stack-separator">·</span>
          <strong>Directus</strong>
          <span className="stack-separator">·</span>
          <strong>PocketBase</strong>
        </div>
      </section>

      <footer className="footer">
        <a className="wordmark footer-wordmark" href="#" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">
            f.
          </span>
          <span>fieldnotes</span>
        </a>
        <span>A tiny starting point for your next big thing.</span>
        <span>Made for the curious. © 2026</span>
      </footer>
    </main>
  );
}
