import { NextRequest, NextResponse } from "next/server";
import { rectifyApplication } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    if (!body.reason || !body.reason.trim()) {
      return new NextResponse("A valid rectification reason is required.", {
        status: 400,
      });
    }
    const updated = rectifyApplication(id, body.reason.trim());
    if (!updated) {
      return new NextResponse("Application not found.", { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Unable to issue rectification notice.", {
      status: 500,
    });
  }
}
