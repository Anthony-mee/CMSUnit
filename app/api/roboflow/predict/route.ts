import { NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { getRoboflowModel, roboflowModels } from "@/lib/roboflow-models";

export const runtime = "nodejs";

const maxImageSize = 8 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type RoboflowPrediction = {
  class?: string;
  confidence?: number;
  width?: number;
  height?: number;
  points?: Array<{ x?: number; y?: number }>;
};

type RoboflowResponse = {
  predictions?: RoboflowPrediction[];
  capsaicin?: number;
  capsaicin_content?: number;
  scoville?: number;
  scoville_heat_index?: number;
};

type InferenceResult = {
  modelId: string;
  label: string;
  kind: string;
  predictions: ReturnType<typeof normalizePredictions>;
  measurements: { capsaicin: number | null; scoville: number | null };
  error?: string;
};

const requestCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(request: Request) {
  const now = Date.now();
  for (const [address, entry] of requestCounts) {
    if (entry.resetAt <= now) requestCounts.delete(address);
  }

  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "local";
  const entry = requestCounts.get(address);
  if (entry && entry.count >= 30) return true;

  requestCounts.set(
    address,
    entry ? { ...entry, count: entry.count + 1 } : { count: 1, resetAt: now + 60_000 },
  );
  return false;
}

function normalizePredictions(result: RoboflowResponse) {
  return Array.isArray(result.predictions)
    ? result.predictions
        .filter((prediction) => typeof prediction.class === "string")
        .map((prediction) => ({
          class: prediction.class ?? "unknown",
          confidence:
            typeof prediction.confidence === "number" &&
            Number.isFinite(prediction.confidence)
              ? prediction.confidence
              : 0,
          width:
            typeof prediction.width === "number" && Number.isFinite(prediction.width)
              ? prediction.width
              : undefined,
          height:
            typeof prediction.height === "number" && Number.isFinite(prediction.height)
              ? prediction.height
              : undefined,
          points: Array.isArray(prediction.points)
            ? prediction.points.filter(
                (point) =>
                  typeof point.x === "number" &&
                  Number.isFinite(point.x) &&
                  typeof point.y === "number" &&
                  Number.isFinite(point.y),
              )
            : undefined,
        }))
        .sort((left, right) => right.confidence - left.confidence)
    : [];
}

async function inferModel(
  apiKey: string,
  imageBase64: string,
  definition: (typeof roboflowModels)[number],
): Promise<InferenceResult> {
  const model = getRoboflowModel(definition.id);
  const baseResult = {
    modelId: model.id,
    label: model.label,
    kind: model.kind,
    predictions: [] as ReturnType<typeof normalizePredictions>,
    measurements: { capsaicin: null as number | null, scoville: null as number | null },
  };

  if (!model.configured) {
    return { ...baseResult, error: `Set ${model.envName} to a versioned model ID.` };
  }
  if (!apiKey) {
    return { ...baseResult, error: "Roboflow inference is not configured on this server." };
  }

  const endpoint = new URL(
    `https://serverless.roboflow.com/${model.modelId
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`,
  );

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: imageBase64,
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    if (!upstream.ok) {
      return { ...baseResult, error: `Roboflow returned HTTP ${upstream.status}.` };
    }

    const result = await upstream.json() as RoboflowResponse;
    const capsaicin = result.capsaicin ?? result.capsaicin_content;
    const scoville = result.scoville ?? result.scoville_heat_index;

    return {
      ...baseResult,
      predictions: normalizePredictions(result),
      measurements: {
        capsaicin:
          typeof capsaicin === "number" && Number.isFinite(capsaicin) ? capsaicin : null,
        scoville:
          typeof scoville === "number" && Number.isFinite(scoville) ? scoville : null,
      },
    };
  } catch (caught) {
    return {
      ...baseResult,
      error: caught instanceof Error ? caught.message : "Model inference failed.",
    };
  }
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      { error: "Too many scans. Wait a minute before scanning again." },
      { status: 429 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded image." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Choose an image to scan." }, { status: 400 });
  }
  if (!allowedImageTypes.has(image.type)) {
    return NextResponse.json({ error: "Use a JPEG, PNG, or WebP image." }, { status: 415 });
  }
  if (image.size === 0 || image.size > maxImageSize) {
    return NextResponse.json({ error: "The image must be smaller than 8 MB." }, { status: 413 });
  }

  const mode = formData.get("mode");
  if (mode !== "raspberry-pi" && mode !== "camera" && mode !== "upload") {
    return NextResponse.json({ error: "Choose a valid scan source." }, { status: 400 });
  }
  if (mode === "raspberry-pi") {
    const deviceKey = process.env.IOT_DEVICE_KEY;
    if (!deviceKey || request.headers.get("x-device-key") !== deviceKey) {
      return NextResponse.json({ error: "Invalid or missing Raspberry Pi device key." }, { status: 401 });
    }
  }

  const imageBase64 = Buffer.from(await image.arrayBuffer()).toString("base64");
  const apiKey = process.env.ROBOFLOW_API_KEY ?? "";
  const results = await Promise.all(
    roboflowModels.map((definition) => inferModel(apiKey, imageBase64, definition)),
  );

  const inferenceStatus = results.every((result) => result.error)
    ? "unavailable"
    : results.some((result) => result.error)
      ? "partial"
      : "complete";
  const recordedAt = new Date().toISOString();
  const deviceId = mode === "raspberry-pi" ? "raspberry-pi-camera" : `web-${mode}`;

  try {
    const pocketbase = new PocketBase(process.env.POCKETBASE_URL || "http://127.0.0.1:8090");
    const scan = await pocketbase.collection("camera_scans").create({
      device_id: deviceId,
      mode,
      image,
      results,
      inference_status: inferenceStatus,
      recorded_at: recordedAt,
    });

    return NextResponse.json({
      results,
      scan: {
        id: scan.id,
        mode: scan.mode,
        inference_status: scan.inference_status,
        recorded_at: scan.recorded_at,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Could not save camera scan history", error);
    return NextResponse.json({ error: "The scan ran, but its history could not be saved." }, { status: 503 });
  }
}
