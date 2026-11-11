import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const fullImage = new URL(request.url).searchParams.get("full") === "1";
  const pocketbase = new PocketBase(process.env.POCKETBASE_URL || "http://127.0.0.1:8090");

  try {
    const record = await pocketbase.collection("camera_scans").getOne(id);
    if (typeof record.image !== "string" || !record.image) {
      return NextResponse.json({ error: "Scan image not found." }, { status: 404 });
    }

    const fileUrl = pocketbase.files.getURL(
      record,
      record.image,
      fullImage ? {} : { thumb: "480x320f" },
    );
    const imageResponse = await fetch(fileUrl, { cache: "no-store" });
    if (!imageResponse.ok || !imageResponse.body) {
      console.error("Could not read stored camera scan image", imageResponse.status);
      return NextResponse.json({ error: "Could not load scan image." }, { status: 502 });
    }

    return new NextResponse(imageResponse.body, {
      headers: {
        "Content-Type": imageResponse.headers.get("content-type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Could not load stored camera scan image", error);
    return NextResponse.json({ error: "Could not load scan image." }, { status: 404 });
  }
}
