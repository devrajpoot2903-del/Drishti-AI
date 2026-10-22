import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/applications/${id}/ocr`, {
      headers,
      cache: "no-store",
    });

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text().catch(() => "");
      return new NextResponse(errText || "Unable to load OCR results from gateway", {
        status: gatewayRes.status,
      });
    }

    const data = await gatewayRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(`Internal OCR proxy error: ${error.message}`, { status: 500 });
  }
}
