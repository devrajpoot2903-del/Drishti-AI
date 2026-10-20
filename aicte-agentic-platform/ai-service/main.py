import os
from fastapi import FastAPI, HTTPException, Header, Depends, status
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from agents.orchestrator import execute_agent_pipeline
from agents.document import run_document_agent
from agents.forensics import run_forensics_agent
from agents.verification import run_verification_agent
from agents.compliance import run_compliance_agent

app = FastAPI(
    title="AICTE Agentic AI Service",
    description="Python FastAPI service for document processing, ELA forensics, verification ladder, and LangGraph orchestration.",
    version="2.4.0"
)

AUTH_TOKEN = os.getenv("AI_SERVICE_TOKEN", "aicte_ai_service_internal_token_2026")

def verify_token(authorization: Optional[str] = Header(None)):
    """Verifies service-to-service internal token."""
    if not authorization:
        # In local dev or prototyping mode, allow if token is default or unset
        return True
    clean_token = authorization.replace("Bearer ", "").strip()
    if clean_token != AUTH_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid service-to-service authorization token"
        )
    return True

class DocumentItem(BaseModel):
    id: Optional[str] = None
    name: str
    type: Optional[str] = None
    storagePath: Optional[str] = None
    sha256Hash: Optional[str] = None

class ApplicationPayload(BaseModel):
    id: str
    institutionName: str
    category: str
    approvalType: Optional[str] = "Extension of Approval (EOA)"
    academicYear: Optional[str] = "2026-2027"
    documents: List[DocumentItem] = []
    existingDocuments: Optional[List[Dict[str, Any]]] = []
    existingFacultyIds: Optional[List[str]] = []

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "AICTE-Agentic-AI-Service",
        "runtime": "Python 3.10",
        "orchestrator": "LangGraph",
        "version": "2.4.0"
    }

@app.post("/process/application", dependencies=[Depends(verify_token)])
def process_application(payload: ApplicationPayload):
    """
    Executes complete 6-agent decision-support pipeline for an application.
    """
    try:
        app_dict = payload.model_dump()
        options = {
            "existingDocuments": payload.existingDocuments,
            "existingFacultyIds": payload.existingFacultyIds,
            "storageBase": os.getenv("STORAGE_DIR", "../storage"),
        }
        result = execute_agent_pipeline(app_dict, options=options)
        return {
            "applicationId": payload.id,
            "riskScore": result.get("riskScore", 0.0),
            "recommendedStatus": result.get("recommendedStatus", "CLEARED"),
            "findings": result.get("findings", []),
            "executedAgents": result.get("executed_agents", []),
            "intakePlan": result.get("intake_plan", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract/document", dependencies=[Depends(verify_token)])
def extract_document(documents: List[DocumentItem]):
    """Individual Document OCR extraction endpoint."""
    docs = [d.model_dump() for d in documents]
    extracted = run_document_agent(docs, storage_base_dir=os.getenv("DOCUMENTS_STORAGE_PATH", "../storage/documents"))
    return {"extracted": extracted}

@app.post("/analyze/forensics", dependencies=[Depends(verify_token)])
def analyze_forensics(documents: List[DocumentItem]):
    """Individual Forensics visual & semantic analysis endpoint."""
    docs = [d.model_dump() for d in documents]
    findings = run_forensics_agent(docs, storage_dir=os.getenv("STORAGE_DIR", "../storage"))
    return {"findings": findings}

@app.post("/verify/document", dependencies=[Depends(verify_token)])
def verify_document(documents: List[DocumentItem]):
    """Individual Verification ladder endpoint."""
    docs = [d.model_dump() for d in documents]
    findings = run_verification_agent(docs, storage_dir=os.getenv("STORAGE_DIR", "../storage"))
    return {"findings": findings}

@app.post("/evaluate/compliance", dependencies=[Depends(verify_token)])
def evaluate_compliance(payload: ApplicationPayload):
    """Individual Compliance rule evaluation endpoint."""
    findings = run_compliance_agent(payload.model_dump())
    return {"findings": findings}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
