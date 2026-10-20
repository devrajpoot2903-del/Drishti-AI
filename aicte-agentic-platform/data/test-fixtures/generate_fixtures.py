"""
Script to generate explicitly labeled synthetic test fixtures for automated testing.
These files are used exclusively in test suites and are labeled as SYNTHETIC DEMO FIXTURES.
"""
import os
from PIL import Image, ImageDraw, ImageFont

FIXTURES_DIR = os.path.dirname(os.path.abspath(__file__))

def create_synthetic_fire_noc_image():
    # Create a 800x1000 synthetic certificate image
    img = Image.new("RGB", (800, 1000), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    # Draw header
    draw.rectangle([20, 20, 780, 980], outline=(15, 23, 42), width=3)
    draw.rectangle([30, 30, 770, 970], outline=(226, 232, 240), width=1)

    # Watermark
    draw.text((160, 450), "SYNTHETIC TEST FIXTURE ONLY", fill=(240, 240, 240))

    # Title
    draw.text((220, 80), "STATE FIRE SERVICE DEPARTMENT", fill=(15, 23, 42))
    draw.text((240, 110), "FIRE SAFETY CERTIFICATE (NOC)", fill=(79, 70, 229))
    draw.text((280, 140), "NOC Ref: NOC-FIRE-2026-DEL-9912", fill=(100, 116, 139))

    # Body
    text_lines = [
        "This is a SYNTHETIC TEST FIXTURE for AICTE platform automated tests.",
        "Institution: Apex Institute of Technology, Greater Noida",
        "Campus Site: Plot No. 12, Sector Knowledge Park III, Greater Noida",
        "Total Built-up Area Inspected: 18,500 sq. meters",
        "Issued Date: 15-Jan-2026",
        "Valid Till: 14-Jan-2027",
        "Fire Safety Systems: Wet Risers, Yard Hydrants, Smoke Alarms, Automatic Sprinklers",
        "Clearance Status: SATISFACTORY AND APPROVED UNDER NATIONAL BUILDING CODE",
        "Issuing Authority: Chief Fire Officer (Synthetic Division)"
    ]

    y = 220
    for line in text_lines:
        draw.text((60, y), line, fill=(30, 41, 59))
        y += 45

    # Signature box
    draw.rectangle([480, 750, 720, 850], outline=(148, 163, 184), width=1)
    draw.text((500, 860), "Authorized Fire Officer Signature", fill=(100, 116, 139))
    draw.line([(510, 810), (690, 810)], fill=(79, 70, 229), width=2)

    output_path = os.path.join(FIXTURES_DIR, "synthetic_fire_noc.png")
    img.save(output_path, "PNG")
    print(f"Generated {output_path}")

def create_synthetic_altered_image():
    # Create JPEG image for ELA testing with a manipulated region
    img = Image.new("RGB", (600, 400), color=(250, 250, 250))
    draw = ImageDraw.Draw(img)

    draw.rectangle([20, 20, 580, 380], outline=(0, 0, 0), width=2)
    draw.text((50, 50), "LAND AREA TITLE CERTIFICATE", fill=(0, 0, 0))
    draw.text((50, 100), "Recorded Area: 8.5 Acres", fill=(0, 0, 0))

    # Save initial low quality
    temp_path = os.path.join(FIXTURES_DIR, "temp_clean.jpg")
    img.save(temp_path, "JPEG", quality=85)

    # Re-open and paste an uncompressed patch to create an ELA compression differential
    reopened = Image.open(temp_path).convert("RGB")
    patch = Image.new("RGB", (180, 50), color=(255, 255, 0))
    patch_draw = ImageDraw.Draw(patch)
    patch_draw.text((10, 15), "MODIFIED: 15.0 Acres", fill=(255, 0, 0))
    reopened.paste(patch, (45, 95))

    final_path = os.path.join(FIXTURES_DIR, "synthetic_altered_land.jpg")
    reopened.save(final_path, "JPEG", quality=90)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    print(f"Generated {final_path}")

if __name__ == "__main__":
    create_synthetic_fire_noc_image()
    create_synthetic_altered_image()
