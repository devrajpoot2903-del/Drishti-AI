import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/store";

export async function GET() {
  try {
    const stats = getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}
