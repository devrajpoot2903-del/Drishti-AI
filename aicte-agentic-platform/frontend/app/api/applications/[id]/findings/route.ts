import { NextRequest, NextResponse } from "next/server";
import { getApplicationFindings } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const findings = getApplicationFindings(id);
    return NextResponse.json(findings);
  } catch (error) {
    return new NextResponse("Unable to fetch findings.", { status: 500 });
  }
}
