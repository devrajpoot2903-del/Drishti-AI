import os
import io
import numpy as np
from PIL import Image, ImageChops, ImageEnhance

def generate_ela_heatmap(
    image_path: str,
    output_dir: str = "../storage/evidence",
    quality: int = 90,
    scale: int = 15
) -> dict:
    """
    Performs Error Level Analysis (ELA) on an image file.
    Saves the ELA heatmap artifact and returns calculated anomaly variance.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = os.path.basename(image_path)
    base_name = os.path.splitext(filename)[0]
    output_heatmap_path = os.path.join(output_dir, f"ela_{base_name}.png")

    try:
        original = Image.open(image_path).convert("RGB")

        # Compress to temporary buffer at target quality
        buffer = io.BytesIO()
        original.save(buffer, "JPEG", quality=quality)
        buffer.seek(0)
        recompressed = Image.open(buffer)

        # Compute difference
        diff = ImageChops.difference(original, recompressed)

        # Scale difference to highlight high-frequency artifacts
        extrema = diff.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        scale_factor = scale if max_diff == 0 else int(255.0 / max_diff)
        enhanced_diff = ImageEnhance.Brightness(diff).enhance(scale_factor)

        # Save heatmap
        enhanced_diff.save(output_heatmap_path, "PNG")

        # Calculate numerical anomaly score from difference variance
        diff_arr = np.array(diff, dtype=np.float32)
        mean_diff = float(np.mean(diff_arr))
        max_deviation = float(np.max(diff_arr))

        # Normalized anomaly score between 0.0 and 1.0
        anomaly_score = round(min(1.0, (mean_diff * 4.0 + max_deviation) / 100.0), 2)

        return {
            "success": True,
            "heatmapPath": output_heatmap_path,
            "anomalyScore": anomaly_score,
            "meanDifference": round(mean_diff, 2),
            "maxDeviation": round(max_deviation, 2),
            "isSuspicious": anomaly_score >= 0.70
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "anomalyScore": 0.0,
            "isSuspicious": False
        }
