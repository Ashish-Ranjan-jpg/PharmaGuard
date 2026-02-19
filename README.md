# PharmaGuard 🧬
## AI-Powered Pharmacogenomic Risk Prediction

PharmaGuard is a precision medicine platform designed to bridge the gap between genetic data and clinical action. By analyzing patient VCF (Variant Call Format) files, it predicts personalized risks for critical medications, helping healthcare providers avoid adverse drug reactions and optimize treatment efficacy.

---

### 🚀 The Problem
Genetic variations significantly impact how patients metabolize drugs. Standard dosing often leads to toxicity or lack of efficacy. PharmaGuard automates the complex process of parsing genetic data and mapping it to established clinical guidelines (CPIC).

### 🏗️ Core Architecture
- **Backend:** Node.js/Express API with a custom VCF parsing engine and risk prediction logic.
- **Frontend:** Responsive React/Vite dashboard featuring a premium dark aesthetic.
- **Intelligence:** Gemini 2.0 AI for generating plain-language clinical explanations.
- **Persistence:** Firebase Auth and Firestore for secure analysis history.
- **Storage:** Cloudinary for secure genetic file archiving.

### ✨ Key Features
- **Sophisticated VCF Parsing:** Extracts PGx-relevant variants for 6 critical genes (CYP2D6, CYP2C19, etc.).
- **Actionable Risk Assessment:** Color-coded categories (Safe, Toxic, Adjust Dosage) with CPIC-aligned recommendations.
- **AI-Generated Insights:** Translates complex genetic findings into easy-to-understand clinical summaries.
- **Secure History:** Full tracking of patient analyses with search and filter capabilities.
- **Data Portability:** Export results as structured JSON for integration with EHR systems.

---

### 🛠️ Quick Start

#### 1. Environment Setup
Create a `.env` in both `/backend` and `/frontend` using the provided `.env.example` templates. You will need:
- **Google Gemini API Key**
- **Cloudinary Credentials**
- **Firebase Project Config**

#### 2. Launch
```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && npm install && npm run dev
```

### 🧪 Sample Data
Test the system using the provided files in `/samples`:
- `sample_patient_001.vcf` (High risk for Codeine)
- `sample_patient_002.vcf` (Ineffective Clopidogrel)

---

*Built for precision. Designed for life.*
