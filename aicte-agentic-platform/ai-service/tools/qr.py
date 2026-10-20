import os
from PIL import Image

def detect_qr_code(file_path: str) -> dict:
    """
    Scans document or image for embedded 2D QR codes.
    Returns decoded data, format, and bounding coordinates.
    """
    try:
        if file_path.lower().endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                if len(pdf.pages) == 0:
                    return {"detected": False, "payload": None}
                pil_image = pdf.pages[0].to_image(resolution=150).original
        else:
            pil_image = Image.open(file_path)

        # Attempt pyzbar detection
        try:
            from pyzbar.pyzbar import decode
            decoded_objects = decode(pil_image)
            if decoded_objects:
                obj = decoded_objects[0]
                payload_str = obj.data.decode("utf-8", errors="ignore")
                rect = obj.rect
                return {
                    "detected": True,
                    "payload": payload_str,
                    "type": str(obj.type),
                    "boundingBox": {
                        "x": rect.left,
                        "y": rect.top,
                        "width": rect.width,
                        "height": rect.height
                    }
                }
        except ImportError:
            pass

        # Fallback to OpenCV QRCodeDetector
        try:
            import cv2
            import numpy as np
            cv_img = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
            detector = cv2.QRCodeDetector()
            data, bbox, _ = detector.detectAndDecode(cv_img)
            if data:
                return {
                    "detected": True,
                    "payload": data,
                    "type": "QRCODE",
                    "boundingBox": None
                }
        except Exception:
            pass

        return {"detected": False, "payload": None}
    except Exception as e:
        return {"detected": False, "payload": None, "error": str(e)}
