import os
import uuid
from tools.ela import generate_ela_heatmap
from tools.phash import calculate_phash, compare_phash
from tools.metadata import inspect_document_metadata

def run_forensics_agent(
    documents: list,
    existing_documents: list = None,
    existing_faculty_ids: list = None,
    storage_dir: str = "../storage"
) -> list:
    """
    Forensics Agent:
    - Level 1: Visual & File Analysis (ELA, pHash, metadata)
    - Level 2: Semantic Cross-Checking (Faculty ID duplication, certificate reuse)
    """
    findings = []
    evidence_dir = os.path.join(storage_dir, "evidence")
    os.makedirs(evidence_dir, exist_ok=True)

    existing_docs = existing_documents or []
    known_faculty = set(existing_faculty_ids or [])

    for doc in documents:
        file_path = doc.get("storagePath")
        if not file_path or not os.path.exists(file_path):
            file_path = os.path.join(storage_dir, "documents", doc.get("name", ""))

        if not os.path.exists(file_path):
            continue

        doc_name = doc.get("name", "")

        # --- Level 1: File & Visual Analysis ---

        # 1. ELA Heatmap (for JPEG/PNG files)
        if file_path.lower().endswith((".jpg", ".jpeg", ".png")):
            ela_result = generate_ela_heatmap(file_path, output_dir=evidence_dir)
            if ela_result.get("success") and ela_result.get("isSuspicious"):
                finding_id = str(uuid.uuid4())
                findings.append({
                    "id": finding_id,
                    "category": "Forensics",
                    "severity": "HIGH",
                    "title": "Compression Artifact Anomaly Detected via ELA",
                    "detail": f"Error Level Analysis variance score {ela_result['anomalyScore']} exceeds 0.70 threshold on {doc_name}.",
                    "tool": "OpenCV Error Level Analysis",
                    "confidence": int(ela_result["anomalyScore"] * 100),
                    "documentRef": doc_name,
                    "verificationStatus": "Discrepancy",
                    "evidence": {
                        "documentName": doc_name,
                        "methodUsed": "Error Level Analysis (ELA 90% Quality Delta)",
                        "description": f"High error variance detected (mean diff: {ela_result['meanDifference']}, max dev: {ela_result['maxDeviation']}).",
                        "heatmapUrl": f"/storage/evidence/{os.path.basename(ela_result['heatmapPath'])}",
                        "confidence": int(ela_result["anomalyScore"] * 100)
                    }
                })

        # 2. Perceptual Hash (pHash) Duplicate Check
        phash_res = calculate_phash(file_path)
        if phash_res.get("success") and phash_res.get("phash"):
            current_phash = phash_res["phash"]
            for ex in existing_docs:
                if ex.get("id") != doc.get("id") and ex.get("phash"):
                    dist = compare_phash(current_phash, ex["phash"])
                    if dist <= 5:
                        finding_id = str(uuid.uuid4())
                        findings.append({
                            "id": finding_id,
                            "category": "Forensics",
                            "severity": "HIGH",
                            "title": "Perceptual Near-Duplicate Document Detected",
                            "detail": f"Visual pHash similarity (Hamming distance {dist}/64) matches existing file {ex.get('name')}.",
                            "tool": "imagehash (Perceptual Hash)",
                            "confidence": int((1.0 - dist / 64.0) * 100),
                            "documentRef": doc_name,
                            "verificationStatus": "Discrepancy",
                            "evidence": {
                                "documentName": doc_name,
                                "methodUsed": "Perceptual Hash (64-bit DCT)",
                                "description": f"Near-identical image features (Hamming distance: {dist}) matched against repository.",
                                "confidence": int((1.0 - dist / 64.0) * 100)
                            }
                        })

        # 3. Metadata Editing Signatures
        meta_res = inspect_document_metadata(file_path)
        if meta_res.get("success") and meta_res.get("hasEditingSignatures"):
            software_list = ", ".join(meta_res.get("detectedSoftware", []))
            finding_id = str(uuid.uuid4())
            findings.append({
                "id": finding_id,
                "category": "Forensics",
                "severity": "MEDIUM",
                "title": "Image Editing Software Signature in File Metadata",
                "detail": f"File metadata on {doc_name} reveals creation or modification with: {software_list}.",
                "tool": "Metadata Inspector",
                "documentRef": doc_name,
                "verificationStatus": "Discrepancy",
                "evidence": {
                    "documentName": doc_name,
                    "methodUsed": "EXIF/PDF Metadata Parsing",
                    "description": f"Editing software signatures detected in producer tags: {software_list}."
                }
            })

        # --- Level 2: Semantic Cross-Checking ---
        extracted_fields = doc.get("extractedFields", {})
        faculty_ids = extracted_fields.get("facultyIdentifiers", [])
        for fid in faculty_ids:
            if fid in known_faculty:
                finding_id = str(uuid.uuid4())
                findings.append({
                    "id": finding_id,
                    "category": "Compliance",
                    "severity": "HIGH",
                    "title": "Cross-Institutional Faculty UID Duplicate",
                    "detail": f"Faculty identifier {fid} in {doc_name} is already registered on another active institutional roster.",
                    "tool": "Semantic Cross-Matcher",
                    "confidence": 99,
                    "documentRef": doc_name,
                    "verificationStatus": "Discrepancy",
                    "evidence": {
                        "documentName": doc_name,
                        "methodUsed": "Database Identifier Cross-Deduplication",
                        "description": f"Unique faculty identifier {fid} claimed by multiple technical institutions."
                    }
                })

    return findings
