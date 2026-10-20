import os
import numpy as np
from PIL import Image, ImageEnhance, ImageOps

def preprocess_image(image_path: str, output_path: str = None) -> str:
    """
    Applies image preprocessing: grayscale conversion, contrast enhancement,
    and automatic orientation normalization.
    """
    if output_path is None:
        base, ext = os.path.splitext(image_path)
        output_path = f"{base}_preprocessed{ext}"

    try:
        with Image.open(image_path) as img:
            # Normalize orientation from EXIF
            img = ImageOps.exif_transpose(img)
            
            # Convert to Grayscale
            gray = img.convert("L")
            
            # Enhance Contrast
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(1.5)
            
            # Save preprocessed image
            enhanced.save(output_path)
            return output_path
    except Exception as e:
        print(f"Error during preprocessing {image_path}: {e}")
        return image_path
