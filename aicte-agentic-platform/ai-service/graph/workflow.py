from typing import Dict, Any, List
import time

from agents.intake import run_intake_agent
from agents.document import run_document_agent
from agents.forensics import run_forensics_agent
from agents.verification import run_verification_agent
from agents.compliance import run_compliance_agent

class ApplicationState(dict):
    """Workflow state container for LangGraph agentic orchestration."""
    pass

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

def orchestrator_routing_step(state: Dict[str, Any]) -> str:
    """
    Evaluates extracted document types and conditionally routes:
    - Scanned images -> forensics
    - Signed / QR documents -> verification
    - Both -> both
    """
    docs = state.get("application", {}).get("documents", [])
    has_image = any(d.get("name", "").lower().endswith((".jpg", ".jpeg", ".png")) for d in docs)
    has_pdf = any(d.get("name", "").lower().endswith(".pdf") for d in docs)

    if has_image and has_pdf:
        return "both"
    elif has_image:
        return "forensics"
    elif has_pdf:
        return "verification"
    return "compliance"

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

def verification_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    docs = state.get("application", {}).get("documents", [])
    findings = run_verification_agent(
        docs,
        registry_path=state.get("registry_path", "../data/mock-registry/issuer_records.json"),
        storage_dir=state.get("storage_base", "../storage")
    )
    all_findings = state.get("findings", [])
    all_findings.extend(findings)
    state["findings"] = all_findings

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Verification Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"findingsCount": len(findings)}
    })
    state["executed_agents"] = executed
    return state

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

def report_step(state: Dict[str, Any]) -> Dict[str, Any]:
    t0 = time.time()
    findings = state.get("findings", [])
    
    # Calculate deterministic risk score based on finding severities
    high_count = sum(1 for f in findings if f.get("severity") == "HIGH")
    med_count = sum(1 for f in findings if f.get("severity") == "MEDIUM")
    low_count = sum(1 for f in findings if f.get("severity") == "LOW")

    base_risk = 0.0
    base_risk += high_count * 35.0
    base_risk += med_count * 15.0
    base_risk += low_count * 5.0
    risk_score = min(100.0, base_risk)

    state["riskScore"] = round(risk_score, 1)
    state["recommendedStatus"] = "NEEDS_REVIEW" if risk_score >= 30.0 else "CLEARED"

    executed = state.get("executed_agents", [])
    executed.append({
        "agentName": "Report Agent",
        "status": "COMPLETED",
        "durationMs": int((time.time() - t0) * 1000),
        "details": {"riskScore": risk_score, "findingsCount": len(findings)}
    })
    state["executed_agents"] = executed
    return state

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
        workflow.add_node("report", report_step)

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
        workflow.add_edge("compliance", "report")
        workflow.add_edge("report", END)

        return workflow.compile()
    except Exception as e:
        print(f"LangGraph compile notice: {e}. Using deterministic DAG runner.")
        return None
