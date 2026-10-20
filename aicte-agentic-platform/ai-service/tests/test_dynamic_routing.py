import os
import sys
import unittest

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from agents.orchestrator import execute_agent_pipeline

FIXTURES_DIR = os.path.abspath(os.path.join(BASE_DIR, "../data/test-fixtures"))

class TestDynamicRouting(unittest.TestCase):

    def test_case_1_scanned_image_only(self):
        """Case 1: Scanned image dossier routes to Forensics; Verification is skipped with reason"""
        submission = {
            "id": "APP-ROUTE-IMG",
            "category": "Engineering & Tech",
            "institutionName": "Apex Institute of Tech",
            "documents": [
                {"name": "land_scan.jpg", "type": "Land Ownership"}
            ]
        }
        res = execute_agent_pipeline(submission)
        agents = {a["agentName"]: a for a in res["executed_agents"]}

        self.assertIn("Forensics Agent", agents)
        self.assertEqual(agents["Forensics Agent"]["status"], "COMPLETED")

        self.assertIn("Verification Agent", agents)
        self.assertEqual(agents["Verification Agent"]["status"], "SKIPPED")
        self.assertIn("skipped", agents["Verification Agent"]["reason"].lower())
        print("  ✓ Case 1 (Scanned Image): Forensics executed, Verification skipped with explicit reason")

    def test_case_2_digital_pdf_only(self):
        """Case 2: Digital PDF dossier routes to Verification; Forensics is skipped with reason"""
        submission = {
            "id": "APP-ROUTE-PDF",
            "category": "Engineering & Tech",
            "institutionName": "Apex Institute of Tech",
            "documents": [
                {"name": "statutory_fire_noc.pdf", "type": "Statutory NOC"}
            ]
        }
        res = execute_agent_pipeline(submission)
        agents = {a["agentName"]: a for a in res["executed_agents"]}

        self.assertIn("Verification Agent", agents)
        self.assertEqual(agents["Verification Agent"]["status"], "COMPLETED")

        self.assertIn("Forensics Agent", agents)
        self.assertEqual(agents["Forensics Agent"]["status"], "SKIPPED")
        self.assertIn("skipped", agents["Forensics Agent"]["reason"].lower())
        print("  ✓ Case 2 (Digital PDF): Verification executed, Forensics skipped with explicit reason")

    def test_case_3_mixed_dossier_both_branches(self):
        """Case 3: Mixed dossier (scanned image + PDF) triggers both Forensics and Verification"""
        submission = {
            "id": "APP-ROUTE-MIXED",
            "category": "Engineering & Tech",
            "institutionName": "Apex Institute of Tech",
            "documents": [
                {"name": "land_scan.jpg", "type": "Land Ownership"},
                {"name": "statutory_fire_noc.pdf", "type": "Statutory NOC"}
            ]
        }
        res = execute_agent_pipeline(submission)
        agents = {a["agentName"]: a for a in res["executed_agents"]}

        self.assertIn("Forensics Agent", agents)
        self.assertEqual(agents["Forensics Agent"]["status"], "COMPLETED")

        self.assertIn("Verification Agent", agents)
        self.assertEqual(agents["Verification Agent"]["status"], "COMPLETED")

        self.assertIn("Compliance Agent", agents)
        self.assertEqual(agents["Compliance Agent"]["status"], "COMPLETED")
        print("  ✓ Case 3 (Mixed Image + PDF): Both Forensics and Verification branches executed")

if __name__ == "__main__":
    unittest.main()
