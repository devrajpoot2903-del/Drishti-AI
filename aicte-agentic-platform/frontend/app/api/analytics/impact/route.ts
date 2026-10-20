import { NextResponse } from "next/server";
import { getImpactMetrics } from "@/lib/store";

export async function GET() {
  try {
    const metrics = getImpactMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    return new NextResponse("Unable to calculate impact metrics.", {
      status: 500,
    });
  }
}
