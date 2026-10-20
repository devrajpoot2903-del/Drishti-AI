import os
import json
import uuid
from tools.qr import detect_qr_code
from tools.signature import verify_pdf_signature

def run_verification_agent(
    documents: list,
    registry_path: str = "../data/mock-registry/issuer_records.json",
    storage_dir: str = "../storage"
) -> list:
    """
    Verification Agent: Implements multi-level verification ladder:
    QR Detection -> Digital Signature (pyHanko) -> Local Mock Registry -> Manual Review.
    """
    findings = []
    
    # Load mock registry
    known_issuers = []
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r") as f:
                reg_data = json.load(f)
                known_issuers = reg_data.get("registeredIssuers", [])
        except Exception:
            pass

    for doc in documents:
        file_path = doc.get("storagePath")
        if not file_path or not os.path.exists(file_path):
            file_path = os.path.join(storage_dir, "documents", doc.get("name", ""))

        if not os.path.exists(file_path):
            continue

        doc_name = doc.get("name", "")

        # 1. QR Code Verification Ladder
        qr_result = detect_qr_code(file_path)
        if qr_result.get("detected"):
            payload = qr_result.get("payload", "")
            # Cross-reference with mock registry
            matched_cert = None
            for issuer in known_issuers:
                for cert in issuer.get("knownCertificates", []):
                    if cert.get("certificateNumber") and cert["certificateNumber"] in payload:
                        matched_cert = cert
                        break

            if matched_cert:
                status = matched_cert.get("status", "ACTIVE")
                if status == "EXPIRED":
                    findings.append({
                        "id": str(uuid.uuid4()),
                        "category": "Verification",
                        "severity": "HIGH",
                        "title": "Expired Statutory Certificate Detected in Registry",
                        "detail": f"QR payload decoded certificate {matched_cert['certificateNumber']}, which expired on {matched_cert.get('validUntil')}.",
                        "tool": "QR Decoder + Local Mock Registry",
                        "documentRef": doc_name,
                        "verificationStatus": "Discrepancy",
                        "evidence": {
                            "documentName": doc_name,
                            "methodUsed": "QR Payload Cross-Check against Prototype Registry",
                            "description": f"Decoded QR payload: '{payload}'. Valid until: {matched_cert.get('validUntil')} (Expired)."
                        }
                    })

        # 2. Digital Signature Verification (pyHanko)
        if file_path.lower().endswith(".pdf"):
            sig_result = verify_pdf_signature(file_path)
            if sig_result.get("hasSignature"):
                for sig in sig_result.get("signatures", []):
                    if not sig.get("valid"):
                        findings.append({
                            "id": str(uuid.uuid4()),
                            "category": "Verification",
                            "severity": "HIGH",
                            "title": "Invalid or Tampered PDF Digital Signature",
                            "detail": f"Cryptographic digital signature field '{sig.get('field_name')}' failed integrity check on {doc_name}.",
                            "tool": "pyHanko PKI Signature Validator",
                            "documentRef": doc_name,
                            "verificationStatus": "Discrepancy",
                            "evidence": {
                                "documentName": doc_name,
                                "methodUsed": "pyHanko Cryptographic ByteRange Verification",
                                "description": f"Signer: {sig.get('signer')}. Signature integrity verification returned invalid."
                            }
                        })

    return findings
