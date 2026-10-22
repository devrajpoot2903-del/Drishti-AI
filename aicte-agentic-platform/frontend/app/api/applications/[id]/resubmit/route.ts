import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    const body = await req.json();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/applications/${id}/resubmit`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text().catch(() => "");
      return new NextResponse(errText || "Unable to process resubmission in gateway", {
        status: gatewayRes.status,
      });
    }

    const data = await gatewayRes.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(`Internal resubmission proxy error: ${error.message}`, { status: 500 });
  }
}
