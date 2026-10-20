import { NextRequest, NextResponse } from "next/server";
import { getApplicationById, updateApplicationReview } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = getApplicationById(id);
    if (!app) {
      return new NextResponse("Application not found.", { status: 404 });
    }
    return NextResponse.json(app);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = updateApplicationReview(id, body.action, body.notes);
    if (!updated) {
      return new NextResponse("Application not found.", { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return new NextResponse("Unable to process review determination.", {
      status: 500,
    });
  }
}
