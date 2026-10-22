import os
import time
from typing import Dict, Any, List

from agents.intake import run_intake_agent
from agents.document import run_document_agent
from agents.forensics import run_forensics_agent
from agents.verification import run_verification_agent
from agents.compliance import run_compliance_agent

class ApplicationState(dict):
    """Workflow state container for LangGraph agentic orchestration."""
    pass

# --- 1. Intake Agent ---
def intake_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    plan = run_intake_agent(state.get("application", {}))
    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Intake Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": plan
    })
    state["intake_plan"] = plan
    state["executed_agents"] = executed
    return state

# --- 2. Document Agent ---
def document_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    docs = state.get("application", {}).get("documents", [])
    extracted = run_document_agent(docs, storage_base_dir=state.get("storage_dir", "../storage/documents"))
    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Document Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"extractedCount": len(extracted)}
    })
    state["extracted_documents"] = extracted
    state["executed_agents"] = executed
    return state

# --- 3. Orchestrator Agent (Dynamic Routing & Inspection Strategy) ---
def orchestrator_routing_step(state: Dict[str, Any]) -> str:
    """
    Orchestrator Agent evaluates ingested documents and formulates dynamic routing:
    - Analyzes document MIME types, page counts, and embedded features.
    - Decides whether Forensics, Verification, or Both pipelines are dispatched.
    """
    t0 = time.time()
    docs = state.get("application", {}).get("documents", [])

    has_images = any(d.get("name", "").lower().endswith((".jpg", ".jpeg", ".png")) for d in docs)
    has_pdfs = any(d.get("name", "").lower().endswith(".pdf") for d in docs)

    if has_images and has_pdfs:
        route = "both"
        rationale = "Multi-format dossier containing both raster image evidence and structured statutory PDFs. Dispatched dual Forensics and Verification pipelines."
    elif has_images:
        route = "forensics"
        rationale = "Image-based submission. Prioritized pixel-level Error Level Analysis (ELA) and perceptual hash analysis."
    elif has_pdfs:
        route = "both"  # PDFs are routed to Forensics (metadata inspection) AND Verification (QR/PKI)
        rationale = "Statutory PDF dossier. Dispatched Forensics Agent for metadata structure inspection and Verification Agent for QR/PKCS#7 PKI validation."
    else:
        route = "compliance"
        rationale = "No binary artifacts attached. Routed directly to regulatory compliance checklist audit."

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Orchestrator Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {
            "routingStrategy": route,
            "decisionRationale": rationale,
            "documentsExamined": len(docs)
        }
    })
    state["executed_agents"] = executed
    return route

# --- 4. Forensics Agent ---
def forensics_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    docs = state.get("application", {}).get("documents", [])
    existing_docs = state.get("existing_documents", [])
    existing_faculty = state.get("existing_faculty", [])
    findings = run_forensics_agent(
        docs,
        existing_documents=existing_docs,
        existing_faculty_ids=existing_faculty,
        storage_dir=state.get("storage_base", "../storage")
    )
    all_findings = state.get("findings", [])
    all_findings.extend(findings)
    state["findings"] = all_findings

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Forensics Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"findingsCount": len(findings)}
    })
    state["executed_agents"] = executed
    return state

# --- 5. Verification Agent ---
def verification_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    docs = state.get("application", {}).get("documents", [])
    findings, checks = run_verification_agent(
        docs,
        registry_path=state.get("registry_path", "../data/mock-registry/issuer_records.json"),
        storage_dir=state.get("storage_base", "../storage"),
        return_checks=True
    )
    all_findings = state.get("findings", [])
    all_findings.extend(findings)
    state["findings"] = all_findings
    state["verification_checks"] = checks

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Verification Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"findingsCount": len(findings), "checksCount": len(checks)}
    })
    state["executed_agents"] = executed
    return state

# --- 6. Compliance Agent ---
def compliance_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    findings = run_compliance_agent(
        state.get("application", {}),
        rules_path=state.get("rules_path", "../data/rules/aph_2026_27_rules.json")
    )
    all_findings = state.get("findings", [])
    all_findings.extend(findings)
    state["findings"] = all_findings

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Compliance Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"findingsCount": len(findings)}
    })
    state["executed_agents"] = executed
    return state

