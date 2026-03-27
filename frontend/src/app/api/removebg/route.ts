import { NextRequest, NextResponse } from "next/server";

const REMOVE_BG_API_URL = "https://api.remove.bg/v1.0/removebg";
const API_KEY = "yTrC87kL8SBydhFh18wnCokb";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image_file") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Build multipart form manually to avoid form-data type issues
    const boundary = `----FormBoundary${Math.random().toString(36).substring(2)}`;
    
    const header = `--${boundary}\r\nContent-Type: ${imageFile.type || "image/png"}\r\nContent-Disposition: form-data; name="image_file"; filename="${imageFile.name || "image.png"}"\r\n\r\n`;
    const footer = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="size"\r\n\r\nauto\r\n--${boundary}\r\nContent-Disposition: form-data; name="format"\r\n\r\npng\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(header, "utf-8"),
      imageBuffer,
      Buffer.from(footer, "utf-8"),
    ]);

    const rbResponse = await fetch(REMOVE_BG_API_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": API_KEY,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
    } as any);

    if (!rbResponse.ok) {
      const errorText = await rbResponse.text();
      console.error("Remove.bg API Error:", rbResponse.status, errorText);
      return NextResponse.json(
        { error: "Failed to process image", details: errorText },
        { status: rbResponse.status }
      );
    }

    const resultBuffer = await rbResponse.arrayBuffer();

    return new NextResponse(resultBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(resultBuffer.byteLength),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
