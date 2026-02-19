import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import ResultsDisplay from '../components/ResultsDisplay';
import toast, { Toaster } from 'react-hot-toast';
import { FiUploadCloud, FiFile, FiX, FiSearch, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { GiDna1 } from 'react-icons/gi';
import './Analyze.css';

const SUPPORTED_DRUGS = [
  { name: 'CODEINE', gene: 'CYP2D6', category: 'Analgesic' },
  { name: 'CLOPIDOGREL', gene: 'CYP2C19', category: 'Antiplatelet' },
  { name: 'WARFARIN', gene: 'CYP2C9', category: 'Anticoagulant' },
  { name: 'SIMVASTATIN', gene: 'SLCO1B1', category: 'Statin' },
  { name: 'AZATHIOPRINE', gene: 'TPMT', category: 'Immunosuppressant' },
  { name: 'FLUOROURACIL', gene: 'DPYD', category: 'Chemotherapy' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Analyze() {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [selectedDrugs, setSelectedDrugs] = useState([]);
  const [drugInput, setDrugInput] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const err = rejectedFiles[0].errors[0];
      if (err.code === 'file-too-large') toast.error('File exceeds 5MB limit');
      else if (err.code === 'file-invalid-type') toast.error('Only .vcf files are accepted');
      else toast.error('Invalid file');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setValidationResult(null);
      setResults(null);
      toast.success(`File loaded: ${acceptedFiles[0].name}`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.vcf'] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
  });

  function toggleDrug(drugName) {
    setSelectedDrugs(prev =>
      prev.includes(drugName) ? prev.filter(d => d !== drugName) : [...prev, drugName]
    );
  }

  function removeFile() {
    setFile(null);
    setValidationResult(null);
    setResults(null);
  }

  async function handleAnalyze() {
    if (!file) return toast.error('Please upload a VCF file');

    // Get drug list from selected chips + text input
    let drugs = [...selectedDrugs];
    if (drugInput.trim()) {
      const extraDrugs = drugInput.split(',').map(d => d.trim().toUpperCase()).filter(d => d);
      drugs = [...new Set([...drugs, ...extraDrugs])];
    }
    if (drugs.length === 0) return toast.error('Please select at least one drug');

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('vcfFile', file);
      formData.append('drugs', drugs.join(','));
      formData.append('userId', currentUser?.uid || 'anonymous');

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Analysis failed');
      }

      const data = await response.json();
      setResults(data);
      toast.success('Analysis complete!');

      // Save to Firestore
      if (currentUser) {
        try {
          const resultsList = data.multi_drug_analysis ? data.results : [data];
          for (const result of resultsList) {
            await addDoc(collection(db, 'analyses'), {
              userId: currentUser.uid,
              drug: result.drug,
              riskLabel: result.risk_assessment?.risk_label || 'Unknown',
              severity: result.risk_assessment?.severity || 'Low',
              confidence: result.risk_assessment?.confidence_score || 0,
              primaryGene: result.pharmacogenomic_profile?.primary_gene || 'Unknown',
              diplotype: result.pharmacogenomic_profile?.diplotype || 'Unknown',
              phenotype: result.pharmacogenomic_profile?.phenotype || 'Unknown',
              patientId: result.patient_id || 'Unknown',
              fullResult: JSON.stringify(result),
              createdAt: new Date().toISOString(),
            });
          }
          // Increment analysis count in user profile
          await updateDoc(doc(db, 'users', currentUser.uid), {
            analysisCount: increment(resultsList.length)
          });
          console.log('History stored and count updated successfully');
        } catch (dbError) {
          console.error('Failed to save to history:', dbError);
        }
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleValidate() {
    if (!file) return toast.error('Please upload a VCF file first');

    try {
      const formData = new FormData();
      formData.append('vcfFile', file);
      
      const response = await fetch(`${API_URL}/api/validate-vcf`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setValidationResult(data);
      if (data.valid) toast.success('VCF file is valid!');
      else toast.error('VCF file has issues');
    } catch (error) {
      toast.error('Validation failed');
    }
  }

  return (
    <div className="analyze-page">
      <Toaster position="top-center" />
      <div className="analyze-container">
        <div className="analyze-header">
          <h1><GiDna1 className="header-icon" /> Pharmacogenomic <span className="gradient-text">Analysis</span></h1>
          <p>Upload your VCF file, select drugs, and get personalized risk assessment</p>
        </div>

        <div className="analyze-grid">
          {/* Left: Inputs */}
          <div className="input-section">
            {/* File Upload */}
            <div className="card">
              <h2><FiUploadCloud /> Upload VCF File</h2>
              <p className="card-desc">Supported: VCF v4.2, up to 5MB</p>

              {!file ? (
                <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  <FiUploadCloud className="dropzone-icon" />
                  <p className="dropzone-text">
                    {isDragActive ? 'Drop your VCF file here...' : 'Drag & drop your .vcf file here'}
                  </p>
                  <span className="dropzone-hint">or click to browse files</span>
                </div>
              ) : (
                <div className="file-preview">
                  <div className="file-info">
                    <FiFile className="file-icon" />
                    <div>
                      <strong>{file.name}</strong>
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <div className="file-actions">
                    <button className="btn-validate" onClick={handleValidate}>
                      <FiCheckCircle /> Validate
                    </button>
                    <button className="btn-remove" onClick={removeFile}>
                      <FiX />
                    </button>
                  </div>
                </div>
              )}

              {validationResult && (
                <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                  {validationResult.valid ? (
                    <>
                      <FiCheckCircle /> Valid VCF — {validationResult.summary.totalVariants} variants,{' '}
                      {validationResult.summary.pharmacogenomicVariants} pharmacogenomic.
                      Genes: {validationResult.summary.genesDetected.join(', ')}
                    </>
                  ) : (
                    <>
                      <FiAlertCircle /> {validationResult.errors?.join('. ')}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Drug Selection */}
            <div className="card">
              <h2><FiSearch /> Select Drug(s)</h2>
              <p className="card-desc">Choose drugs to analyze for pharmacogenomic interactions</p>

              <div className="drug-chips">
                {SUPPORTED_DRUGS.map(drug => (
                  <button
                    key={drug.name}
                    className={`drug-chip ${selectedDrugs.includes(drug.name) ? 'selected' : ''}`}
                    onClick={() => toggleDrug(drug.name)}
                  >
                    <span className="chip-name">{drug.name}</span>
                    <span className="chip-gene">{drug.gene}</span>
                  </button>
                ))}
              </div>

              <div className="drug-input-row">
                <input
                  type="text"
                  placeholder="Or type drug names (comma-separated)"
                  value={drugInput}
                  onChange={(e) => setDrugInput(e.target.value)}
                  className="drug-text-input"
                />
              </div>
            </div>

            {/* Analyze Button */}
            <button
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Analyzing...
                </>
              ) : (
                <>
                  <GiDna1 /> Run Analysis
                </>
              )}
            </button>
          </div>

          {/* Right: Results */}
          <div className="results-section">
            {!results && !loading && (
              <div className="results-placeholder">
                <GiDna1 className="placeholder-icon" />
                <h3>Results will appear here</h3>
                <p>Upload a VCF file and select a drug to begin analysis</p>
              </div>
            )}
            {loading && (
              <div className="results-loading">
                <div className="dna-loader">
                  <GiDna1 />
                </div>
                <h3>Analyzing genetic variants...</h3>
                <p>Parsing VCF, matching variants, predicting risk, and generating AI explanation</p>
              </div>
            )}
            {results && <ResultsDisplay data={results} />}
          </div>
        </div>
      </div>
    </div>
  );
}
