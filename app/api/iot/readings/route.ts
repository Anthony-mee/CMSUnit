import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

const pocketbaseUrl = process.env.POCKETBASE_URL || "http://127.0.0.1:8090";

function client() {
  return new PocketBase(pocketbaseUrl);
}

export async function GET() {
  try {
    const readings = await client().collection("sensor_readings").getList(1, 25, {
      sort: "-recorded_at",
    });
    const normalizedReadings = readings.items.map((reading) => ({
      ...reading,
      temperature_c: reading.signal_status === "partial" && reading.distance_cm !== null
        ? null
        : reading.temperature_c,
    }));
    return NextResponse.json({ readings: normalizedReadings });
  } catch (error) {
    console.error("Could not load sensor readings", error);
    return NextResponse.json({ error: "Could not load sensor readings." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const configuredKey = process.env.IOT_DEVICE_KEY;
  if (configuredKey && request.headers.get("x-device-key") !== configuredKey) {
    return NextResponse.json({ error: "Invalid device key." }, { status: 401 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    const deviceId = typeof body.device_id === "string" ? body.device_id.trim() : "";
    if (!deviceId || deviceId.length > 100) {
      return NextResponse.json({ error: "device_id is required." }, { status: 400 });
    }

    const numberOrNull = (value: unknown) =>
      typeof value === "number" && Number.isFinite(value) ? value : null;
    const temperature = numberOrNull(body.temperature_c);
    const mqRaw = numberOrNull(body.mq_raw);
    const distance = numberOrNull(body.distance_cm);
    if (temperature !== null && (temperature < -55 || temperature > 125)) {
      return NextResponse.json({ error: "temperature_c is out of range." }, { status: 400 });
    }
    if (distance !== null && (distance < 0 || distance > 1000)) {
      return NextResponse.json({ error: "distance_cm is out of range." }, { status: 400 });
    }

    const recordedAt = typeof body.recorded_at === "string" && !Number.isNaN(Date.parse(body.recorded_at))
      ? body.recorded_at
      : new Date().toISOString();
    const signalStatus = temperature === null || distance === null ? "partial" : "ok";
    const record = await client().collection("sensor_readings").create({
      device_id: deviceId,
      temperature_c: temperature,
      mq_raw: mqRaw,
      distance_cm: distance,
      signal_status: signalStatus,
      recorded_at: recordedAt,
    });
    return NextResponse.json({ accepted: true, reading: record }, { status: 201 });
  } catch (error) {
    console.error("Could not save sensor reading", error);
    return NextResponse.json({ error: "Could not save sensor reading." }, { status: 400 });
  }
}
