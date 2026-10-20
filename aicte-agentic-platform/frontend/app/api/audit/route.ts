import { NextResponse } from "next/server";
import { getAuditEvents } from "@/lib/store";

export async function GET() {
  try {
    const events = getAuditEvents();
    return NextResponse.json(events);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}
