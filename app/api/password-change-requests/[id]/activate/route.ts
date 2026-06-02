import { NextResponse, type NextRequest } from "next/server";

const ACCESS_TOKEN_COOKIE = "pms_access_token";

function backendBaseUrl() {
  return (process.env.BACKEND_URL || "http://127.0.0.1:4000").replace(/\/$/, "");
}

function accessCookieOptions(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.max(1, maxAgeSeconds ?? 3600),
  };
}

type ActivationResponse = {
  success?: boolean;
  message?: string;
  access_token?: string;
  expires_in?: number;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = await request.text();
  const upstream = await fetch(
    `${backendBaseUrl()}/api/password-change-requests/${encodeURIComponent(id)}/activate`,
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
  let payload: ActivationResponse | Record<string, unknown> = {};

  if (text.trim()) {
    try {
      payload = JSON.parse(text) as ActivationResponse;
    } catch {
      return new NextResponse(text, { status: upstream.status });
    }
  }

  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const activation = payload as ActivationResponse;
  const response = NextResponse.json({
    success: activation.success ?? true,
    message: activation.message || "Password saved successfully.",
  });

  if (activation.access_token) {
    response.cookies.set(
      ACCESS_TOKEN_COOKIE,
      activation.access_token,
      accessCookieOptions(activation.expires_in),
    );
  }

  return response;
}