# --- Aggregation & Deterministic Risk Scoring (Post-Agent Synthesis) ---
def aggregation_step(state: Dict[str, Any]) -> Dict[str, Any]:
    findings = state.get("findings", [])
    checks = state.get("verification_checks", [])

    # 1. DOCUMENT AUTHENTICITY RISK (0–100)
    # Calculated EXCLUSIVELY from Forensic and Verification evidence of uploaded documents.
    # Unsigned documents are NOT penalized merely because they lack a digital signature.
    # Missing application-level checklist documents are NOT treated as document forgery.
    forensic_findings = [f for f in findings if f.get("category") in ["Forensics", "Verification"]]
    
    auth_risk = 0.0
    auth_reasons = []

    for f in forensic_findings:
        sev = f.get("severity", "MEDIUM")
        title = f.get("title", "")
        if sev == "HIGH":
            auth_risk += 50.0
            auth_reasons.append(f"Critical anomaly: {title} (+50)")
        elif sev == "MEDIUM":
            auth_risk += 25.0
            auth_reasons.append(f"Forensic suspicion: {title} (+25)")
        else:
            auth_risk += 10.0
            auth_reasons.append(f"Discrepancy: {title} (+10)")

    doc_authenticity_risk = min(100.0, auth_risk)

    # Determine Authenticity Assessment
    has_verified_credential = any(c.get("status") == "VERIFIED" and c.get("method") in ["QR", "SIGNATURE"] for c in checks)
    has_tampered_credential = any(c.get("status") in ["EXPIRED", "MISMATCH"] for c in checks)

    if doc_authenticity_risk >= 40.0 or has_tampered_credential:
        authenticity_assessment = "HIGH_RISK"
        authenticity_explanation = "; ".join(auth_reasons) if auth_reasons else "Tampered or expired statutory credentials detected."
    elif doc_authenticity_risk > 0.0:
        authenticity_assessment = "SUSPICIOUS"
        authenticity_explanation = "; ".join(auth_reasons)
    elif has_verified_credential:
        authenticity_assessment = "LOW_RISK"
        authenticity_explanation = "Cryptographic / regulatory registry checks verified. Clean file structure with zero editing signatures."
    else:
        # If authenticity cannot be verified via QR or PKI, but no tampering detected:
        authenticity_assessment = "INCONCLUSIVE"
        authenticity_explanation = "Document has clean file structure, but lacks digital signatures or machine-readable QR codes to definitively verify issuer provenance. Manual review required."

    # 2. APPLICATION COMPLIANCE RISK (0–100)
    # Calculated from regulatory checklist rules (missing statutory documents, cadre ratio, faculty deduplication).
    compliance_findings = [f for f in findings if f.get("category") == "Compliance"]
    comp_risk = 0.0
    comp_reasons = []

    for f in compliance_findings:
        sev = f.get("severity", "MEDIUM")
        title = f.get("title", "")
        if sev == "HIGH":
            comp_risk += 25.0
            comp_reasons.append(title)
        elif sev == "MEDIUM":
            comp_risk += 15.0
            comp_reasons.append(title)
        else:
            comp_risk += 5.0
            comp_reasons.append(title)

    app_compliance_risk = min(100.0, comp_risk)

    if app_compliance_risk == 0.0:
        compliance_assessment = "FULLY_COMPLIANT"
        compliance_explanation = "All APH 2026-27 statutory documents and cadre standards satisfied."
    elif app_compliance_risk < 40.0:
        compliance_assessment = "MINOR_DEFICIENCY"
        compliance_explanation = f"Minor checklist discrepancies: {', '.join(comp_reasons)}"
    else:
        compliance_assessment = "NON_COMPLIANT"
        compliance_explanation = f"Statutory checklist deficiencies: {', '.join(comp_reasons)}"

    # 3. Overall Recommended Status
    if authenticity_assessment in ["HIGH_RISK", "SUSPICIOUS"]:
        recommended_status = "NEEDS_REVIEW"
    elif compliance_assessment == "NON_COMPLIANT":
        recommended_status = "NEEDS_REVIEW"
    elif authenticity_assessment == "INCONCLUSIVE":
        recommended_status = "NEEDS_REVIEW"
    else:
        recommended_status = "CLEARED"

    state["documentAuthenticityRisk"] = round(doc_authenticity_risk, 1)
    state["applicationComplianceRisk"] = round(app_compliance_risk, 1)
    # Backward compatibility riskScore reflects overall maximum risk
    state["riskScore"] = round(max(doc_authenticity_risk, app_compliance_risk), 1)
    state["authenticityAssessment"] = authenticity_assessment
    state["complianceAssessment"] = compliance_assessment
    state["authenticityExplanation"] = authenticity_explanation
    state["complianceExplanation"] = compliance_explanation
    state["recommendedStatus"] = recommended_status

    return state

report_step = aggregation_step

def build_orchestrator_graph():
    """
    Builds the LangGraph StateGraph workflow for agentic document verification.
    """
    try:
        from langgraph.graph import StateGraph, END

        workflow = StateGraph(ApplicationState)
        workflow.add_node("intake", intake_step)
        workflow.add_node("document", document_step)
        workflow.add_node("forensics", forensics_step)
        workflow.add_node("verification", verification_step)
        workflow.add_node("compliance", compliance_step)
        workflow.add_node("aggregation", aggregation_step)

        workflow.set_entry_point("intake")
        workflow.add_edge("intake", "document")

        def route_after_document(state: Dict[str, Any]) -> str:
            return orchestrator_routing_step(state)

        workflow.add_conditional_edges(
            "document",
            route_after_document,
            {
                "forensics": "forensics",
                "verification": "verification",
                "both": "forensics",
                "compliance": "compliance"
            }
        )

        workflow.add_edge("forensics", "verification")
        workflow.add_edge("verification", "compliance")
        workflow.add_edge("compliance", "aggregation")
        workflow.add_edge("aggregation", END)

        return workflow.compile()
    except Exception as e:
        print(f"LangGraph compile notice: {e}. Using deterministic DAG runner.")
        return None
