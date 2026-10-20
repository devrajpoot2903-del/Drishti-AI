import time
from graph.workflow import (
    build_orchestrator_graph,
    intake_step,
    document_step,
    orchestrator_routing_step,
    forensics_step,
    verification_step,
    compliance_step,
    report_step
)

compiled_graph = build_orchestrator_graph()

def execute_agent_pipeline(application_data: dict, options: dict = None) -> dict:
    """
    Executes the 6-agent decision-support pipeline via LangGraph.
    Falls back gracefully to deterministic DAG execution if LangGraph runtime is compiling.
    """
    opts = options or {}
    initial_state = {
        "application": application_data,
        "existing_documents": opts.get("existingDocuments", []),
        "existing_faculty": opts.get("existingFacultyIds", []),
        "storage_base": opts.get("storageBase", "../storage"),
        "storage_dir": opts.get("storageDir", "../storage/documents"),
        "registry_path": opts.get("registryPath", "../data/mock-registry/issuer_records.json"),
        "rules_path": opts.get("rulesPath", "../data/rules/aph_2026_27_rules.json"),
        "findings": [],
        "executed_agents": []
    }

    if compiled_graph is not None:
        try:
            return compiled_graph.invoke(initial_state)
        except Exception as e:
            print(f"LangGraph execution exception ({e}), executing via deterministic DAG runner.")

    # Deterministic DAG execution fallback
    state = intake_step(initial_state)
    state = document_step(state)

    branch = orchestrator_routing_step(state)
    if branch in ["forensics", "both"]:
        state = forensics_step(state)
    else:
        state["executed_agents"].append({
            "agentName": "Forensics Agent",
            "status": "SKIPPED",
            "reason": "Forensics skipped: no applicable image-based raster checks required."
        })

    if branch in ["verification", "both"]:
        state = verification_step(state)
    else:
        state["executed_agents"].append({
            "agentName": "Verification Agent",
            "status": "SKIPPED",
            "reason": "Verification skipped: no cryptographic signatures or QR codes detected."
        })

    state = compliance_step(state)
    state = report_step(state)

    return state
