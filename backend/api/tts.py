from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from services.tts_service import generate_report_audio
import os

router = APIRouter()

def remove_file(filepath: str):
    """Safely removes the temporary audio file after response delivery."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Cleaned up temporary audio: {filepath}")
    except Exception as e:
        print(f"Error removing temporary audio file: {e}")

@router.get("/text-to-speech")
async def get_text_to_speech(
    crop_type: str,
    damage_type: str,
    severity: int,
    risk: str,
    lang: str = "hi",
    background_tasks: BackgroundTasks = None
):
    """
    Exposes an endpoint to generate and stream the crop health voice report.
    Deletes the temporary file after delivery.
    """
    if lang not in ["en", "hi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported languages are 'en' (English) or 'hi' (Hindi)"
        )
        
    try:
        # Generate the audio file path
        filepath = generate_report_audio(crop_type, damage_type, severity, risk, lang)
        
        # Schedule cleanup background task
        if background_tasks:
            background_tasks.add_task(remove_file, filepath)
            
        return FileResponse(
            filepath, 
            media_type="audio/mpeg", 
            filename=os.path.basename(filepath)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate text-to-speech: {str(e)}"
        )
