import Link from "next/link";

export default function NotFound() {
  return (
    <main className="home-landing">
      <section className="hero" aria-labelledby="not-found-title">
        <div className="hero-copy">
          <p className="eyebrow">404 - Page not found</p>
          <h1 id="not-found-title">
            That page
            <br />
            <span>is not here.</span>
          </h1>
          <p className="hero-description">
            The page may have moved, or the address may be incorrect.
          </p>
          <Link className="hero-link" href="/">
            Return to Fieldnotes <span aria-hidden="true">-&gt;</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
