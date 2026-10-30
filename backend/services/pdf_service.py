import os
import base64
import uuid
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# Helper to decode and save base64 image locally for PDF insertion
def save_base64_temp_image(base64_str: str) -> str:
    if not base64_str:
        return None
    try:
        # Extract base64 payload if it has the data URI schema prefix
        if "," in base64_str:
            base64_str = base64_str.split(",")[1]
        img_data = base64.b64decode(base64_str)
        
        # Ensure temp directory exists
        temp_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "temp_uploads")
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_filename = f"pdf_img_{uuid.uuid4().hex}.png"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        with open(temp_path, "wb") as f:
            f.write(img_data)
        return temp_path
    except Exception as e:
        print(f"Error saving temp base64 image: {e}")
        return None

def generate_ai_report_pdf(data: dict) -> bytes:
    """Generates an AI Diagnosis PDF Report as bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Typography and Colors
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#1b4332'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#52b788'),
        spaceAfter=12
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#2d6a4f'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    table_label_style = ParagraphStyle(
        'TableLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#333333')
    )
    
    table_value_style = ParagraphStyle(
        'TableValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#555555')
    )

    content = []
    
    # Title & Branding header
    content.append(Paragraph("CROPIC AI REPORT", title_style))
    content.append(Paragraph("Real-Time Crop Image Analytics & Assessment Summary", subtitle_style))
    
    # Separator Line
    line_data = [['']]
    line_table = Table(line_data, colWidths=[540], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2d6a4f')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    content.append(line_table)
    content.append(Spacer(1, 10))
    
    # AI Diagnosis Table
    content.append(Paragraph("1. Crop Health Diagnostics", section_heading))
    severity_pct = int(data.get('severity_percentage', data.get('severity', 0)))
    risk_lvl = data.get('overall_assessment', data.get('risk', 'Low'))
    crop = data.get('crop_type', 'Unknown')
    disease = data.get('damage_type', 'No Damage')
    claim_eligible = "Eligible for Claim (Severity >= 30%)" if severity_pct >= 30 else "Not Eligible for Claim (Severity < 30%)"
    
    diag_data = [
        [Paragraph("Crop Type", table_label_style), Paragraph(crop, table_value_style)],
        [Paragraph("Detected Condition / Damage Type", table_label_style), Paragraph(disease, table_value_style)],
        [Paragraph("Damage Severity Percentage", table_label_style), Paragraph(f"{severity_pct}%", table_value_style)],
        [Paragraph("Overall Risk Category", table_label_style), Paragraph(f"{risk_lvl} Risk", table_value_style)],
        [Paragraph("Insurance Dispatch Assessment", table_label_style), Paragraph(claim_eligible, table_value_style)],
    ]
    
    diag_table = Table(diag_data, colWidths=[200, 340])
    diag_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#dddddd')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (1,0), (1,-1), colors.white),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    content.append(diag_table)
    content.append(Spacer(1, 10))
    
    # Crop Specimen Image Insertion
    image_path = None
    if data.get('image_path'):
        image_path = save_base64_temp_image(data.get('image_path'))
        
    if image_path and os.path.exists(image_path):
        content.append(Paragraph("2. Captured Crop Specimen Image", section_heading))
        try:
            # Scale image dynamically to maintain document structure
            img = Image(image_path, width=220, height=165)
            img.hAlign = 'LEFT'
            content.append(img)
            content.append(Spacer(1, 10))
        except Exception as img_err:
            print(f"Error drawing PDF Image: {img_err}")
            
    # Recommendations Block
    content.append(Paragraph("3. Recommendations & Advisory Action", section_heading))
    rec_text = (
        "Immediate fungicide treatment advised. The severity score exceeds the threshold set by "
        "PMFBY guidelines. It is recommended to file an official claim receipt for insurance dispatch."
        if severity_pct >= 30 else
        "The crop health appears stable. Keep monitoring the fields and record periodic photos. No claim filing required."
    )
    content.append(Paragraph(rec_text, table_value_style))
    content.append(Spacer(1, 20))
    
    # Footer Notice
    footer_text = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#888888')
    )
    content.append(Paragraph("Generated by: CROPIC AI Diagnostics Engine. This is a computer generated advisory report.", footer_text))
    
    # Build PDF
    doc.build(content)
    
    # Clean up temp image
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except Exception as e:
            print(f"Error deleting temp image: {e}")
            
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

def generate_claim_receipt_pdf(claim_data: dict) -> bytes:
    """Generates an official Claim Submission Acknowledgement PDF Receipt."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1b4332'),
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=9,
        leading=11,
        textColor=colors.HexColor('#52b788'),
        spaceAfter=12
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#2d6a4f'),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    table_label_style = ParagraphStyle(
        'TableLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#333333')
    )
    
    table_value_style = ParagraphStyle(
        'TableValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#555555')
    )

    content = []
    
    # Header & Receipt Title
    claim_id = claim_data.get('claim_id', 'N/A')
    content.append(Paragraph(f"CROPIC CLAIM RECEIPT - {claim_id}", title_style))
    content.append(Paragraph(f"Official Submission Acknowledgement. Date: {claim_data.get('created_at', 'N/A')[:16]} UTC", subtitle_style))
    
    # Line divider
    line_data = [['']]
    line_table = Table(line_data, colWidths=[540], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#2d6a4f')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    content.append(line_table)
    content.append(Spacer(1, 10))
    
    # 1. Farmer Details Section
    content.append(Paragraph("1. Farmer Information", section_heading))
    fd = claim_data.get('farmer_details', {})
    farmer_name = fd.get('farmer_name', 'N/A')
    mobile = fd.get('mobile', 'N/A')
    address = f"{fd.get('village', '')}, {fd.get('district', '')}, {fd.get('state', '')}"
    
    farmer_table_data = [
        [Paragraph("Farmer Name", table_label_style), Paragraph(farmer_name, table_value_style)],
        [Paragraph("Mobile Number", table_label_style), Paragraph(mobile, table_value_style)],
        [Paragraph("Farm Location", table_label_style), Paragraph(address, table_value_style)],
    ]
    farmer_table = Table(farmer_table_data, colWidths=[150, 390])
    farmer_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    content.append(farmer_table)
    content.append(Spacer(1, 10))
    
    # 2. Crop & AI Assessment Section
    content.append(Paragraph("2. Crop & Damage Assessment", section_heading))
    cd = claim_data.get('crop_details', {})
    ai_det = claim_data.get('ai_damage_details', {})
    crop_name = cd.get('crop_name', 'N/A')
    crop_stage = cd.get('crop_stage', 'N/A')
    field_area = cd.get('field_area', 'N/A')
    
    disease = ai_det.get('disease', 'N/A')
    severity = f"{ai_det.get('severity', 0)}%"
    risk = ai_det.get('risk', 'Low')
    eligibility = "Eligible (Severity >= 30%)" if ai_det.get('claim_eligible', True) else "Not Eligible"
    
    assessment_data = [
        [Paragraph("Crop Name", table_label_style), Paragraph(crop_name, table_value_style), Paragraph("Detected Disease", table_label_style), Paragraph(disease, table_value_style)],
        [Paragraph("Crop Stage", table_label_style), Paragraph(crop_stage, table_value_style), Paragraph("Severity Score", table_label_style), Paragraph(severity, table_value_style)],
        [Paragraph("Field Area", table_label_style), Paragraph(field_area, table_value_style), Paragraph("Risk Category", table_label_style), Paragraph(risk, table_value_style)],
        [Paragraph("Current Status", table_label_style), Paragraph(claim_data.get('status', 'Submitted'), table_label_style), Paragraph("Claim Eligibility", table_label_style), Paragraph(eligibility, table_value_style)]
    ]
    assessment_table = Table(assessment_data, colWidths=[100, 170, 100, 170])
    assessment_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    content.append(assessment_table)
    content.append(Spacer(1, 10))
    
    # 3. Description Narrative
    content.append(Paragraph("3. Claim Narrative & Description", section_heading))
    narrative_text = claim_data.get('description', 'No description provided.')
    notes_text = claim_data.get('additional_notes', 'N/A')
    
    narrative_data = [
        [Paragraph("Complaint Description", table_label_style), Paragraph(narrative_text, table_value_style)],
        [Paragraph("Additional Remarks", table_label_style), Paragraph(notes_text, table_value_style)],
    ]
    narrative_table = Table(narrative_data, colWidths=[150, 390])
    narrative_table.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#f8fafc')),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    content.append(narrative_table)
    content.append(Spacer(1, 10))
    
    # 4. Image Attachment
    image_path = None
    if claim_data.get('image_path'):
        image_path = save_base64_temp_image(claim_data.get('image_path'))
        
    if image_path and os.path.exists(image_path):
        content.append(Paragraph("4. Crop Specimen Image Attachment", section_heading))
        try:
            img = Image(image_path, width=200, height=150)
            img.hAlign = 'LEFT'
            content.append(img)
            content.append(Spacer(1, 15))
        except Exception as img_err:
            print(f"Error drawing PDF Image: {img_err}")
            
    # Footer Notice
    footer_text = ParagraphStyle(
        'FooterText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        textColor=colors.HexColor('#888888')
    )
    content.append(Paragraph("This is an official computer-generated receipt. Please retain it for claims inspection.", footer_text))
    
    # Build Document
    doc.build(content)
    
    # Cleanup temp image
    if image_path and os.path.exists(image_path):
        try:
            os.remove(image_path)
        except Exception as e:
            print(f"Error deleting temp image: {e}")
            
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
