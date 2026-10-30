from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FarmerDetails(BaseModel):
    farmer_name: str = Field(..., description="Name of the farmer filing the claim")
    mobile: str = Field(..., description="Contact number of the farmer")
    state: str = Field(..., description="State of the crop field")
    district: str = Field(..., description="District of the crop field")
    village: str = Field(..., description="Village of the crop field")

class CropDetails(BaseModel):
    crop_name: str = Field(..., description="Type of the crop")
    crop_stage: str = Field(..., description="Growth stage of the crop")
    field_area: str = Field(..., description="Area of the crop field (e.g. 5 Acres)")

class AIDamageDetails(BaseModel):
    disease: str = Field(..., description="Disease detected by AI")
    severity: int = Field(..., description="Damage severity percentage detected by AI")
    risk: str = Field(..., description="Risk category detected by AI")
    claim_eligible: bool = Field(..., description="Eligibility for PMFBY claim based on severity")

class ClaimSubmitRequest(BaseModel):
    farmer_details: FarmerDetails
    crop_details: CropDetails
    ai_damage_details: AIDamageDetails
    description: str = Field(..., description="Detailed description of damage by farmer")
    damage_date: str = Field(..., description="Date of damage observation")
    additional_notes: Optional[str] = Field("", description="Any other additional notes")
    image_path: Optional[str] = Field("", description="Main crop image path")
    additional_images: Optional[List[str]] = Field(default=[], description="Optional additional image paths")
    status: Optional[str] = Field("Submitted", description="Initial status of the claim")
    created_at: Optional[str] = Field(None, description="ISO timestamp of claim submission")
