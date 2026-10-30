from fastapi import APIRouter, HTTPException, status, Depends
from models.claim_model import ClaimSubmitRequest
from services.database import get_collection
from api.auth import get_current_user
from datetime import datetime
from pydantic import BaseModel
from typing import Literal
import uuid

router = APIRouter()

class ClaimActionRequest(BaseModel):
    action: Literal["Submitted", "Under Review", "Inspection Pending", "Approved", "Rejected", "Completed"]

@router.post("/submit-claim")
async def submit_claim(claim: ClaimSubmitRequest, current_user: dict = Depends(get_current_user)):
    # Farmers only can file claims
    if current_user.get("role") != "farmer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only farmers can submit claims."
        )
        
    try:
        claims_collection = get_collection("claims")
        
        # Convert Pydantic object to dict
        claim_data = claim.model_dump() # Pydantic v2 uses model_dump instead of dict
        
        # Generate sequential ID CLM-YYYY-XXX
        count = await claims_collection.count_documents({})
        claim_data["claim_id"] = f"CLM-{datetime.utcnow().year}-{(count + 1):03d}"
        claim_data["status"] = "Submitted"
        claim_data["user_email"] = current_user.get("email") # Link claim to logged-in user
        
        # Add timestamp if not provided
        if not claim_data.get("created_at"):
            claim_data["created_at"] = datetime.utcnow().isoformat()
            
        # Insert into database (handles MongoDB or local JSON fallback)
        await claims_collection.insert_one(claim_data)
        
        # Remove MongoDB ObjectId or convert it to string for JSON serialization
        if "_id" in claim_data:
            claim_data["_id"] = str(claim_data["_id"])
            
        return {
            "success": True,
            "message": "Claim submitted successfully!",
            "claim_id": claim_data["claim_id"],
            "claim": claim_data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit claim: {str(e)}"
        )

@router.get("/claims")
async def get_claims(current_user: dict = Depends(get_current_user)):
    try:
        claims_collection = get_collection("claims")
        
        if current_user.get("role") == "officer":
            # Officers can see all claims
            cursor = claims_collection.find({})
        else:
            # Farmers can only see their own claims
            cursor = claims_collection.find({"user_email": current_user.get("email")})

            
        claims = await cursor.to_list(length=200)
        
        # Format claims for response
        for claim in claims:
            if "_id" in claim:
                claim["_id"] = str(claim["_id"])
                
        return {
            "success": True,
            "claims": claims
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch claims: {str(e)}"
        )

@router.put("/claims/{claim_id}/status")
@router.post("/claims/{claim_id}/action")
async def process_claim(
    claim_id: str, 
    action_data: ClaimActionRequest, 
    current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "officer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only insurance officers can approve/reject claims."
        )
        
    try:
        claims_collection = get_collection("claims")
        
        # Find if claim exists
        claim = await claims_collection.find_one({"claim_id": claim_id})
        if not claim:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Claim with ID {claim_id} not found."
            )
            
        # Update status in DB
        await claims_collection.update_one(
            {"claim_id": claim_id}, 
            {"$set": {"status": action_data.action}}
        )
        
        return {
            "success": True,
            "message": f"Claim status updated to {action_data.action} successfully!"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process claim: {str(e)}"
        )
