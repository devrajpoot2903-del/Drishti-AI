import os
import json
import uuid

def run_compliance_agent(
    application_data: dict,
    rules_path: str = "../data/rules/aph_2026_27_rules.json"
) -> list:
    """
    Compliance Agent: Applies versioned, configuration-driven rule engine (APH 2026-27).
    """
    findings = []
    
    rules = []
    if os.path.exists(rules_path):
        try:
            with open(rules_path, "r") as f:
                data = json.load(f)
                rules = data.get("rules", [])
        except Exception:
            pass

    submitted_docs = application_data.get("documents", [])
    submitted_types = set(d.get("type", "") for d in submitted_docs)

    # Evaluate missing mandatory documents from enabled rules
    for rule in rules:
        if not rule.get("isEnabled"):
            continue

        req_type = rule.get("requiredDocumentType")
        if req_type and req_type not in submitted_types:
            findings.append({
                "id": str(uuid.uuid4()),
                "category": "Compliance",
                "severity": rule.get("severity", "HIGH"),
                "title": f"Mandatory Statutory Document Missing: {req_type}",
                "detail": f"Rule {rule.get('ruleId')} mandate unmet: {rule.get('condition')}",
                "tool": "AICTE APH Rule Engine",
                "ruleId": rule.get("ruleId"),
                "documentRef": req_type,
                "verificationStatus": "Discrepancy",
                "evidence": {
                    "documentName": req_type,
                    "methodUsed": "APH 2026-27 Regulatory Checklist Validation",
                    "description": f"Source reference: {rule.get('sourceRef')}. Missing attachment required for statutory approval."
                }
            })

    return findings
