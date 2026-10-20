import { NextRequest, NextResponse } from "next/server";
import { getFindingEvidence } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidence = getFindingEvidence(id);
    if (!evidence) {
      return NextResponse.json(
        { message: "Evidence is not available for this finding." },
        { status: 404 }
      );
    }
    return NextResponse.json(evidence);
  } catch (error) {
    return new NextResponse("Unable to fetch evidence.", { status: 500 });
  }
}
