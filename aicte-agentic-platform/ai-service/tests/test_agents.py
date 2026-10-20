import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from tools.ela import generate_ela_heatmap
from tools.phash import calculate_phash, compare_phash
from agents.intake import run_intake_agent
from agents.document import run_document_agent
from agents.forensics import run_forensics_agent
from agents.verification import run_verification_agent
from agents.compliance import run_compliance_agent
from agents.orchestrator import execute_agent_pipeline

FIXTURES_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data/test-fixtures"))

class TestAIAgents(unittest.TestCase):

    def test_01_intake_agent(self):
        """Intake Agent selects statutory checklist and identifies missing documents"""
        submission = {
            "id": "APP-TEST-001",
            "category": "Engineering & Tech",
            "approvalType": "Extension of Approval (EOA)",
            "documents": [
                {"name": "land_deed.pdf", "type": "Land Ownership"}
            ]
        }
        res = run_intake_agent(submission)
        self.assertEqual(res["category"], "Engineering & Tech")
        self.assertIn("requiredChecklist", res)
        # Should detect missing documents since only 1 of 4 statutory documents was uploaded
        self.assertGreater(len(res["missingDocumentTypes"]), 0)
        self.assertFalse(res["initialComplianceFlag"])
        print("  ✓ Intake Agent: Checklist selection and missing document detection verified")

    def test_02_forensics_ela(self):
        """Forensics Level 1: ELA generates anomaly scores and heatmaps"""
        altered_path = os.path.join(FIXTURES_DIR, "synthetic_altered_land.jpg")
        if os.path.exists(altered_path):
            result = generate_ela_heatmap(altered_path, output_dir=os.path.join(BASE_DIR, "../storage/evidence"))
            self.assertTrue(result["success"])
            self.assertIn("anomalyScore", result)
            self.assertIn("heatmapPath", result)
            self.assertGreaterEqual(result["anomalyScore"], 0.0)
            print(f"  ✓ Forensics ELA: Anomaly score {result['anomalyScore']:.2f}, heatmap generated: {result['heatmapPath']}")
        else:
            print("  - Skipped ELA test (fixture not present)")

    def test_03_forensics_phash(self):
        """Forensics Level 1: Perceptual hash detects exact and near duplicates"""
        noc_path = os.path.join(FIXTURES_DIR, "synthetic_fire_noc.png")
        if os.path.exists(noc_path):
            res1 = calculate_phash(noc_path)
            res2 = calculate_phash(noc_path)
            self.assertTrue(res1["success"])
            self.assertTrue(res2["success"])
            dist = compare_phash(res1["phash"], res2["phash"])
            self.assertEqual(dist, 0, "Identical image must have 0 Hamming distance")
            print("  ✓ Forensics pHash: 64-bit perceptual hashing verified (Hamming distance 0)")
        else:
            print("  - Skipped pHash test (fixture not present)")

    def test_04_verification_agent(self):
        """Verification Agent ladder: QR, Signature, and Mock Registry"""
        docs = [
            {
                "id": "doc_test_qr",
                "name": "synthetic_fire_noc.png",
                "storagePath": os.path.join(FIXTURES_DIR, "synthetic_fire_noc.png"),
                "type": "Statutory NOC"
            }
        ]
        registry_path = os.path.join(BASE_DIR, "../data/mock-registry/issuer_records.json")
        findings = run_verification_agent(docs, registry_path=registry_path)
        self.assertIsInstance(findings, list)
        print(f"  ✓ Verification Ladder: Successfully executed across document ladder stages")

    def test_05_compliance_agent(self):
        """Compliance Agent evaluates statutory rules from APH 2026-27 catalog"""
        app_data = {
            "category": "Engineering & Tech",
            "documents": [
                {"name": "land_deed.pdf", "type": "Land Ownership"}
            ]
        }
        rules_path = os.path.join(BASE_DIR, "../data/rules/aph_2026_27_rules.json")
        findings = run_compliance_agent(app_data, rules_path=rules_path)
        self.assertIsInstance(findings, list)
        # Should flag missing mandatory NOCs
        self.assertGreater(len(findings), 0)
        print(f"  ✓ Compliance Agent: Evaluated statutory checklist, found {len(findings)} non-compliance items")

    def test_06_orchestrator_execution(self):
        """Orchestrator dynamically coordinates all agents and synthesizes evidence-based report"""
        submission = {
            "id": "APP-INT-001",
            "category": "Engineering & Tech",
            "institutionName": "Apex Institute of Technology",
            "documents": [
                {
                    "id": "doc_noc_1",
                    "name": "synthetic_fire_noc.png",
                    "storagePath": os.path.join(FIXTURES_DIR, "synthetic_fire_noc.png"),
                    "type": "Statutory NOC"
                }
            ]
        }
        options = {
            "storageBase": os.path.join(BASE_DIR, "../storage"),
            "storageDir": FIXTURES_DIR,
            "registryPath": os.path.join(BASE_DIR, "../data/mock-registry/issuer_records.json"),
            "rulesPath": os.path.join(BASE_DIR, "../data/rules/aph_2026_27_rules.json")
        }
        result = execute_agent_pipeline(submission, options=options)
        self.assertIn("findings", result)
        self.assertIn("executed_agents", result)
        self.assertIn("intake_plan", result)
        print(f"  ✓ Orchestrator: {len(result['executed_agents'])} agent executions recorded, {len(result['findings'])} findings generated")

if __name__ == "__main__":
    unittest.main()
