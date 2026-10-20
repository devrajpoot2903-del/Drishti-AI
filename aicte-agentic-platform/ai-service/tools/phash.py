import os
from PIL import Image

try:
    import imagehash
    HAS_IMAGEHASH = True
except ImportError:
    HAS_IMAGEHASH = False

def calculate_phash(file_path: str) -> dict:
    """
    Computes 64-bit perceptual hash (pHash) for an image or PDF first page.
    """
    try:
        if file_path.lower().endswith(".pdf"):
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                if len(pdf.pages) > 0:
                    page_img = pdf.pages[0].to_image(resolution=100).original
                else:
                    return {"success": False, "error": "Empty PDF"}
        else:
            page_img = Image.open(file_path).convert("RGB")

        if HAS_IMAGEHASH:
            hash_val = str(imagehash.phash(page_img))
        else:
            # Fallback average luminance 16x16 hash if imagehash not installed
            resized = page_img.resize((8, 8)).convert("L")
            pixels = list(resized.getdata())
            avg = sum(pixels) / len(pixels)
            bits = "".join(["1" if p > avg else "0" for p in pixels])
            hash_val = hex(int(bits, 2))[2:].zfill(16)

        return {
            "success": True,
            "phash": hash_val
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "phash": None
        }

def compare_phash(hash1: str, hash2: str) -> int:
    """
    Returns Hamming distance between two perceptual hashes.
    Distance <= 5 signifies near-identical visual content.
    """
    if not hash1 or not hash2:
        return 64
    try:
        bin1 = bin(int(hash1, 16))[2:].zfill(64)
        bin2 = bin(int(hash2, 16))[2:].zfill(64)
        return sum(c1 != c2 for c1, c2 in zip(bin1, bin2))
    except Exception:
        return 64
