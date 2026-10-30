from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Query
from fastapi.responses import Response, FileResponse
from pydantic import BaseModel
from typing import Optional
from services.pdf_service import generate_ai_report_pdf, generate_claim_receipt_pdf
from services.excel_service import export_claims_to_excel
from services.database import get_collection
import os

router = APIRouter()

class AIReportRequest(BaseModel):
    crop_type: str
    damage_type: str
    severity_percentage: int
    overall_assessment: str
    image_path: Optional[str] = None

def remove_temp_file(filepath: str):
    """Safely cleans up temporary Excel file post-delivery."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Cleaned up temporary export Excel: {filepath}")
    except Exception as e:
        print(f"Error removing temporary Excel file: {e}")

@router.post("/reports/ai")
async def get_ai_report_pdf(request_data: AIReportRequest):
    """Generates and streams the AI Crop Diagnosis Report as a PDF file."""
    try:
        data = request_data.model_dump()
        pdf_bytes = generate_ai_report_pdf(data)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=crop_health_report.pdf"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate AI report PDF: {str(e)}"
        )

@router.get("/reports/claim/{claim_id}")
async def get_claim_receipt_pdf(claim_id: str):
    """Fetches a claim record and generates/streams its PDF receipt."""
    try:
        claims_collection = get_collection("claims")
        claim = await claims_collection.find_one({"claim_id": claim_id})
        
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim record with ID {claim_id} not found."
            )
            
        pdf_bytes = generate_claim_receipt_pdf(claim)
        
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=claim_receipt_{claim_id}.pdf"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate claim receipt PDF: {str(e)}"
        )

@router.get("/reports/export-claims")
async def export_claims(
    background_tasks: BackgroundTasks,
    state: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status")
):
    """Queries claims with optional filters and streams them as an Excel file."""
    try:
        filters = {
            "state": state,
            "crop": crop,
            "status": status_filter
        }
        
        excel_path = await export_claims_to_excel(filters)
        
        # Schedule cleanup after transmission
        background_tasks.add_task(remove_temp_file, excel_path)
        
        return FileResponse(
            excel_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="claims_report.xlsx"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export claims to Excel: {str(e)}"
        )
