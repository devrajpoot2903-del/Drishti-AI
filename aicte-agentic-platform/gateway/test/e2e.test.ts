import { buildServer } from "../src/server";
import { AuthService } from "../src/services/auth.service";
import { signToken } from "../src/middleware/auth";
import { db } from "../src/services/db.service";
import fs from "fs";
import path from "path";
import assert from "assert";

async function runEndToEndVerification() {
  console.log("\n========================================================");
  console.log("   AICTE AGENTIC PLATFORM — END-TO-END VERIFICATION");
  console.log("========================================================\n");

  const server = await buildServer();
  await server.ready();

  // 1. Authenticate as Institution
  console.log("[1/8] Authenticating Institution User...");
  await AuthService.initSeedUsers();
  const instSession = await AuthService.authenticate("principal@engg.edu", "College@AICTE2026");
  assert(instSession !== null, "Institution login failed");
  const instToken = signToken(instSession);
  console.log(`  ✓ Authenticated as: ${instSession.name} (${instSession.role})`);

  // 2. Authenticate as Scrutiny Officer
  console.log("[2/8] Authenticating Scrutiny Officer...");
  const officerSession = await AuthService.authenticate("officer@aicte.gov.in", "Officer@AICTE2026");
  assert(officerSession !== null, "Officer login failed");
  const officerToken = signToken(officerSession);
  console.log(`  ✓ Authenticated as: ${officerSession.name} (${officerSession.role})`);

  // 3. Create Application
  console.log("[3/8] Creating Regulatory Approval Dossier...");
  const createRes = await server.inject({
    method: "POST",
    url: "/api/applications",
    headers: { authorization: `Bearer ${instToken}` },
    payload: {
      institutionName: "National Institute of Technology, Delhi",
      category: "Engineering & Tech",
      program: "Mechanical & Automation Engineering",
      academicYear: "2026-27"
    }
  });
  assert.strictEqual(createRes.statusCode, 201);
  const app = JSON.parse(createRes.body);
  const appId = app.id;
  console.log(`  ✓ Application Dossier created: ${appId} (Status: ${app.status})`);

  // 4. Attach Synthetic Document
  console.log("[4/8] Storing Dossier Document & Calculating SHA-256...");
  const fixturePath = path.resolve(__dirname, "../../data/test-fixtures/synthetic_fire_noc.png");
  let docId = "";
  if (fs.existsSync(fixturePath)) {
    const fileBuf = fs.readFileSync(fixturePath);
    // Directly save document via DB & Storage for deterministic test
    const { StorageService } = require("../src/services/storage.service");
    const stored = await StorageService.saveUploadedBuffer(fileBuf, "synthetic_fire_noc.png", "image/png");
    const docRecord = db.createDocument({
      id: stored.id,
      applicationId: appId,
      originalFilename: stored.originalFilename,
      storageFilename: stored.storageFilename,
      storagePath: stored.storagePath,
      mimeType: stored.mimeType,
      fileSize: stored.sizeBytes,
      sha256: stored.sha256,
      documentType: "Statutory NOC",
      status: "UPLOADED"
    });
    docId = docRecord.id;
    console.log(`  ✓ Document attached: ${stored.originalFilename} (SHA-256: ${stored.sha256.slice(0, 16)}...)`);
  }

  // 5. Generate Findings and Evidence via AI Pipeline
  console.log("[5/8] Simulating Agentic Scrutiny Results & Evidence Linking...");
  const findingRecord = db.createFinding(
    {
      applicationId: appId,
      documentId: docId || null,
      title: "Mandatory Building Plan & Occupancy Certificate Missing",
      category: "Compliance",
      severity: "Critical",
      description: "Rule APH-2026-BLD-01 mandate unmet: Technical institutions must attach certified architectural building plan and municipal occupancy certificate.",
      impact: "Mandatory Scrutiny Review Required",
      ruleRef: "APH-2026-BLD-01",
      methodUsed: "AICTE APH Rule Engine",
      confidence: 100,
      requiresReview: true
    },
    {
      description: "Statutory checklist evaluation for Engineering & Tech category against APH 2026-27 norms.",
      methodUsed: "APH 2026-27 Regulatory Checklist Validation",
      documentRef: "Building Plan & Occupancy",
      page: 1,
      confidence: 100,
      boundingBoxes: []
    }
  );
  db.updateApplication(appId, {
    status: "Needs Review",
    processedAt: new Date().toISOString()
  });
  console.log(`  ✓ Finding generated: [${findingRecord.severity}] ${findingRecord.title}`);

  // 6. Test Evidence Retrieval Endpoint
  console.log("[6/8] Retrieving Backend Evidence for Finding...");
  const evidenceRes = await server.inject({
    method: "GET",
    url: `/api/findings/${findingRecord.id}/evidence`,
    headers: { authorization: `Bearer ${officerToken}` }
  });
  assert.strictEqual(evidenceRes.statusCode, 200);
  const evidenceData = JSON.parse(evidenceRes.body);
  assert.strictEqual(evidenceData.hasEvidence, true);
  console.log(`  ✓ Evidence retrieved: "${evidenceData.evidence.description.slice(0, 50)}..."`);

  // 7. Scrutiny Officer Official Review Action (Approve / Rectification)
  console.log("[7/8] Performing Official Scrutiny Decision (Request Rectification)...");
  const rectifyRes = await server.inject({
    method: "POST",
    url: `/api/applications/${appId}/rectification`,
    headers: { authorization: `Bearer ${officerToken}` },
    payload: {
      notes: "Institution must upload municipality-endorsed occupancy certificate within 15 calendar days."
    }
  });
  assert.strictEqual(rectifyRes.statusCode, 200);
  const rectifiedApp = JSON.parse(rectifyRes.body);
  assert.strictEqual(rectifiedApp.application.status, "Rectification Requested");
  assert.strictEqual(rectifiedApp.application.reviewedBy, "Dr. A. K. Sharma");
  console.log(`  ✓ Official Decision recorded: Status="${rectifiedApp.application.status}", Reviewer="${rectifiedApp.application.reviewedBy}"`);

  // 8. Cryptographic Audit Chain Verification
  console.log("[8/8] Cryptographically Verifying SHA-256 Tamper-Evident Audit Trail...");
  const auditRes = await server.inject({
    method: "GET",
    url: "/api/audit/verify"
  });
  assert.strictEqual(auditRes.statusCode, 200);
  const verification = JSON.parse(auditRes.body);
  assert.strictEqual(verification.valid, true);
  assert.strictEqual(verification.status, "VERIFIED");
  console.log(`  ✓ Audit Chain Verification: ${verification.message}`);

  // 9. Impact Metrics Calculation
  const impactRes = await server.inject({
    method: "GET",
    url: "/api/analytics/impact"
  });
  assert.strictEqual(impactRes.statusCode, 200);
  const impact = JSON.parse(impactRes.body);
  console.log(`  ✓ Impact Metrics: Processed=${impact.processedCount}, Saved=${impact.estimatedManualTimeSavedHours} hrs (Baseline: ${impact.baselineManualMinutes} min)`);

  await server.close();
  console.log("\n========================================================");
  console.log("   ✓ ALL END-TO-END WORKFLOW CHECKS PASSED!");
  console.log("========================================================\n");
}

runEndToEndVerification().catch((err) => {
  console.error("End-to-end verification failed:", err);
  process.exit(1);
});
