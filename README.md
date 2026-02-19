# PharmaGuard 🧬
## Pharmacogenomic Risk Prediction System

> **RIFT 2026 Hackathon | Precision Medicine Track**
> AI-powered web application that analyzes patient genetic data (VCF files) and drug names to predict personalized pharmacogenomic risks with clinically actionable recommendations.

---

### 🔗 Live Demo
**Live URL:** [Add deployed URL here]

### 🎥 Video Demo
**LinkedIn Video:** [Add LinkedIn video link here]

---

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────┐
│                   Frontend                    │
│         Vite + React 19 + React Router        │
│     Firebase Auth │ Firestore │ Dark Theme    │
├──────────────────────────────────────────────┤
│                  Backend API                  │
│           Express.js (Node.js)                │
│  ┌────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  VCF   │ │   CPIC   │ │    Risk        │  │
│  │ Parser │→│Knowledge │→│  Prediction    │  │
│  │        │ │   Base   │ │   Engine       │  │
│  └────────┘ └──────────┘ └────────────────┘  │
│       │           │              │            │
│       ▼           ▼              ▼            │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Cloudinary│ │  Gemini  │ │ Structured   │  │
│  │  Upload  │ │    AI    │ │ JSON Output  │  │
│  └──────────┘ └──────────┘ └──────────────┘  │
└──────────────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React 19, React Router v7 |
| **Backend** | Express.js (Node.js) |
| **Authentication** | Firebase Auth (Email/Password, Google, Forgot Password) |
| **Database** | Firebase Firestore |
| **File Upload** | Cloudinary |
| **AI/LLM** | Google Gemini 2.0 Flash |
| **Styling** | Vanilla CSS (Premium Dark Theme) |

## ✨ Key Features

- **VCF File Parsing** — Full VCF v4.2 parser extracting pharmacogenomic variants
- **6 Critical Genes** — CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
- **6 Supported Drugs** — Codeine, Clopidogrel, Warfarin, Simvastatin, Azathioprine, Fluorouracil
- **5 Risk Categories** — Safe, Adjust Dosage, Toxic, Ineffective, Unknown
- **AI Explanations** — Gemini-powered clinical explanations with variant citations
- **CPIC-Aligned** — Dosing recommendations following clinical guidelines
- **Personalized Dashboard** — Per-user stats, recent analyses, quick actions
- **Drag & Drop Upload** — With VCF validation and file size indicator
- **Color-Coded Results** — Green/Yellow/Red risk banners
- **JSON Export** — Download & copy-to-clipboard support
- **Analysis History** — Searchable, filterable history with Firestore persistence
- **Authentication** — Email/Password, Google Sign-In, Forgot Password

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm
- Firebase project (with Auth + Firestore enabled)
- Google Gemini API key
- Cloudinary account

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/PharmaGuard.git
cd PharmaGuard
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your Firebase config
```

### 4. Configure Environment Variables

**Backend `.env`:**
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FRONTEND_URL=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

### 5. Run the Application
```bash
# Terminal 1 — Backend
cd backend
npm start

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📡 API Documentation

### `POST /api/analyze`
Main analysis endpoint. Accepts VCF file + drug name(s).

**Request:** `multipart/form-data`
| Field | Type | Description |
|-------|------|-------------|
| `vcfFile` | File | VCF file (.vcf, max 5MB) |
| `drugs` | String | Comma-separated drug names |
| `userId` | String | (Optional) User ID for Cloudinary folder |

**Response:** Structured JSON matching the required schema with `patient_id`, `drug`, `timestamp`, `risk_assessment`, `pharmacogenomic_profile`, `clinical_recommendation`, `llm_generated_explanation`, `quality_metrics`.

### `POST /api/validate-vcf`
Validate a VCF file without full analysis.

### `POST /api/upload`
Upload a VCF file to Cloudinary.

### `GET /api/supported-drugs`
Returns list of supported drugs with gene mappings.

### `GET /api/health`
Health check endpoint.

## 📁 Sample VCF Files

Three sample VCF files are provided in the `samples/` directory:

| File | Patient | Key Variants | Test With |
|------|---------|-------------|-----------|
| `sample_patient_001.vcf` | PATIENT_001 | CYP2D6 *4/*4 (PM) | Codeine → Ineffective |
| `sample_patient_002.vcf` | PATIENT_002 | CYP2C19 *2/*2 (PM), DPYD *2A het | Clopidogrel → Ineffective |
| `sample_patient_003.vcf` | PATIENT_003 | Multi-gene variants | Any drug |

## 📋 Usage Example

1. Sign up or log in
2. Navigate to **Analyze**
3. Upload `sample_patient_001.vcf`
4. Select **CODEINE**
5. Click **Run Analysis**
6. View color-coded risk assessment, AI explanation, and clinical recommendations
7. Download or copy the JSON output

## 👥 Team Members
- [Add team member names here]

## 📜 License
MIT License — RIFT 2026 Hackathon

---

*Built with ❤️ for RIFT 2026 — Precision Medicine saves lives.*
