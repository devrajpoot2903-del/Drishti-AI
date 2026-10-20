import { NextRequest, NextResponse } from "next/server";
import { approveApplication } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const updated = approveApplication(id, body.notes);
    if (!updated) {
      return new NextResponse("Application not found.", { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Unable to process approval.", { status: 500 });
  }
}
