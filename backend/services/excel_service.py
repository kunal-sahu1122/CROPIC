import os
import uuid
import pandas as pd
from services.database import get_collection

async def export_claims_to_excel(filters: dict = None) -> str:
    """
    Fetches claims from the database, applies optional filters,
    and exports them to an Excel (.xlsx) file.
    Returns the absolute path of the generated Excel file.
    """
    claims_collection = get_collection("claims")
    
    # Base query
    query = {}
    
    # Fetch all records first (or do filtering in database)
    cursor = claims_collection.find(query)
    claims = await cursor.to_list(length=1000)
    
    # Format and flatten MongoDB document structure
    flattened_claims = []
    for claim in claims:
        fd = claim.get("farmer_details", {})
        cd = claim.get("crop_details", {})
        ai_det = claim.get("ai_damage_details", {})
        
        flat_record = {
            "Claim ID": claim.get("claim_id", "N/A"),
            "Date Submitted": claim.get("created_at", "N/A")[:10] if claim.get("created_at") else "N/A",
            "Farmer Name": fd.get("farmer_name", "N/A"),
            "Mobile": fd.get("mobile", "N/A"),
            "State": fd.get("state", "N/A"),
            "District": fd.get("district", "N/A"),
            "Village": fd.get("village", "N/A"),
            "Crop": cd.get("crop_name", "N/A"),
            "Crop Stage": cd.get("crop_stage", "N/A"),
            "Field Area (Acres)": cd.get("field_area", "N/A"),
            "Disease Detected": ai_det.get("disease", "N/A"),
            "Severity (%)": f"{ai_det.get('severity', 0)}%",
            "Risk Category": ai_det.get("risk", "Low"),
            "Status": claim.get("status", "Submitted")
        }
        flattened_claims.append(flat_record)
        
    # Convert list of flat dicts to pandas DataFrame
    df = pd.DataFrame(flattened_claims)
    
    # Apply optional in-memory filters (helps keep logic uniform for both local json & MongoDB)
    if filters and not df.empty:
        if filters.get("state"):
            df = df[df["State"].str.lower() == filters["state"].lower()]
        if filters.get("crop"):
            df = df[df["Crop"].str.lower() == filters["crop"].lower()]
        if filters.get("status"):
            df = df[df["Status"].str.lower() == filters["status"].lower()]

    # Ensure temp dir exists
    temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    # Generate unique Excel filename
    temp_filename = f"claims_export_{uuid.uuid4().hex}.xlsx"
    temp_path = os.path.join(temp_dir, temp_filename)
    
    # If dataframe is empty, create a dummy sheet with headers
    if df.empty:
        df = pd.DataFrame(columns=[
            "Claim ID", "Date Submitted", "Farmer Name", "Mobile", "State", "District", "Village",
            "Crop", "Crop Stage", "Field Area (Acres)", "Disease Detected", "Severity (%)", "Risk Category", "Status"
        ])
        
    # Write to Excel using openpyxl engine
    df.to_excel(temp_path, index=False)
    
    return temp_path
