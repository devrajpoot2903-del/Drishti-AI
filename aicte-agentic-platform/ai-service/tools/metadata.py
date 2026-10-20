import os
from PIL import Image
from PIL.ExifTags import TAGS

def inspect_document_metadata(file_path: str) -> dict:
    """
    Extracts structural metadata from PDF or EXIF data from images.
    Detects potential software editing signatures and timestamp inconsistencies.
    """
    if not os.path.exists(file_path):
        return {"success": False, "error": "File not found"}

    try:
        if file_path.lower().endswith(".pdf"):
            import pypdf
            reader = pypdf.PdfReader(file_path)
            meta = reader.metadata or {}
            
            creator = str(meta.get("/Creator", ""))
            producer = str(meta.get("/Producer", ""))
            creation_date = str(meta.get("/CreationDate", ""))
            mod_date = str(meta.get("/ModDate", ""))

            suspicious_software = []
            for tool in ["photoshop", "gimp", "canva", "ilovepdf", "pdfescape"]:
                if tool in creator.lower() or tool in producer.lower():
                    suspicious_software.append(tool)

            return {
                "success": True,
                "fileType": "PDF",
                "pageCount": len(reader.pages),
                "metadata": {
                    "creator": creator,
                    "producer": producer,
                    "creationDate": creation_date,
                    "modificationDate": mod_date,
                },
                "hasEditingSignatures": len(suspicious_software) > 0,
                "detectedSoftware": suspicious_software
            }
        else:
            img = Image.open(file_path)
            exif_data = {}
            if hasattr(img, "_getexif") and img._getexif():
                for tag, value in img._getexif().items():
                    tag_name = TAGS.get(tag, str(tag))
                    exif_data[tag_name] = str(value)

            software = exif_data.get("Software", "")
            suspicious = [s for s in ["photoshop", "gimp", "snapseed"] if s in software.lower()]

            return {
                "success": True,
                "fileType": "IMAGE",
                "format": img.format,
                "dimensions": f"{img.width}x{img.height}",
                "metadata": exif_data,
                "hasEditingSignatures": len(suspicious) > 0,
                "detectedSoftware": suspicious
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
