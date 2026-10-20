import { NextRequest, NextResponse } from "next/server";
import { getApplications, createApplication } from "@/lib/store";

export async function GET() {
  try {
    const apps = getApplications();
    return NextResponse.json(apps);
  } catch (error) {
    return new NextResponse("Unable to connect to the server. Please try again.", {
      status: 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.institutionName) {
      return new NextResponse("Institution name is required.", { status: 400 });
    }
    const newApp = createApplication(body);
    return NextResponse.json(newApp, { status: 201 });
  } catch (error) {
    return new NextResponse("Unable to process application submission.", {
      status: 500,
    });
  }
}
