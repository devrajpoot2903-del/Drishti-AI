import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/applications/${id}/report`, {
      headers,
      cache: "no-store",
    });

    if (!gatewayRes.ok) {
      const errText = await gatewayRes.text().catch(() => "");
      return new NextResponse(errText || "Unable to download report from gateway", {
        status: gatewayRes.status,
      });
    }

    const blob = await gatewayRes.arrayBuffer();
    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="drishti-report-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    return new NextResponse(`Internal report proxy error: ${error.message}`, { status: 500 });
  }
}
