import { buildServer } from "../src/server";
import { AuthService } from "../src/services/auth.service";
import { signToken } from "../src/middleware/auth";
import { AuditService } from "../src/services/audit.service";
import { ImpactService } from "../src/services/impact.service";
import { db } from "../src/services/db.service";
import assert from "assert";

async function runTests() {
  console.log("=== AICTE Gateway Automated Tests ===");
  const server = await buildServer();
  await server.ready();

  let officerToken = "";
  let institutionToken = "";

  // Test 1: Authentication & Role Accounts
  console.log("Test 1: Authentication & Role accounts");
  {
    await AuthService.initSeedUsers();
    const officerAuth = await AuthService.authenticate("demo-officer@aicte.gov.in", "DemoOfficer#AICTE2026!");
    assert(officerAuth !== null, "Officer authentication failed");
    assert.strictEqual(officerAuth.role, "SCRUTINY_OFFICER", "Officer role mismatch");
    officerToken = signToken(officerAuth);

    const instAuth = await AuthService.authenticate("demo-institution@engg.edu", "DemoInst#AICTE2026!");
    assert(instAuth !== null, "Institution authentication failed");
    assert.strictEqual(instAuth.role, "INSTITUTION", "Institution role mismatch");
    institutionToken = signToken(instAuth);

    const badAuth = await AuthService.authenticate("demo-officer@aicte.gov.in", "WrongPassword");
    assert.strictEqual(badAuth, null, "Invalid password was accepted unexpectedly");
    console.log("  ✓ Authentication & password hashing verified");
  }


  // Test 2: Health Check
  console.log("Test 2: Health Check endpoint");
  {
    const res = await server.inject({
      method: "GET",
      url: "/health"
    });
    assert.strictEqual(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.strictEqual(body.status, "ok");
    console.log("  ✓ Gateway health endpoint returned ok");
  }

  // Test 3: Application Creation (Protected)
  console.log("Test 3: Application Creation & Auth Verification");
  let testAppId = "";
  {
    // Unauthorized check
    const unauthRes = await server.inject({
      method: "POST",
      url: "/api/applications",
      payload: { institutionName: "Test College", program: "B.Tech CSE" }
    });
    assert.strictEqual(unauthRes.statusCode, 401, "Unauthenticated application creation must be rejected");

    // Authenticated creation
    const authRes = await server.inject({
      method: "POST",
      url: "/api/applications",
      headers: {
        authorization: `Bearer ${institutionToken}`
      },
      payload: {
        institutionName: "Apex Institute of Technology",
        program: "Computer Science & Engineering",
        academicYear: "2026-27"
      }
    });
    assert.strictEqual(authRes.statusCode, 201);
    const createdApp = JSON.parse(authRes.body);
    assert(createdApp.id.startsWith("APP-2026-"), "Application ID format mismatch");
    assert.strictEqual(createdApp.status, "Submitted");
    testAppId = createdApp.id;
    console.log(`  ✓ Application created: ${testAppId}`);
  }

  // Test 4: Role-Based Access Control on Review Actions
  console.log("Test 4: RBAC on Scrutiny Review Actions");
  {
    // Institution user attempting to approve (Must be 403 Forbidden)
    const instApproveRes = await server.inject({
      method: "POST",
      url: `/api/applications/${testAppId}/approve`,
      headers: {
        authorization: `Bearer ${institutionToken}`
      },
      payload: { notes: "Trying to self-approve" }
    });
    assert.strictEqual(instApproveRes.statusCode, 403, "Institution must not be permitted to approve applications");
    console.log("  ✓ Institution role correctly forbidden from scrutiny review actions");

    // Officer attempting to approve
    const officerApproveRes = await server.inject({
      method: "POST",
      url: `/api/applications/${testAppId}/approve`,
      headers: {
        authorization: `Bearer ${officerToken}`
      },
      payload: { notes: "Verified land title and statutory NOCs against APH 2026-27." }
    });
    assert.strictEqual(officerApproveRes.statusCode, 200);
    const approvedData = JSON.parse(officerApproveRes.body);
    assert.strictEqual(approvedData.application.reviewedBy, "Dr. A. K. Sharma (Demo Officer)");
    console.log("  ✓ Authorized Scrutiny Officer approved application with identity tracking");
  }


  // Test 5: Hash-Chained Audit Ledger & Verification
  console.log("Test 5: SHA-256 Hash-Chained Audit Ledger Verification");
  {
    const auditRes = await server.inject({
      method: "GET",
      url: "/api/audit"
    });
    assert.strictEqual(auditRes.statusCode, 200);
    const logs = JSON.parse(auditRes.body);
    assert(logs.length >= 2, "Expected audit events for creation and approval");

    const verifyRes = await server.inject({
      method: "GET",
      url: "/api/audit/verify"
    });
    assert.strictEqual(verifyRes.statusCode, 200);
    const verification = JSON.parse(verifyRes.body);
    assert.strictEqual(verification.valid, true, "Hash chain must be mathematically valid");
    assert.strictEqual(verification.status, "VERIFIED");
    assert.strictEqual(verification.tamperedSequence, null);
    console.log(`  ✓ Audit hash-chain mathematically verified across ${verification.verifiedCount} records`);
  }

  // Test 6: Impact Metrics & Configurable Baseline
  console.log("Test 6: Genuine Impact Metrics & Configurable Baseline");
  {
    const impactRes = await server.inject({
      method: "GET",
      url: "/api/analytics/impact"
    });
    assert.strictEqual(impactRes.statusCode, 200);
    const metrics = JSON.parse(impactRes.body);
    assert(metrics.isBaselineConfigured, "Baseline must be explicitly configured");
    assert(typeof metrics.baselineManualMinutes === "number", "Baseline manual minutes must be numeric");
    assert(metrics.baselineMethodology.length > 10, "Methodology explanation must be transparent");
    console.log(`  ✓ Impact metrics verified: ${metrics.processedCount} processed, baseline ${metrics.baselineManualMinutes} min`);
  }

  await server.close();
  console.log("\n>>> ALL GATEWAY TESTS PASSED SUCCESSFULLY! <<<\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
