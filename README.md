# 🌾 CROPIC – AI-Powered Crop Damage Detection & Insurance Assistance Platform

**CROPIC** is an AI-powered crop analytics and insurance assistance platform designed to help farmers identify crop diseases, detect damage, assess severity, and simplify the crop insurance claim process.

The platform combines Computer Vision, Deep Learning, and Web Technologies to provide an integrated solution for crop health analysis and insurance assistance.

## 🚀 Key Features

### 1. AI-Based Crop Analysis
- Crop disease and damage detection using YOLOv8.
- Crop and disease classification using MobileNetV2.
- Automated damage severity estimation.
- Risk categorization based on estimated damage percentage.
- Visual analysis with detection results.

### 2. Farmer Claim Management
- Farmer registration and authentication.
- Digital crop damage complaint submission.
- Claim information management.
- Claim tracking functionality.

### 3. AI-Generated Reports
- PDF reports containing AI analysis results.
- Digital claim submission receipts.
- Excel export functionality for claim records.

### 4. Officer Dashboard
- View and manage submitted claims.
- Monitor claim information and status.
- Access farmer complaint records.
- Export claim data for further analysis.

### 5. Accessibility Features
- Text-to-Speech (TTS) support.
- Speech-related assistance for farmers.
- Farmer-friendly interface.

## 🧠 AI & Machine Learning Pipeline

CROPIC uses a two-stage AI pipeline:

1. **Image Upload:** Farmer uploads an image of the affected crop.
2. **Damage Detection:** YOLOv8 detects visible crop damage and identifies affected regions.
3. **Crop/Disease Classification:** MobileNetV2 classifies the crop or disease.
4. **Severity Estimation:** The system estimates the percentage of affected area.
5. **Risk Assessment:** The estimated damage is categorized into risk levels.
6. **Result Generation:** Analysis results are returned to the frontend.

### Risk Classification

| Risk Level | Estimated Damage |
|---|---|
| Healthy | Below 10% |
| Low | 10–29% |
| Moderate | 30–59% |
| High | 60–84% |
| Severe | 85% or above |

*Note: AI-generated severity is an indicative assessment and does not represent official insurance claim approval or settlement.*

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| AI Detection | YOLOv8 |
| Image Classification | MobileNetV2 |
| Model Inference | ONNX Runtime |
| Image Processing | OpenCV, Pillow, NumPy |
| Database | MongoDB |
| Authentication | JWT |
| PDF Generation | Python PDF libraries |
| Excel Export | Python Excel libraries |

## 📁 Project Structure

```text
CROPIC/
│
├── backend/
│   ├── api/
│   ├── models/
│   │   ├── best.pt
│   │   └── crop_classification_model.onnx
│   ├── services/
│   ├── utils/
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```

## ⚙️ Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js and npm
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/rohit-2023/CROPIC.git
cd CROPIC
```

### 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Activate virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### 3. Frontend Setup

Open another terminal:

```bash
cd CROPIC/frontend

npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

*Note: Configure the required environment variables, database connection, and model paths before running the application. Follow the actual project configuration where it differs from these example commands.*

## 📊 Future Scope

- Weather-based crop risk intelligence.
- Satellite-based crop monitoring.
- Improved crop disease and pest recognition.
- Integration with additional crop datasets.
- Enhanced insurance advisory and claim assistance.

## 👨‍💻 Developer

**Rohit Kumar**

B.Tech – Computer Science & Engineering

GitHub: [@rohit-2023](https://github.com/rohit-2023)

---

⭐ If you find this project interesting, consider giving the repository a star!

**CROPIC – Empowering Farmers Through AI & Technology.**