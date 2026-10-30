from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from services.ai_inference import analyze_crop_image
from api.claims import router as claims_router
from api.auth import router as auth_router
from api.tts import router as tts_router
from api.reports import router as reports_router
import uuid
import os

router = APIRouter()
router.include_router(claims_router)
router.include_router(auth_router, prefix="/auth", tags=["auth"])
router.include_router(tts_router)
router.include_router(reports_router)




# Temporary storage for uploaded images during processing
UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail=f"Invalid file format for {file.filename}. Only JPG/PNG allowed.")

    # Save the file temporarily
    file_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1]
    temp_file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_ext}")
    
    try:
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        # Run AI Inference (YOLOv8 + MobileNetV2 logic)
        result = await analyze_crop_image(temp_file_path)
        
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
        
    finally:
        # Cleanup temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
