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

    const gatewayRes = await fetch(`${GATEWAY_URL}/api/applications/${id}/executions`, {
      headers,
      cache: "no-store",
    });

    if (!gatewayRes.ok) {
      // Fallback: check workflow endpoint
      const workflowRes = await fetch(`${GATEWAY_URL}/api/workflow/agents?appId=${id}`, {
        headers,
        cache: "no-store",
      });
      if (workflowRes.ok) {
        const wfData = await workflowRes.json();
        return NextResponse.json({ executions: wfData.executions || [] });
      }

      return new NextResponse("Unable to load executions from gateway", {
        status: gatewayRes.status,
      });
    }

    const data = await gatewayRes.json();
    return NextResponse.json(data);
  } catch (error) {
    return new NextResponse("Internal execution proxy error", { status: 500 });
  }
}
