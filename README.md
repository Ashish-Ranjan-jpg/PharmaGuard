# PharmaGuard 🧬
## AI-Powered Pharmacogenomic Risk Prediction

PharmaGuard is a precision medicine platform designed to bridge the gap between genetic data and clinical action. By analyzing patient VCF (Variant Call Format) files, it predicts personalized risks for critical medications, helping healthcare providers avoid adverse drug reactions and optimize treatment efficacy.

[![Live Demo](https://getpharmaguard.netlify.app/)](YOUR_LIVE_DEMO_LINK_HERE)
[![LinkedIn Video](https://www.linkedin.com/posts/vicky-raj-1b858b343_rift2026-pharmaguard-pharmacogenomics-activity-7430421858430177280-tqV-?utm_source=share&utm_medium=member_desktop&rcm=ACoAAFYMf1wBDpnKKZGDPW_InYkt_JEJXqBDn00)](YOUR_LINKEDIN_VIDEO_LINK_HERE)

---

### 🏗️ Architecture Overview

PharmaGuard follows a modern client-server architecture with a specialized processing pipeline:

- **Frontend:** A responsive React application built with Vite, featuring a premium dark-themed dashboard. It handles secure authentication and file uploads.
- **Backend:** A Node.js/Express API that manages the core logic, including VCF parsing and integration with specialized services.
- **VCF Parsing Engine:** Custom logic to extract relevant genetic variants (SNPs) from multi-megabyte VCF files.
- **Risk Engine:** Maps discovered genotypes to clinical phenotypes and determines therapeutic recommendations based on CPIC guidelines.
- **AI Layer (Gemini 2.0):** Generates natural language clinical summaries and personalized patient advice.
- **Database/Storage:** Firebase for user authentication and history tracking; Cloudinary for secure genetic file archiving.

### 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Three.js (DNA Visualization), React Router, Lucide Icons, Vanilla CSS |
| **Backend** | Node.js, Express.js, Multer (File Handling) |
| **Artificial Intelligence** | Google Gemini 2.0 Flash API |
| **Authentication/DB** | Firebase Auth, Google Firestore |
| **Cloud Storage** | Cloudinary (VCF & Profile Images) |
| **Deployment** | Vercel (Frontend), Netlify/Render (Backend) |

---

### 🚀 Installation Instructions

#### Prerequisites
- Node.js (v18+)
- npm or yarn
- API Keys for: Gemini, Cloudinary, and Firebase

#### 1. Clone the repository
```bash
git clone https://github.com/Ashish-Ranjan-jpg/PharmaGuard.git
cd PharmaGuard
```

#### 2. Backend Setup
```bash
cd backend
npm install
# Create .env file based on .env.example
npm start
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Create .env file based on .env.example
npm run dev
```

---

### 📡 API Documentation

#### `POST /api/analyze`
The primary endpoint for pharmacogenomic analysis.
- **Payload:** `multipart/form-data`
- **Fields:** 
  - `vcfFile`: The .vcf file to analyze (Max 5MB).
  - `drugs`: Comma-separated list of drug names (e.g., "Codeine, Clopidogrel").
  - `userId`: (Optional) Firebase UID for history tracking.
- **Response:** Detailed JSON object containing phenotypes, risk levels, and AI-generated clinical insights.

#### `GET /api/supported-drugs`
Returns the list of medications currently supported by the risk engine.

#### `POST /api/upload-profile-image`
Updates user profile image in Cloudinary.

---

### 💡 Usage Examples

1. **Upload Genetic Data:** Drag and drop a patient's VCF file onto the analysis dashboard.
2. **Select Medications:** Type the names of drugs the patient is currently taking or considering (e.g., "Warfarin").
3. **Run Analysis:** Click "Analyze Patient Risk" to trigger the parsing and AI generation pipeline.
4. **Interpret Results:** Review color-coded risks:
   - 🟢 **Normal Metabolizer:** Standard dosing likely safe.
   - 🟡 **Intermediate Metabolizer:** Consider dosage adjustment.
   - 🔴 **Poor/Ultra-rapid Metabolizer:** High risk of toxicity or treatment failure.

---

### 👥 Team Members

- **Member Name** - Vicky Raj
- **Member Name** - Ashish Ranjan
- **Member Name** - Manish Kumar
- **Member Name** - Ashutosh Kuamr

---

*Built for precision. Designed for life.*
