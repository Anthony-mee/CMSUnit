import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export const runtime = "nodejs";

function client() {
  return new PocketBase(process.env.POCKETBASE_URL || "http://127.0.0.1:8090");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;

  try {
    const records = await client().collection("camera_scans").getList(page, 50, {
      sort: "-recorded_at",
    });

    return NextResponse.json({
      scans: records.items.map((record) => ({
        id: record.id,
        device_id: record.device_id,
        mode: record.mode,
        inference_status: record.inference_status,
        recorded_at: record.recorded_at,
        results: record.results,
        imageUrl: `/api/roboflow/scans/${encodeURIComponent(record.id)}/image`,
      })),
      page: records.page,
      totalPages: records.totalPages,
      totalItems: records.totalItems,
    });
  } catch (error) {
    console.error("Could not load camera scan history", error);
    return NextResponse.json({ error: "Could not load camera scan history." }, { status: 503 });
  }
}
