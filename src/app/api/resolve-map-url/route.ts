import { NextResponse } from "next/server";
import {
  getGoogleMapEmbedSrc,
  isAllowedGoogleMapsUrl,
} from "@/lib/google-maps";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get("url") ?? "";

  if (!rawUrl || !isAllowedGoogleMapsUrl(rawUrl)) {
    return NextResponse.json(
      { error: "Link Google Maps tidak valid." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(rawUrl, {
      redirect: "manual",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const location = response.headers.get("location");
    const resolvedUrl = location ? new URL(location, rawUrl).toString() : rawUrl;

    return NextResponse.json({
      embedSrc: getGoogleMapEmbedSrc(resolvedUrl),
      resolvedUrl,
    });
  } catch {
    return NextResponse.json({
      embedSrc: getGoogleMapEmbedSrc(rawUrl),
      resolvedUrl: rawUrl,
    });
  }
}
