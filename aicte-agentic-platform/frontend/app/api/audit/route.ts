import { NextRequest, NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/store";

export async function GET(request: NextRequest) {
  try {
    let events = getAuditEvents();
    const { searchParams } = new URL(request.url);
    const targetAppId = searchParams.get("applicationId") || searchParams.get("appId");
    if (targetAppId) {
      events = events.filter((e) => e.appId === targetAppId);
    }
    return NextResponse.json(events);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}
