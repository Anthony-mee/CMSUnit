"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

type Reading = {
  id: string;
  temperature_c: number | null;
  mq_raw: number | null;
  distance_cm: number | null;
  signal_status: string;
  recorded_at: string;
};
type CameraScan = {
  id: string;
  mode: string;
  device_id: string;
  recorded_at: string;
  inference_status: string;
  imageUrl: string;
  results: Array<{
    modelId: string;
    label: string;
    predictions: Array<{ class: string; confidence: number }>;
    error?: string;
  }>;
};
type ChartGroup = {
  key: string;
  title: string;
  color: string;
  values: number[];
  labels: string[];
  empty: string;
  unit: string;
};

const chartWidth = 720;
const chartHeight = 250;
const padding = 32;

function pointsFor(values: number[], min: number, max: number) {
  const range = max - min || 1;
  return values.map((value, index) => {
    const x = padding + (index / Math.max(values.length - 1, 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((value - min) / range) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(" ");
}

function ChartFrame({ title, type, children, note }: { title: string; type: string; children: ReactNode; note?: string }) {
  return (
    <article className="chart-card">
      <div className="chart-card-heading">
        <div><p className="section-kicker">{type}</p><h2>{title}</h2></div>
        <span className="chart-live-dot">LIVE</span>
      </div>
      {children}
      {note && <p className="chart-note">{note}</p>}
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="chart-empty">{message}</div>;
}

function ValuesChart({ group, variant }: { group: ChartGroup; variant: "line" | "bar" | "area" | "donut" }) {
  const { values, color, unit } = group;
  if (!values.length) return <EmptyChart message={group.empty} />;
  const maximum = Math.max(...values, 1);
  const minimum = Math.min(...values, 0);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  if (variant === "bar") {
    return (
      <div className="metric-bar-chart">
        {values.slice(-10).map((value, index) => (
          <div className="metric-bar" key={`${value}-${index}`} title={`${value.toFixed(2)} ${unit}`}>
            <i style={{ height: `${Math.max(3, (value / maximum) * 100)}%`, background: color }} />
          </div>
        ))}
      </div>
    );
  }
  if (variant === "donut") {
    const belowAverage = values.filter((value) => value < average).length;
    const belowPercent = (belowAverage / values.length) * 100;
    return (
      <div className="donut-layout">
        <div className="donut" style={{ background: `conic-gradient(${color} 0 ${belowPercent}%, #ffffff20 ${belowPercent}% 100%)` }}>
          <strong>{average.toFixed(1)}</strong><span>{unit || "average"}</span>
        </div>
        <ul className="chart-list">
          <li><i style={{ background: color }} /> Below average <b>{belowAverage}</b></li>
          <li><i className="dot-partial" /> At/above average <b>{values.length - belowAverage}</b></li>
        </ul>
      </div>
    );
  }
  const baseline = variant === "area" ? 0 : minimum;
  const points = pointsFor(values, baseline, maximum);
  return (
    <svg className="chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label={`${variant} chart for ${group.title}`}>
      {variant === "area" && <polygon className="chart-area" style={{ fill: `${color}28` }} points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`} />}
      <polyline className="chart-line" style={{ stroke: color }} points={points} />
    </svg>
  );
}

export default function ChartsDashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [cameraScans, setCameraScans] = useState<CameraScan[]>([]);
  const [scanPage, setScanPage] = useState(1);
  const [scanPages, setScanPages] = useState(1);
  const [scanTotal, setScanTotal] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/iot/readings", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load sensor readings.");
        const data = await response.json() as { readings: Reading[] };
        if (active) {
          setReadings([...data.readings].reverse());
          setError("");
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load charts.");
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    let active = true;
    const loadScans = async () => {
      try {
        const response = await fetch("/api/roboflow/scans?page=1", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load camera scan history.");
        const data = await response.json() as {
          scans: CameraScan[];
          totalItems: number;
          totalPages: number;
        };
        if (!active) return;
        setCameraScans((current) => {
          const scansById = new Map(current.map((scan) => [scan.id, scan]));
          data.scans.forEach((scan) => scansById.set(scan.id, scan));
          return [...scansById.values()].sort(
            (left, right) => Date.parse(right.recorded_at) - Date.parse(left.recorded_at),
          );
        });
        setScanPages(data.totalPages);
        setScanTotal(data.totalItems);
        setError("");
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load scan history.");
      }
    };
    void loadScans();
    const timer = window.setInterval(() => void loadScans(), 5000);
    window.addEventListener("fieldnotes-camera-scan", loadScans);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("fieldnotes-camera-scan", loadScans);
    };
  }, []);

  const loadOlderScans = async () => {
    if (loadingOlder || scanPage >= scanPages) return;
    setLoadingOlder(true);
    try {
      const nextPage = scanPage + 1;
      const response = await fetch(`/api/roboflow/scans?page=${nextPage}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load older scan history.");
      const data = await response.json() as { scans: CameraScan[]; page: number; totalPages: number };
      setCameraScans((current) => {
        const scansById = new Map(current.map((scan) => [scan.id, scan]));
        data.scans.forEach((scan) => scansById.set(scan.id, scan));
        return [...scansById.values()].sort(
          (left, right) => Date.parse(right.recorded_at) - Date.parse(left.recorded_at),
        );
      });
      setScanPage(data.page);
      setScanPages(data.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load older scan history.");
    } finally {
      setLoadingOlder(false);
    }
  };

  const groups = useMemo<ChartGroup[]>(() => {
    const sensorGroup = (key: string, title: string, color: string, values: number[], empty: string, unit: string): ChartGroup => ({
      key, title, color, values, labels: [], empty, unit,
    });
    const confidence = [...cameraScans].reverse().map((scan) => {
      const predictions = scan.results.flatMap((result) => result.predictions.map((prediction) => prediction.confidence));
      return predictions.length
        ? Math.max(...predictions) * 100
        : 0;
    });
    return [
      sensorGroup("temperature", "Temperature", "#63d5a0", readings.flatMap((reading) => reading.temperature_c === null ? [] : [reading.temperature_c]), "No temperature readings yet.", "°C"),
      sensorGroup("smoke", "Smoke / MQ signal", "#f0bf8c", readings.flatMap((reading) => reading.mq_raw === null ? [] : [reading.mq_raw]), "No smoke readings yet.", "ADC"),
      sensorGroup("distance", "Distance", "#a6b8ff", readings.flatMap((reading) => reading.distance_cm === null ? [] : [reading.distance_cm]), "No distance readings yet.", "cm"),
      sensorGroup("scans", "Scanning, predictions, and uploads", "#c8b3ff", confidence, "No scan or upload history yet.", "% confidence"),
    ];
  }, [readings, cameraScans]);

  const downloadReport = () => {
    const rows = [
      ["type", "timestamp", "temperature_c", "smoke_mq_raw", "distance_cm", "signal_status", "scan_mode", "prediction", "confidence"],
      ...readings.map((reading) => ["sensor", reading.recorded_at, reading.temperature_c ?? "", reading.mq_raw ?? "", reading.distance_cm ?? "", reading.signal_status, "", "", ""]),
      ...cameraScans.flatMap((scan) => scan.results.flatMap((result) => result.predictions.map((prediction) => ["scan", scan.recorded_at, "", "", "", scan.inference_status, scan.mode, prediction.class, (prediction.confidence * 100).toFixed(2)]))),
    ];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `fieldnotes-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="charts-dashboard" aria-live="polite">
      <div className="charts-toolbar">
        <p>Four chart types for each data group: line, bar, area, and donut.</p>
        <button className="charts-download" type="button" onClick={downloadReport}>Download CSV report</button>
      </div>
      {error && <p className="iot-error" role="alert">{error}</p>}
      <div className="charts-grid">
        {groups.flatMap((group) => (["line", "bar", "area", "donut"] as const).map((variant) => (
          <ChartFrame key={`${group.key}-${variant}`} title={`${group.title} · ${variant}`} type={`${variant} chart`} note={`${group.values.length} data points`}>
            <ValuesChart group={group} variant={variant} />
          </ChartFrame>
        )))}
      </div>
      <section className="camera-history" aria-labelledby="camera-history-title">
        <div className="camera-history-heading">
          <div>
            <p className="section-kicker">PERSISTED IN POCKETBASE</p>
            <h2 id="camera-history-title">Scan and upload history</h2>
          </div>
          <span>{scanTotal} {scanTotal === 1 ? "scan" : "scans"}</span>
        </div>
        {cameraScans.length === 0 ? (
          <EmptyChart message="No saved scans yet. Scan with a camera or upload an image to create history." />
        ) : (
          <div className="camera-history-grid">
            {cameraScans.slice(0, 12).map((scan) => {
              const predictions = scan.results.flatMap((result) =>
                result.predictions.slice(0, 1).map((prediction) => `${prediction.class} · ${(prediction.confidence * 100).toFixed(1)}%`),
              );
              const source = scan.mode === "raspberry-pi"
                ? "Raspberry Pi"
                : scan.mode === "camera"
                  ? "Browser camera"
                  : "Image upload";
              return (
                <article className="camera-history-card" key={scan.id}>
                  <a className="camera-history-image" href={`${scan.imageUrl}?full=1`} target="_blank" rel="noreferrer">
                    <Image src={scan.imageUrl} alt={`Saved ${source.toLowerCase()} scan`} fill sizes="(max-width: 760px) 100vw, 25vw" />
                  </a>
                  <div className="camera-history-copy">
                    <div><strong>{source}</strong><time dateTime={scan.recorded_at}>{new Date(scan.recorded_at).toLocaleString()}</time></div>
                    <span className={`camera-history-status camera-history-${scan.inference_status}`}>{scan.inference_status}</span>
                    <p>{predictions.length ? predictions.join(" · ") : "No predictions returned"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {scanPage < scanPages && (
          <button className="charts-download camera-history-more" disabled={loadingOlder} onClick={() => void loadOlderScans()} type="button">
            {loadingOlder ? "Loading…" : "Load older scans"}
          </button>
        )}
      </section>
      <p className="camera-chart-help">Camera, Raspberry Pi, and uploaded-image scans are saved with their photos and predictions. Use the <Link href="/sample-system">scanner</Link> to add more. Scan history is retained in PocketBase.</p>
    </section>
  );
}
