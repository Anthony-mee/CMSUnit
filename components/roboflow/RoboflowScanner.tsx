"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

type ScannerMode = "raspberry-pi" | "camera" | "upload";
type Prediction = {
  class: string;
  confidence: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
};
type Measurements = { capsaicin: number | null; scoville: number | null };
type ModelResult = {
  modelId: string;
  label: string;
  kind: string;
  predictions: Prediction[];
  measurements: Measurements;
  error?: string;
};
type HeatEstimate = {
  capsaicinMgPerKg: number;
  scoville: number;
  maturityFactor: number;
  stressProxy: number;
  areaCm2: number;
  rangeMin: number;
  rangeMax: number;
};

const publishedHeatRanges: Record<string, { min: number; max: number }> = {
  "siling-labuyo": { min: 80_000, max: 100_000 },
  "siling-haba": { min: 30_000, max: 50_000 },
  "siling-demonyo": { min: 100_000, max: 225_000 },
};

function getPredictionDimensions(predictions: Prediction[]) {
  return predictions.reduce(
    (largest, item) => ({
      width: Math.max(
        largest.width,
        item.width ?? (item.points?.length
          ? Math.max(...item.points.map((point) => point.x)) -
            Math.min(...item.points.map((point) => point.x))
          : 0),
      ),
      height: Math.max(
        largest.height,
        item.height ?? (item.points?.length
          ? Math.max(...item.points.map((point) => point.y)) -
            Math.min(...item.points.map((point) => point.y))
          : 0),
      ),
    }),
    { width: 0, height: 0 },
  );
}

const modes: { id: ScannerMode; label: string; number: string; icon: string }[] = [
  { id: "raspberry-pi", label: "Raspberry Pi", number: "01", icon: "⌁" },
  { id: "camera", label: "Live camera", number: "02", icon: "◎" },
  { id: "upload", label: "Upload image", number: "03", icon: "↑" },
];

