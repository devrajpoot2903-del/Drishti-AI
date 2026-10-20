import { NextResponse } from "next/server";
import { getWorkflowStatus } from "@/lib/store";

export async function GET() {
  try {
    const workflow = getWorkflowStatus();
    return NextResponse.json(workflow);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}
