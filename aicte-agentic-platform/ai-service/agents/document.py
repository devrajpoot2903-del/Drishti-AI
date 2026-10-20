import os
from tools.ocr import extract_text_and_fields
from tools.preprocessing import preprocess_image

def run_document_agent(documents: list, storage_base_dir: str = "../storage/documents") -> list:
    """
    Document Agent: Extracts text and tabular fields from all submitted files.
    Preprocesses rasterized/scanned files using OpenCV/PIL.
    """
    results = []

    for doc in documents:
        file_path = doc.get("storagePath")
        if not file_path or not os.path.isabs(file_path):
            file_path = os.path.join(storage_base_dir, doc.get("name", ""))

        if not os.path.exists(file_path):
            results.append({
                "documentId": doc.get("id"),
                "name": doc.get("name"),
                "ocrStatus": "FAILED",
                "error": "File not found at designated storage path",
                "extractedText": "",
                "extractedFields": {}
            })
            continue

        # Optional preprocessing for images
        if file_path.lower().endswith((".png", ".jpg", ".jpeg")):
            processed_path = preprocess_image(file_path)
            extraction = extract_text_and_fields(processed_path)
        else:
            extraction = extract_text_and_fields(file_path)

        results.append({
            "documentId": doc.get("id"),
            "name": doc.get("name"),
            "ocrStatus": "EXTRACTED" if extraction.get("success") else "FAILED",
            "isScanned": extraction.get("isScanned", False),
            "confidence": extraction.get("confidence", 90.0),
            "extractedText": extraction.get("text", ""),
            "extractedFields": extraction.get("fields", {})
        })

    return results
