import Link from "next/link";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";
import ChartsDashboard from "@/components/charts/ChartsDashboard";

export const metadata = {
  title: "Charts — Fieldnotes",
  description: "ESP32 sensor and Raspberry Pi camera analytics.",
};

export default function ChartsPage() {
  return (
    <main className="charts-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </Link>
        <WorkspaceNavigation platform="directus" />
      </header>
      <section className="charts-hero">
        <p className="section-kicker">Directus · analytics workspace</p>
        <h1>Sensor and camera<br /><span>charts.</span></h1>
        <p>Four chart types for temperature, smoke, distance, and scan history.</p>
      </section>
      <ChartsDashboard />
    </main>
  );
}
