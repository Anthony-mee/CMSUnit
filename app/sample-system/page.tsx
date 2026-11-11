import Link from "next/link";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";
import RoboflowScanner from "@/components/roboflow/RoboflowScanner";

export const metadata = {
  title: "Raspberry Pi Camera Sample — Fieldnotes",
  description: "Scan chili images with a Raspberry Pi, phone, or desktop camera using Roboflow.",
};

export default function SampleSystemPage() {
  return (
    <main className="sample-system">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </Link>
        <WorkspaceNavigation platform="supabase" />
      </header>

      <section className="sample-system-hero">
        <p className="section-kicker">Sample system · Raspberry Pi + Roboflow</p>
        <h1>Chili camera<br /><span>scanner.</span></h1>
        <p>
          Scan chili peppers with a live camera or upload an image. The
          classifier predicts one of your Roboflow dataset classes: siling
          demonyo, siling haba, siling labuyo, or others.
        </p>
        <a className="hero-link" href="https://app.roboflow.com/" target="_blank" rel="noreferrer">
          Open Roboflow <span aria-hidden="true">↗</span>
        </a>
      </section>

      <section className="sample-system-content">
        <RoboflowScanner configured={Boolean(process.env.ROBOFLOW_API_KEY)} />
      </section>
    </main>
  );
}