export default function RoboflowScanner({
  configured,
}: {
  configured: boolean;
}) {
  const [mode, setMode] = useState<ScannerMode>("camera");
  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [modelResults, setModelResults] = useState<ModelResult[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [lastScanned, setLastScanned] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inFlightRef = useRef(false);
  const centimetersPerPixel = 0.0265;
  const heatEstimate = (() => {
    const classification = modelResults.find((result) => result.modelId === "chili-classification");
    const segmentation = modelResults.find((result) => result.modelId === "chili-segmentation");
    const maturity = modelResults.find((result) => result.modelId === "chili-maturity-classifier");
    const classificationPrediction = classification?.predictions[0];
    const segmentationPrediction = segmentation?.predictions[0];
    const maturityPrediction = maturity?.predictions[0];
    if (!classificationPrediction || !segmentationPrediction || !maturityPrediction) return null;
    const heatRange = publishedHeatRanges[classificationPrediction.class.toLowerCase()];
    if (!heatRange) return null;

    const dimensions = getPredictionDimensions(segmentation.predictions);
    const areaCm2 = dimensions.width * centimetersPerPixel * dimensions.height * centimetersPerPixel;
    if (areaCm2 <= 0) return null;

    const maturityLabel = maturityPrediction.class.toLowerCase();
    const maturityFactor = maturityLabel.includes("red") || maturityLabel.includes("mature")
      ? 1
      : maturityLabel.includes("develop") || maturityLabel.includes("turn")
        ? 0.5
        : 0;
    const stressProxy = Math.min(1, Math.max(0, segmentationPrediction.confidence));
    const sizeFactor = Math.min(1, Math.max(0, areaCm2 / 4));
    const rangePosition = Math.min(
      1,
      Math.max(0, maturityFactor * 0.7 + stressProxy * 0.2 + sizeFactor * 0.1),
    );
    const scoville = Math.round(
      heatRange.min + (heatRange.max - heatRange.min) * rangePosition,
    );

    return {
      capsaicinMgPerKg: Number((scoville / 16).toFixed(1)),
      scoville,
      maturityFactor,
      stressProxy,
      areaCm2,
      rangeMin: heatRange.min,
      rangeMax: heatRange.max,
    } satisfies HeatEstimate;
  })();
  const heatClass =
    modelResults.find((result) => result.modelId === "chili-classification")?.predictions[0]?.class;

  const classify = useCallback(async (image: Blob, fileName = "camera-capture.jpg") => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setBusy(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", image, fileName);
      formData.append("mode", mode);
      const response = await fetch("/api/roboflow/predict", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as {
        error?: string;
        results?: ModelResult[];
        scan?: { id: string; recorded_at: string };
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Could not classify this image.");
      }
      if (!result.scan) {
        throw new Error("The scan completed but no history record was returned.");
      }

      setModelResults(result.results ?? []);
      window.dispatchEvent(new Event("fieldnotes-camera-scan"));
      setLastScanned(new Date(result.scan.recorded_at).toLocaleTimeString());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not classify this image.");
    } finally {
      inFlightRef.current = false;
      setBusy(false);
    }
  }, [mode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (!cameraActive || mode !== "camera") return;

    const timer = window.setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        setError("Your browser could not prepare a camera frame.");
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) void classify(blob);
      }, "image/jpeg", 0.85);
    }, 2500);

    return () => window.clearInterval(timer);
  }, [cameraActive, classify, mode]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function startCamera() {
    setError("");
    setModelResults([]);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not available. Use HTTPS or localhost and check browser permissions.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start the camera.");
    }
  }

  function chooseMode(nextMode: ScannerMode) {
    if (nextMode !== "camera") stopCamera();
    setError("");
    setMode(nextMode);
    setModelResults([]);
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setModelResults([]);
    await classify(file, file.name);
  }

  return (
    <section className="scanner-panel" aria-labelledby="scanner-title">
      <div className="scanner-heading">
        <div className="scanner-title-wrap">
          <span className="scanner-brand-mark" aria-hidden="true">✳</span>
          <div className="scanner-title-copy">
            <p className="section-kicker">FIELDNOTES · VISION LAB</p>
            <h2 id="scanner-title">Chili scanner</h2>
          </div>
        </div>
        <div className="scanner-heading-meta">
          <span className="scanner-model-chip">ALL MODELS</span>
          <span className={`scanner-status ${cameraActive ? "scanner-status-live" : ""}`}>
            <i /> {cameraActive ? "SCANNING" : busy ? "ANALYZING" : "STANDBY"}
          </span>
        </div>
      </div>

      <div className="scanner-tabs" role="group" aria-label="Choose image source">
        {modes.map((item) => (
          <button
            aria-pressed={mode === item.id}
            className={mode === item.id ? "scanner-tab scanner-tab-active" : "scanner-tab"}
            key={item.id}
            onClick={() => chooseMode(item.id)}
            type="button"
          >
            <span className="scanner-tab-number" aria-hidden="true">{item.number}</span>
            <span className="scanner-tab-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <div className="scanner-workspace">
        <div className="scanner-view">
          <div className="scanner-stage-topline">
            <span>INPUT STAGE <b>01</b></span>
            <span>RGB <i /> AUTO EXPOSURE</span>
          </div>
          {mode === "raspberry-pi" ? (
            <div className="scanner-pi-instructions">
              <span className="scanner-device-icon" aria-hidden="true">⌁</span>
              <h3>Scan with your Raspberry Pi camera</h3>
              <p>
                Copy <code>scripts/raspi_chili_classifier.py</code> to the Pi.
                Install the camera dependencies and point it at the public
                application API. Each capture is analyzed by the server and
                saved in PocketBase history.
              </p>
              <pre><code>sudo apt update{"\n"}sudo apt install -y python3-picamera2 python3-venv{"\n"}python3 -m venv --system-site-packages .venv{"\n"}source .venv/bin/activate{"\n"}export FIELDNOTES_API_URL=&quot;https://app.example.com/api/roboflow/predict&quot;{"\n"}export IOT_DEVICE_KEY=&quot;your-server-device-key&quot;{"\n"}python scripts/raspi_chili_classifier.py</code></pre>
              <p className="scanner-small-note">
                Set <code>FIELDNOTES_API_URL</code> to the public
                <code> /api/roboflow/predict</code> HTTPS address and
                <code> IOT_DEVICE_KEY</code> to the server&apos;s device key.
                Keep the Roboflow key on the app server.
              </p>
            </div>
          ) : mode === "camera" ? (
            <div className="scanner-camera-frame">
              <video aria-label="Camera preview" className={cameraActive ? "" : "scanner-video-hidden"} muted playsInline ref={videoRef} />
              {cameraActive && (
                <div className="scanner-view-label">
                  <span><i /> LIVE CAMERA</span>
                  <span>ALL MODELS · COMBINED SCAN</span>
                </div>
              )}
              {!cameraActive && (
                <div className="scanner-camera-placeholder">
                  <span className="scanner-device-icon" aria-hidden="true">⌾</span>
                  <span className="scanner-preview-kicker">CAMERA INPUT</span>
                  <h3>Ready when you are.</h3>
                  <p>Center a chili pepper in the frame and start a live scan.</p>
                  <span className="scanner-camera-hint">Phone access requires HTTPS. On this computer, localhost is supported.</span>
                  <button className="scanner-action" onClick={() => void startCamera()} type="button">
                    <span aria-hidden="true">◉</span> Start live scan
                  </button>
                </div>
              )}
              {cameraActive && (
                <>
                  <span className="scanner-target" aria-hidden="true" />
                  <span className="scanner-focus-hint">CENTER SUBJECT IN FRAME</span>
                </>
              )}
              <canvas className="scanner-canvas" ref={canvasRef} />
            </div>
          ) : (
            <div className="scanner-upload-area">
              {previewUrl ? (
                <Image
                  alt="Selected chili for classification"
                  height={800}
                  src={previewUrl}
                  unoptimized
                  width={1200}
                />
              ) : (
                <>
                  <span className="scanner-device-icon" aria-hidden="true">↑</span>
                  <p>Choose a chili image to classify</p>
                  <span>JPEG, PNG, or WebP · up to 8 MB</span>
                </>
              )}
              <label className="scanner-action scanner-upload-button">
                Choose image
                <input accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => void handleUpload(event)} type="file" />
              </label>
            </div>
          )}
        </div>

        <aside className="scanner-result" aria-live="polite">
          <p className="section-kicker">PREDICTION</p>
          {modelResults.length === 0 ? (
            <p className="scanner-empty-result">
              {busy ? "Analyzing image…" : "A prediction will appear here after a scan."}
            </p>
          ) : modelResults.map((result) => {
            const prediction = result.predictions[0];
            const dimensions = getPredictionDimensions(result.predictions);
            return (
              <div className="scanner-model-result" key={result.modelId}>
                <div className="scanner-model-result-heading">
                  <span>{result.label}</span>
                  <small>{result.kind}</small>
                </div>
                {result.error ? (
                  <p className="scanner-model-error">{result.error}</p>
                ) : prediction ? (
                  <>
                    <strong className="scanner-prediction">{prediction.class}</strong>
                    <span className="scanner-confidence">{(prediction.confidence * 100).toFixed(1)}% confidence</span>
                    {result.predictions.length > 1 && (
                      <ul className="scanner-alternatives">
                        {result.predictions.slice(1, 4).map((item) => (
                          <li key={item.class}>
                            <span>{item.class}</span>
                            <span>{(item.confidence * 100).toFixed(1)}%</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {result.kind === "Segmentation" && (
                      <div className="scanner-measurements">
                        <div><span>Length</span><strong>{dimensions.height ? `${dimensions.height.toFixed(0)} px` : "Not detected"}</strong></div>
                        <div><span>Width</span><strong>{dimensions.width ? `${dimensions.width.toFixed(0)} px` : "Not detected"}</strong></div>
                        <div><span>Length (cm)</span><strong>{dimensions.height ? `${(dimensions.height * centimetersPerPixel).toFixed(2)} cm` : "Not detected"}</strong></div>
                        <div><span>Width (cm)</span><strong>{dimensions.width ? `${(dimensions.width * centimetersPerPixel).toFixed(2)} cm` : "Not detected"}</strong></div>
                      </div>
                    )}
                    {result.modelId === "chili-maturity-classifier" && (
                      <div className="scanner-measurements">
                        <div><span>Maturity stage</span><strong>{prediction.class}</strong></div>
                      </div>
                    )}
                    {result.modelId === "chili-classification" && (
                      <div className="scanner-measurements">
                        <div>
                          <span>Capsaicin</span>
                          <strong>
                            {heatEstimate
                              ? `${heatEstimate.capsaicinMgPerKg} mg/kg`
                              : result.measurements.capsaicin === null
                                ? "Not returned"
                                : `${result.measurements.capsaicin} mg/kg`}
                          </strong>
                        </div>
                        <div>
                          <span>Scoville</span>
                          <strong>
                            {heatEstimate
                              ? `${heatEstimate.scoville.toLocaleString()} SHU`
                              : result.measurements.scoville === null
                                ? "Not returned"
                                : `${result.measurements.scoville.toLocaleString()} SHU`}
                          </strong>
                        </div>
                        {heatEstimate && (
                          <small className="scanner-estimate-note">
                            Experimental estimate from maturity, pod size, and visual stress.
                          </small>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="scanner-empty-result">
                    No detection returned. Check that this model version is deployed
                    and trained for this image type.
                  </p>
                )}
              </div>
            );
          })}
          {lastScanned && modelResults.length > 0 && <small>Last scan · {lastScanned}</small>}
          {heatEstimate && (
            <div className="scanner-heat-estimate">
              <p className="section-kicker">EXPERIMENTAL HEAT ESTIMATE</p>
              <div><span>Capsaicin</span><strong>{heatEstimate.capsaicinMgPerKg} mg/kg</strong></div>
              <div><span>Scoville heat index</span><strong>{heatEstimate.scoville.toLocaleString()} SHU</strong></div>
              <small>
                Based on the {heatClass} reference range
                ({heatEstimate.rangeMin.toLocaleString()}–{heatEstimate.rangeMax.toLocaleString()} SHU),
                {heatEstimate.areaCm2.toFixed(2)} cm² pod area, maturity factor
                {(heatEstimate.maturityFactor * 100).toFixed(0)}%, and visual stress
                proxy {(heatEstimate.stressProxy * 100).toFixed(0)}%.
                This is not a laboratory measurement.
              </small>
            </div>
          )}
          {busy && <span className="scanner-spinner" aria-label="Analyzing" />}
          {error && <p className="scanner-error" role="alert">{error}</p>}
          {cameraActive && (
            <button className="scanner-stop" onClick={stopCamera} type="button">Stop scanning</button>
          )}
        </aside>
      </div>
      <div className="scanner-spec-strip" aria-label="Scanner details">
        <div><span>MODE</span><strong>All models · one scan</strong></div>
        <div><span>RESULTS</span><strong>Classification · segmentation · maturity</strong></div>
        <div><span>INPUT</span><strong>Camera · Raspberry Pi · Image</strong></div>
      </div>
      <p className="scanner-disclaimer">
        Images are sent to this app’s server for Roboflow inference. The Roboflow
        API key stays server-side. Camera scanning sends a frame about every 2.5 seconds.
      </p>
      {!configured && (
        <p className="scanner-configuration-note">
          To enable predictions, add <code>ROBOFLOW_API_KEY</code> to the project&apos;s
          <code> .env.local</code> file, then restart the Next.js server.
        </p>
      )}
    </section>
  );
}
