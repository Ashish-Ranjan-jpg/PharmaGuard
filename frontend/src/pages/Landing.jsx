import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GiDna1, GiMedicines, GiShield } from 'react-icons/gi';
import { FiUpload, FiSearch, FiFileText, FiCheckCircle, FiArrowRight, FiZap, FiDatabase, FiCpu } from 'react-icons/fi';
import './Landing.css';

export default function Landing() {
  const { currentUser } = useAuth();

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-grid"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <GiDna1 /> RIFT 2026 — Precision Medicine
          </div>
          <h1 className="hero-title">
            Your Genes. <br />
            <span className="gradient-text">Safer Medicine.</span>
          </h1>
          <p className="hero-subtitle">
            PharmaGuard analyzes your genetic data to predict drug risks,
            providing AI-powered clinical recommendations aligned with CPIC guidelines.
          </p>
          <div className="hero-actions">
            <Link to={currentUser ? '/analyze' : '/signup'} className="btn-primary">
              <FiZap /> {currentUser ? 'Start Analysis' : 'Get Started Free'}
            </Link>
            <Link to={currentUser ? '/dashboard' : '/login'} className="btn-secondary">
              {currentUser ? 'Dashboard' : 'Sign In'} <FiArrowRight />
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat"><span className="stat-num">6</span><span className="stat-label">Critical Genes</span></div>
            <div className="stat"><span className="stat-num">6</span><span className="stat-label">Supported Drugs</span></div>
            <div className="stat"><span className="stat-num">5</span><span className="stat-label">Risk Categories</span></div>
            <div className="stat"><span className="stat-num">AI</span><span className="stat-label">Powered</span></div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <h2 className="section-title">How It <span className="gradient-text">Works</span></h2>
        <p className="section-subtitle">Three simple steps to personalized drug safety insights</p>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">01</div>
            <div className="step-icon"><FiUpload /></div>
            <h3>Upload VCF File</h3>
            <p>Upload your Variant Call Format (VCF) genetic data file. We support standard VCF v4.2 format up to 5MB.</p>
          </div>
          <div className="step-card">
            <div className="step-number">02</div>
            <div className="step-icon"><FiSearch /></div>
            <h3>Select Drug</h3>
            <p>Choose from 6 supported drugs — Codeine, Warfarin, Clopidogrel, Simvastatin, Azathioprine, or Fluorouracil.</p>
          </div>
          <div className="step-card">
            <div className="step-number">03</div>
            <div className="step-icon"><FiFileText /></div>
            <h3>Get AI Report</h3>
            <p>Receive personalized risk assessment, dosing recommendations, and AI-generated clinical explanations.</p>
          </div>
        </div>
      </section>

      {/* Supported Drugs */}
      <section className="drugs-section">
        <h2 className="section-title">Supported <span className="gradient-text">Drugs</span></h2>
        <p className="section-subtitle">CPIC-guided pharmacogenomic analysis for critical medications</p>
        <div className="drugs-grid">
          {[
            { name: 'Codeine', gene: 'CYP2D6', cat: 'Opioid Analgesic', risk: 'Toxicity in ultra-rapid metabolizers' },
            { name: 'Clopidogrel', gene: 'CYP2C19', cat: 'Antiplatelet', risk: 'Ineffective in poor metabolizers' },
            { name: 'Warfarin', gene: 'CYP2C9', cat: 'Anticoagulant', risk: 'Bleeding risk in poor metabolizers' },
            { name: 'Simvastatin', gene: 'SLCO1B1', cat: 'Statin', risk: 'Myopathy risk with variants' },
            { name: 'Azathioprine', gene: 'TPMT', cat: 'Immunosuppressant', risk: 'Myelosuppression in PM' },
            { name: 'Fluorouracil', gene: 'DPYD', cat: 'Chemotherapy', risk: 'Fatal toxicity in DPD deficient' },
          ].map((drug, i) => (
            <div className="drug-card" key={i}>
              <div className="drug-header">
                <GiMedicines className="drug-icon" />
                <span className="drug-gene">{drug.gene}</span>
              </div>
              <h3>{drug.name}</h3>
              <span className="drug-cat">{drug.cat}</span>
              <p className="drug-risk">{drug.risk}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section className="tech-section">
        <h2 className="section-title">Powered by <span className="gradient-text">Advanced Tech</span></h2>
        <div className="tech-grid">
          <div className="tech-card">
            <FiDatabase className="tech-icon" />
            <h3>CPIC Knowledge Base</h3>
            <p>Curated pharmacogenomic data aligned with Clinical Pharmacogenetics Implementation Consortium guidelines.</p>
          </div>
          <div className="tech-card">
            <FiCpu className="tech-icon" />
            <h3>Gemini AI</h3>
            <p>Google's latest AI generates clinical explanations citing specific variants and biological mechanisms.</p>
          </div>
          <div className="tech-card">
            <GiShield className="tech-icon" />
            <h3>Secure & Private</h3>
            <p>Firebase authentication, encrypted data storage, and secure file handling protect patient data.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <h2>Ready to discover your personalized drug safety profile?</h2>
          <p>Upload your genetic data and get AI-powered pharmacogenomic insights in seconds.</p>
          <Link to={currentUser ? '/analyze' : '/signup'} className="btn-primary btn-large">
            <FiCheckCircle /> {currentUser ? 'Analyze Now' : 'Create Free Account'}
          </Link>
        </div>
      </section>
    </div>
  );
}
