import { NextRequest, NextResponse } from "next/server";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages: Message[] = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = (lastMessage?.content || "").trim().toLowerCase();

    let answer = "";

    if (
      userQuery.includes("hello") ||
      userQuery.includes("hi") ||
      userQuery.includes("hey")
    ) {
      answer =
        "Hello! I am your Drishti AI Platform Assistant. I can help answer questions regarding institutional applications, document forensic verification (ELA, metadata, signatures), AICTE APH 2026–27 compliance norms, and scrutiny workflows. How can I assist you today?";
    } else if (
      userQuery.includes("upload") ||
      userQuery.includes("document") ||
      userQuery.includes("file") ||
      userQuery.includes("pdf")
    ) {
      answer =
        "To upload institutional dossiers, navigate to 'Upload Documents' or click 'New Application'. You can upload Land Titles, Building Plans, Fire NOCs, and Affiliation documents. Drishti AI automatically generates SHA-256 provenance hashes and initiates OCR parsing & forensic verification.";
    } else if (
      userQuery.includes("agent") ||
      userQuery.includes("workflow") ||
      userQuery.includes("orchestrator") ||
      userQuery.includes("pipeline")
    ) {
      answer =
        "Drishti AI utilizes a 6-agent architecture:\n1. Intake Agent (integrity & SHA-256 provenance)\n2. Document Agent (PaddleOCR structured extraction)\n3. Orchestrator (conditional routing)\n4. Forensics Agent (OpenCV ELA, pHash tamper detection)\n5. Verification Agent (pyHanko digital signature validation)\n6. Compliance Agent (regulatory rule checks against AICTE APH 2026–27).";
    } else if (
      userQuery.includes("forensic") ||
      userQuery.includes("tamper") ||
      userQuery.includes("ela") ||
      userQuery.includes("fraud")
    ) {
      answer =
        "The Forensics Agent executes Error Level Analysis (ELA) to identify image manipulations, digital splices, and cloned stamps. Perceptual hashing (pHash) and EXIF metadata checks are run simultaneously to highlight altered document areas.";
    } else if (
      userQuery.includes("compliance") ||
      userQuery.includes("norm") ||
      userQuery.includes("land") ||
      userQuery.includes("ratio")
    ) {
      answer =
        "Compliance checks are evaluated against AICTE Approval Process Handbook (APH 2026–27) standards. Key parameters include land ownership in contiguous parcels, instructional built-up area, 1:15 or 1:20 faculty-to-student ratios, barrier-free access, and fire safety clearance.";
    } else if (
      userQuery.includes("review") ||
      userQuery.includes("scrutiny") ||
      userQuery.includes("officer") ||
      userQuery.includes("decision")
    ) {
      answer =
        "Drishti AI is an agentic decision-support system keeping human officials firmly in control. Scrutiny officers can inspect side-by-side evidence, verify cryptographic audit chains, and make informed determinations: Approved, Rectification Requested, or Escalated.";
    } else if (
      userQuery.includes("drishti") ||
      userQuery.includes("what is") ||
      userQuery.includes("who are you")
    ) {
      answer =
        "Drishti AI V2 is an institutional decision-support and regulatory intelligence platform built for statutory oversight bodies like AICTE. It combines multi-agent scrutiny, multi-modal forensics, and transparent auditability to streamline application evaluations.";
    } else {
      answer =
        `Thank you for your inquiry regarding "${lastMessage.content}". In Drishti AI V2, all institutional submissions undergo automated ingestion, OCR extraction, forensic scrutiny, and normative compliance checks before reaching human scrutiny officers for final disposition. Feel free to ask about document upload requirements, agent pipeline statuses, or AICTE compliance guidelines!`;
    }

    return NextResponse.json({ answer });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal assistant error. Please try again later." },
      { status: 500 }
    );
  }
}
