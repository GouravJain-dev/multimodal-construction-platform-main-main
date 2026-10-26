import io
import base64
from PIL import Image, ImageDraw, ImageFont

def generate_synthetic_image(title: str, subtitle: str, color_scheme: str = "safety") -> str:
    """Generate a clean synthetic visual representing a construction scene or crack scan."""
    width, height = 800, 500
    if color_scheme == "safety":
        bg_color = (28, 30, 36)
        accent_color = (245, 158, 11) # Amber / Caution
        grid_color = (40, 44, 52)
    elif color_scheme == "crack":
        bg_color = (45, 48, 55) # Concrete Gray
        accent_color = (239, 68, 68) # Red / Crack
        grid_color = (60, 64, 72)
    else:
        bg_color = (20, 24, 30)
        accent_color = (59, 130, 246) # Blue
        grid_color = (35, 40, 50)
        
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw architectural grid lines
    for x in range(0, width, 50):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    for y in range(0, height, 50):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)
        
    # Draw scene elements
    if color_scheme == "safety":
        # Draw scaffolding outline
        draw.rectangle([100, 150, 700, 420], outline=(100, 116, 139), width=3)
        draw.line([(100, 240), (700, 240)], fill=(100, 116, 139), width=2)
        draw.line([(100, 330), (700, 330)], fill=(100, 116, 139), width=2)
        draw.line([(100, 150), (400, 420)], fill=(71, 85, 105), width=2)
        draw.line([(400, 150), (700, 420)], fill=(71, 85, 105), width=2)
        
        # Draw worker bounding boxes (simulated detection)
        # Compliant worker
        draw.rectangle([160, 250, 220, 330], outline=(34, 197, 94), width=3) # Green
        draw.text((165, 230), "WORKER #1: PPE OK", fill=(34, 197, 94))
        
        # Non-compliant worker
        draw.rectangle([480, 160, 550, 240], outline=(239, 68, 68), width=3) # Red
        draw.text((470, 140), "VIOLATION: NO HARNESS", fill=(239, 68, 68))
        
        # Hazard zone: Unprotected edge
        draw.rectangle([600, 150, 690, 240], outline=(245, 158, 11), width=2)
        draw.text((580, 245), "HAZARD: OPEN EDGE", fill=(245, 158, 11))

    elif color_scheme == "crack":
        # Draw concrete beam texture
        draw.rectangle([100, 180, 700, 340], fill=(55, 60, 68), outline=(148, 163, 184), width=2)
        # Draw diagonal shear crack
        crack_points = [
            (240, 340), (280, 300), (320, 275), (360, 250), 
            (410, 220), (460, 195), (500, 180)
        ]
        for i in range(len(crack_points) - 1):
            draw.line([crack_points[i], crack_points[i+1]], fill=(239, 68, 68), width=4)
            # Secondary micro-fissures
            draw.line([crack_points[i], (crack_points[i][0] + 10, crack_points[i][1] - 8)], fill=(239, 68, 68), width=2)
            
        draw.rectangle([220, 170, 520, 350], outline=(245, 158, 11), width=2)
        draw.text((230, 360), "DETECTED: 45° SHEAR CRACK (WIDTH: ~2.4mm)", fill=(245, 158, 11))
        draw.text((230, 150), "REINFORCED CONCRETE BEAM - SECTION B-B", fill=(203, 213, 225))

    # Header title banner
    draw.rectangle([0, 0, width, 50], fill=(15, 23, 42))
    draw.text((20, 16), f"MULTIMODAL VISION SCAN: {title.upper()}", fill=(248, 250, 252))
    draw.text((20, 465), f"STATUS: {subtitle} | ISO 45001 & ACI 318 VERIFIED", fill=(148, 163, 184))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

# Pre-generated sample scenarios
SAMPLE_SAFETY_IMAGE = generate_synthetic_image("Tower Scaffolding Elevation", "High-Risk Fall Zone Detected", "safety")
SAMPLE_CRACK_IMAGE = generate_synthetic_image("RC Transfer Beam Support", "Severe Shear Stress Fracture", "crack")
