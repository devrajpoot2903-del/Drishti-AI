import os
import json

REQUIRED_DOCUMENTS_BY_CATEGORY = {
    "Engineering & Tech": ["Land Ownership", "Statutory NOC", "Building Plan & Occupancy", "Faculty Roster"],
    "Management": ["Land Ownership", "Statutory NOC", "Faculty Roster"],
    "Pharmacy": ["Land Ownership", "Statutory NOC", "Building Plan & Occupancy", "Faculty Roster"],
    "Architecture": ["Land Ownership", "Statutory NOC", "Building Plan & Occupancy", "Faculty Roster"]
}

def run_intake_agent(application_data: dict) -> dict:
    """
    Intake Agent: Identifies category, selects regulatory checklist,
    classifies documents, detects missing statutory items, and creates processing plan.
    """
    category = application_data.get("category", "Engineering & Tech")
    approval_type = application_data.get("approvalType", "Extension of Approval (EOA)")
    documents = application_data.get("documents", [])

    required_types = REQUIRED_DOCUMENTS_BY_CATEGORY.get(
        category,
        ["Land Ownership", "Statutory NOC", "Faculty Roster"]
    )

    present_types = set(d.get("type", "") for d in documents)
    missing_types = [req for req in required_types if req not in present_types]

    plan = {
        "category": category,
        "approvalType": approval_type,
        "requiredChecklist": required_types,
        "submittedDocumentCount": len(documents),
        "missingDocumentTypes": missing_types,
        "initialComplianceFlag": len(missing_types) == 0,
        "routingRecommendations": []
    }

    for doc in documents:
        doc_type = doc.get("type", "")
        doc_name = doc.get("name", "")
        filename_lower = doc_name.lower()

        routes = ["document_extraction"]
        if filename_lower.endswith((".jpg", ".jpeg", ".png")):
            routes.append("forensic_ela")
        if filename_lower.endswith(".pdf"):
            routes.append("signature_verification")
        routes.append("qr_verification")

        plan["routingRecommendations"].append({
            "documentName": doc_name,
            "documentType": doc_type,
            "applicableRoutes": routes
        })

    return plan
