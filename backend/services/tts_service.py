from gtts import gTTS
import uuid
import os

# Nature-friendly local translation mappings for Hindi Text-to-Speech pronunciation
CROP_TRANSLATIONS = {
    "wheat": "गेंहू",
    "rice": "चावल",
    "paddy": "धान",
    "corn": "मक्का",
    "potato": "आलू",
    "tomato": "टमाटर"
}

DISEASE_TRANSLATIONS = {
    "rust": "रस्ट",
    "blast": "ब्लास्ट",
    "blight": "झुलसा रोग",
    "rot": "सड़न रोग",
    "healthy": "स्वस्थ",
    "no damage": "कोई नुकसान नहीं"
}

RISK_TRANSLATIONS = {
    "low": "कम",
    "moderate": "मध्यम",
    "high": "उच्च",
    "severe": "अत्यधिक गंभीर"
}

# Create Audio Folder Path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

def generate_report_audio(crop_type: str, damage_type: str, severity: int, risk: str, lang: str = "hi") -> str:
    """
    Generates an MP3 file using gTTS containing the diagnostic report summary.
    Returns the absolute path of the generated MP3.
    """
    # Clean input strings
    c_type = (crop_type or "").strip()
    d_type = (damage_type or "").strip()
    r_val = (risk or "").strip()
    
    if lang == "hi":
        # Translate to Hindi for clean pronunciation
        translated_crop = CROP_TRANSLATIONS.get(c_type.lower(), c_type)
        translated_disease = DISEASE_TRANSLATIONS.get(d_type.lower(), d_type)
        translated_risk = RISK_TRANSLATIONS.get(r_val.lower(), r_val)
        
        if d_type.lower() in ["healthy", "no damage", "no disease"]:
            text = f"जांच रिपोर्ट पूरी हो गई है। आपकी {translated_crop} की फसल पूरी तरह स्वस्थ है। इसमें कोई बीमारी या नुकसान नहीं पाया गया है।"
        else:
            text = f"जांच रिपोर्ट पूरी हो गई है। आपकी {translated_crop} की फसल में {translated_disease} बीमारी पाई गई है। फसल के नुकसान की तीव्रता {severity} प्रतिशत है, जो कि {translated_risk} जोखिम श्रेणी में आती है।"
    else:
        # Default English
        if d_type.lower() in ["healthy", "no damage", "no disease"]:
            text = f"Analysis report complete. Your {c_type} crop is healthy. No disease or damage has been detected."
        else:
            text = f"Analysis report complete. Your {c_type} crop has been diagnosed with {d_type}. The damage severity is {severity} percent, which represents a {r_val} risk level."

    # Initialize and save gTTS audio file
    filename = f"{uuid.uuid4()}.mp3"
    output_path = os.path.join(AUDIO_DIR, filename)
    
    tts = gTTS(text=text, lang=lang)
    tts.save(output_path)
    
    return output_path
