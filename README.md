# 🌾 CROPIC – AI-Powered Crop Damage Detection & Insurance Assistance Platform

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8-111F68?style=for-the-badge&logo=ultralytics&logoColor=white)
![MobileNetV2](https://img.shields.io/badge/MobileNetV2-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![OpenCV](https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)
![ONNX](https://img.shields.io/badge/ONNX-005CED?style=for-the-badge&logo=onnx&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

## 📌 Project Overview

**CROPIC** is an AI-powered crop analytics and insurance assistance platform designed to help farmers identify crop diseases, detect crop damage, estimate damage severity, and simplify the crop insurance complaint process.

The platform combines Computer Vision, Deep Learning, and modern web technologies to provide an integrated solution for crop health analysis and digital insurance assistance.

## ✨ Key Features

### 🌱 1. AI-Based Crop Analysis
- Crop disease and damage detection using YOLOv8.
- Crop and disease classification using MobileNetV2.
- Automated damage severity estimation.
- Risk categorization based on estimated damage percentage.
- Visual representation of detection results.

### 👨‍🌾 2. Farmer Claim Management
- Farmer registration and authentication.
- Digital crop damage complaint submission.
- Claim information management.
- Claim tracking functionality.

### 📄 3. AI-Generated Reports
- PDF reports containing AI analysis results.
- Digital claim submission receipts.
- Excel export functionality for claim records.

### 📊 4. Officer Dashboard
- View and manage submitted claims.
- Monitor farmer complaint information.
- Track claim status.
- Export claim records for further analysis.

### 🔊 5. Accessibility Features
- Text-to-Speech (TTS) support.
- Speech-assisted interaction.
- Farmer-friendly user interface.

## 🧠 AI & Machine Learning Pipeline

CROPIC uses a two-stage AI pipeline to analyze crop images and estimate damage severity.

1. **Image Upload:** Farmer uploads an image of the affected crop.
2. **Damage Detection:** YOLOv8 detects visible crop damage and identifies affected regions.
3. **Crop/Disease Classification:** MobileNetV2 classifies the crop or disease.
4. **Severity Estimation:** The system estimates the percentage of affected area.
5. **Risk Assessment:** Estimated damage is categorized into predefined risk levels.
6. **Result Generation:** AI analysis results are processed and displayed on the frontend.

### 📈 Damage Severity Classification

| Risk Level | Estimated Damage |
|:---|:---:|
| 🟢 Healthy | Below 10% |
| 🟡 Low | 10–29% |
| 🟠 Moderate | 30–59% |
| 🔴 High | 60–84% |
| ⚫ Severe | 85% or above |

> **Note:** AI-generated damage severity is an indicative assessment and does not represent official insurance claim approval or settlement.

## 🛠️ Technology Stack

| Component | Technologies |
|:---|:---|
| Frontend | React.js, Vite, JavaScript, CSS |
| Backend | Python, FastAPI |
| Object Detection | YOLOv8 |
| Image Classification | MobileNetV2 |
| Model Inference | ONNX Runtime |
| Image Processing | OpenCV, Pillow, NumPy |
| Database | MongoDB |
| Authentication | JWT |
| PDF Generation | Python PDF Libraries |
| Excel Export | Python Excel Libraries |

## 📂 Project Structure

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

### 📋 Prerequisites

Make sure you have the following installed:

- Python 3.10+
- Node.js and npm
- MongoDB
- Git

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/rohit-2023/CROPIC.git
cd CROPIC
```

### 2️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux / macOS:**
```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

### 3️⃣ Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd CROPIC/frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite in your browser.

### ⚙️ Configuration

Before running the application, configure:

- MongoDB database connection.
- Required environment variables.
- JWT authentication settings.
- Trained model paths.
- Backend and frontend API configuration.

Follow the actual project configuration wherever it differs from these example commands.

## 🔮 Future Enhancements

- 🌦️ Weather-based crop risk intelligence.
- 🛰️ Satellite-based crop monitoring.
- 🌿 Improved crop disease and pest recognition.
- 🌍 Support for additional crop varieties and datasets.
- 🗣️ Multilingual voice assistance for farmers.
- 📊 Enhanced agricultural insurance advisory.
- 🤖 Improved AI-based crop health analytics.

## 👨‍💻 Developer

**Kunal Sahu**

B.Tech – Computer Science & Engineering

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kunal-sahu1122)

---

## ⭐ Support

If you find this project interesting or useful, consider giving the repository a ⭐.

**CROPIC – Empowering Farmers Through AI & Technology.** 🌾
