import base64
import io
from PIL import Image
from fastapi import HTTPException, UploadFile

SUPPORTED_FORMATS = {"JPEG", "JPG", "PNG", "WEBP"}
MAX_DIMENSION = 2048

def load_image_from_bytes(data: bytes) -> Image.Image:
    """Validate and open image from raw bytes."""
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        # Re-open after verify() because verify clears the buffer
        img = Image.open(io.BytesIO(data))
        if img.format and img.format.upper() not in SUPPORTED_FORMATS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported image format: {img.format}. Allowed: {', '.join(SUPPORTED_FORMATS)}"
            )
        return img
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid or corrupted image data: {str(e)}")

def load_image_from_base64(b64_string: str) -> Image.Image:
    """Decode base64 string (handles data URL prefixes)."""
    try:
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        decoded_bytes = base64.b64decode(b64_string)
        return load_image_from_bytes(decoded_bytes)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode base64 image: {str(e)}")

def resize_for_inference(image: Image.Image, max_dim: int = MAX_DIMENSION) -> Image.Image:
    """Resize image proportionally if width or height exceeds max_dim."""
    w, h = image.size
    if w <= max_dim and h <= max_dim:
        return image
    
    if w > h:
        new_w = max_dim
        new_h = int(h * (max_dim / w))
    else:
        new_h = max_dim
        new_w = int(w * (max_dim / h))
        
    return image.resize((new_w, new_h), Image.Resampling.LANCZOS)

def image_to_bytes(image: Image.Image, fmt: str = "JPEG") -> bytes:
    """Convert PIL image back to bytes."""
    buf = io.BytesIO()
    if image.mode in ("RGBA", "P") and fmt.upper() in ("JPEG", "JPG"):
        image = image.convert("RGB")
    image.save(buf, format=fmt, quality=85)
    return buf.getvalue()
