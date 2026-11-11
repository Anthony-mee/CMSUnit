"use client";

import { useCallback, useEffect, useState } from "react";

type Reading = {
  id: string;
  device_id: string;
  temperature_c: number | null;
  mq_raw: number | null;
  distance_cm: number | null;
  signal_status: string;
  recorded_at: string;
};

function formatValue(value: number | null, unit: string) {
  return value === null || Number.isNaN(value) ? "--" : `${value.toFixed(1)}${unit}`;
}

export default function IotDashboard() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReadings = useCallback(async () => {
    try {
      const response = await fetch("/api/iot/readings", { cache: "no-store" });
      if (!response.ok) throw new Error("The sensor readings could not be loaded.");
      const data = await response.json() as { readings: Reading[] };
      setReadings(data.readings);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load readings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReadings();
    const timer = window.setInterval(() => void loadReadings(), 5000);
    return () => window.clearInterval(timer);
  }, [loadReadings]);

  const latest = readings[0];
  const age = latest ? Date.now() - new Date(latest.recorded_at).getTime() : Infinity;
  const online = Boolean(latest && age < 30000);

  return (
    <section className="iot-dashboard" aria-live="polite">
      <div className="iot-dashboard-heading">
        <div>
          <p className="section-kicker">ESP32 · DEVICE TELEMETRY</p>
          <h2>{latest?.device_id || "Waiting for ESP32"}</h2>
        </div>
        <span className={`iot-status ${online ? "iot-status-online" : ""}`}>
          <i /> {online ? "Live" : latest ? "Stale" : "No device data"}
        </span>
      </div>

      {error && <p className="iot-error" role="alert">{error}</p>}
      {!latest && !loading && (
        <div className="iot-empty">
          <strong>No sensor readings yet.</strong>
          <p>Connect the ESP32 and send a reading to <code>POST /api/iot/readings</code>. This dashboard refreshes every five seconds.</p>
        </div>
      )}

      <div className="iot-reading-grid">
        <article className="iot-reading-card iot-reading-temperature">
          <span>DS18B20</span>
          <strong>{formatValue(latest?.temperature_c ?? null, "°C")}</strong>
          <small>Temperature</small>
        </article>
        <article className="iot-reading-card iot-reading-smoke">
          <span>MQ SENSOR</span>
          <strong>{latest?.mq_raw ?? "--"}</strong>
          <small>Raw smoke/gas signal</small>
        </article>
        <article className="iot-reading-card iot-reading-distance">
          <span>HC-SR04</span>
          <strong>{formatValue(latest?.distance_cm ?? null, " cm")}</strong>
          <small>Ultrasonic distance</small>
        </article>
      </div>

      <div className="iot-dashboard-columns">
        <section className="iot-panel">
          <div className="iot-panel-heading"><h3>Recent readings</h3><span>Auto-refresh · 5 sec</span></div>
          {readings.length ? (
            <div className="iot-table-wrap">
              <table className="iot-table">
                <thead><tr><th>Time</th><th>Temperature</th><th>MQ raw</th><th>Distance</th><th>Status</th></tr></thead>
                <tbody>{readings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{new Date(reading.recorded_at).toLocaleTimeString()}</td>
                    <td>{formatValue(reading.temperature_c, "°C")}</td>
                    <td>{reading.mq_raw ?? "--"}</td>
                    <td>{formatValue(reading.distance_cm, " cm")}</td>
                    <td>{reading.signal_status}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p className="iot-panel-empty">Readings will appear here when the ESP32 starts publishing.</p>}
        </section>
        <section className="iot-panel iot-setup-panel">
          <div className="iot-panel-heading"><h3>Device setup</h3><span>ESP32</span></div>
          <p>Send JSON to the application from the ESP32:</p>
          <pre><code>{`POST /api/iot/readings
Content-Type: application/json

{
  "device_id": "esp32-sensor-01",
  "temperature_c": 28.4,
  "mq_raw": 318,
  "distance_cm": 42.7,
  "recorded_at": "2026-10-29T00:00:00Z"
}`}</code></pre>
          <h4>ESP32 pin configuration</h4>
          <div className="iot-pin-table-wrap">
            <table className="iot-table iot-pin-table">
              <thead><tr><th>Sensor</th><th>Connection</th><th>ESP32 pin</th></tr></thead>
              <tbody>
                <tr><td>DS18B20</td><td>DATA</td><td>GPIO 4</td></tr>
                <tr><td>MQ sensor</td><td>AO through voltage divider</td><td>GPIO 34</td></tr>
                <tr><td>HC-SR04</td><td>TRIG</td><td>GPIO 5 / D5</td></tr>
                <tr><td>HC-SR04</td><td>ECHO through voltage divider</td><td>GPIO 18 / D18</td></tr>
                <tr><td>All sensors</td><td>GND</td><td>ESP32 GND</td></tr>
              </tbody>
            </table>
          </div>
          <p className="iot-safety-note">Power the DS18B20 from 3V3. Power 5 V sensor modules from VIN/VU only when the USB supply is stable. Never connect a 5 V ECHO or AO signal directly to an ESP32 GPIO.</p>
<p className="iot-database-source">
  Saved database collection: <code>sensor_readings</code>
  {" · "}
  <a href="http://127.0.0.1:8090/api/collections/sensor_readings/records" target="_blank" rel="noreferrer">
    View PocketBase records ↗
  </a>
</p>
<p className="iot-safety-note">The MQ value is a relative raw indicator, not a certified smoke or gas measurement. Protect the ESP32 from 5 V sensor outputs with the correct voltage divider or level shifter.</p>
        </section>
      </div>
    </section>
  );
}
