import { NextResponse, type NextRequest } from "next/server";

function backendBaseUrl() {
  return (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const upstream = await fetch(
      `${backendBaseUrl()}/api/auth/complete-onboarding`,
      {
        method: "POST",
        headers: {
          "Content-Type": request.headers.get("content-type") || "application/json",
          Cookie: request.headers.get("cookie") || "",
        },
        body,
        cache: "no-store",
      },
    );

    const text = await upstream.text();
    let payload: Record<string, unknown> = {};

    if (text.trim()) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return new NextResponse(text, {
          status: upstream.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect to backend service";
    return NextResponse.json({ message }, { status: 500 });
  }
}
