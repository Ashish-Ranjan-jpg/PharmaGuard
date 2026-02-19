import { useState } from 'react';
import { FiChevronDown, FiChevronUp, FiCopy, FiDownload, FiCheckCircle, FiAlertTriangle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import { GiDna1 } from 'react-icons/gi';
import toast from 'react-hot-toast';
import './ResultsDisplay.css';

const RISK_COLORS = {
  Safe: { bg: 'rgba(0, 245, 160, 0.1)', color: '#00f5a0', border: 'rgba(0, 245, 160, 0.3)', icon: <FiCheckCircle /> },
  'Adjust Dosage': { bg: 'rgba(255, 217, 61, 0.1)', color: '#ffd93d', border: 'rgba(255, 217, 61, 0.3)', icon: <FiAlertTriangle /> },
  Toxic: { bg: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', border: 'rgba(255, 107, 107, 0.3)', icon: <FiAlertCircle /> },
  Ineffective: { bg: 'rgba(255, 159, 67, 0.1)', color: '#ff9f43', border: 'rgba(255, 159, 67, 0.3)', icon: <FiAlertTriangle /> },
  Unknown: { bg: 'rgba(136, 136, 136, 0.1)', color: '#888', border: 'rgba(136, 136, 136, 0.3)', icon: <FiInfo /> },
};

function SingleResult({ result }) {
  const [expanded, setExpanded] = useState({ variants: false, recommendation: false, explanation: false, json: false });
  const risk = result.risk_assessment;
  const profile = result.pharmacogenomic_profile;
  const rec = result.clinical_recommendation;
  const explanation = result.llm_generated_explanation;
  const riskStyle = RISK_COLORS[risk?.risk_label] || RISK_COLORS.Unknown;

  function toggle(section) {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  }

  function copyJSON() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success('JSON copied to clipboard!');
  }

  function downloadJSON() {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pharmaguard_${result.patient_id}_${result.drug}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON downloaded!');
  }

  return (
    <div className="result-card">
      {/* Risk Banner */}
      <div className="risk-banner" style={{ background: riskStyle.bg, borderColor: riskStyle.border }}>
        <div className="risk-icon" style={{ color: riskStyle.color }}>{riskStyle.icon}</div>
        <div className="risk-details">
          <span className="risk-label" style={{ color: riskStyle.color }}>{risk?.risk_label}</span>
          <span className="risk-severity">Severity: {risk?.severity} • Confidence: {(risk?.confidence_score * 100).toFixed(0)}%</span>
        </div>
        <span className="risk-drug">{result.drug}</span>
      </div>

      {/* Profile Summary */}
      <div className="profile-summary">
        <div className="profile-item">
          <span className="profile-label">Patient</span>
          <span className="profile-value">{result.patient_id}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Gene</span>
          <span className="profile-value highlight">{profile?.primary_gene}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Diplotype</span>
          <span className="profile-value">{profile?.diplotype}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">Phenotype</span>
          <span className="profile-value">{profile?.phenotype}</span>
        </div>
      </div>

      {/* Expandable: Detected Variants */}
      <div className="expandable">
        <button className="expand-btn" onClick={() => toggle('variants')}>
          <GiDna1 /> Detected Variants ({profile?.detected_variants?.length || 0})
          {expanded.variants ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {expanded.variants && (
          <div className="expand-content">
            {profile?.detected_variants?.length > 0 ? (
              <div className="variants-list">
                {profile.detected_variants.map((v, i) => (
                  <div className="variant-item" key={i}>
                    <div className="variant-header">
                      <span className="variant-rsid">{v.rsid}</span>
                      <span className="variant-star">{v.star_allele}</span>
                      <span className={`variant-effect ${v.functional_effect}`}>{v.functional_effect}</span>
                    </div>
                    <p className="variant-desc">{v.clinical_description}</p>
                    <div className="variant-meta">
                      <span>Chr{v.chromosome}:{v.position}</span>
                      <span>{v.ref_allele}→{v.alt_allele}</span>
                      <span>{v.zygosity}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No pharmacogenomic variants detected for this gene. Assumed wildtype (*1/*1).</p>
            )}
          </div>
        )}
      </div>

      {/* Expandable: Clinical Recommendation */}
      <div className="expandable">
        <button className="expand-btn" onClick={() => toggle('recommendation')}>
          <FiAlertTriangle /> Clinical Recommendation
          {expanded.recommendation ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {expanded.recommendation && (
          <div className="expand-content">
            <div className="rec-section">
              <h4>Recommendation</h4>
              <p>{rec?.recommendation}</p>
            </div>
            <div className="rec-section">
              <h4>Dosing Guideline</h4>
              <p>{rec?.dosing_guideline}</p>
            </div>
            <div className="rec-section">
              <h4>Monitoring</h4>
              <p>{rec?.monitoring_recommendations}</p>
            </div>
            {rec?.alternative_drugs?.length > 0 && (
              <div className="rec-section">
                <h4>Alternative Drugs</h4>
                <ul>{rec.alternative_drugs.map((d, i) => <li key={i}>{d}</li>)}</ul>
              </div>
            )}
            <div className="rec-badge">CPIC Level: {rec?.cpic_guideline_level}</div>
          </div>
        )}
      </div>

      {/* Expandable: AI Explanation */}
      <div className="expandable">
        <button className="expand-btn" onClick={() => toggle('explanation')}>
          <FiInfo /> AI-Generated Explanation
          {expanded.explanation ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {expanded.explanation && explanation && (
          <div className="expand-content">
            <div className="ai-section">
              <h4>Summary</h4>
              <p>{explanation.summary}</p>
            </div>
            {explanation.mechanism_of_action && (
              <div className="ai-section">
                <h4>Mechanism of Action</h4>
                <p>{explanation.mechanism_of_action}</p>
              </div>
            )}
            {explanation.variant_impact_analysis && (
              <div className="ai-section">
                <h4>Variant Impact Analysis</h4>
                <p>{explanation.variant_impact_analysis}</p>
              </div>
            )}
            {explanation.patient_friendly_summary && (
              <div className="ai-section patient-friendly">
                <h4>🧑‍⚕️ In Simple Terms</h4>
                <p>{explanation.patient_friendly_summary}</p>
              </div>
            )}
            <span className="ai-model">Model: {explanation.model_used}</span>
          </div>
        )}
      </div>

      {/* Expandable: Raw JSON */}
      <div className="expandable">
        <button className="expand-btn" onClick={() => toggle('json')}>
          <FiDownload /> Raw JSON Output
          {expanded.json ? <FiChevronUp /> : <FiChevronDown />}
        </button>
        {expanded.json && (
          <div className="expand-content">
            <div className="json-actions">
              <button onClick={copyJSON}><FiCopy /> Copy</button>
              <button onClick={downloadJSON}><FiDownload /> Download</button>
            </div>
            <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsDisplay({ data }) {
  const results = data.multi_drug_analysis ? data.results : [data];

  return (
    <div className="results-display">
      {data.multi_drug_analysis && (
        <div className="multi-badge">{data.total_drugs_analyzed} drugs analyzed</div>
      )}
      {results.map((result, i) => (
        <SingleResult key={i} result={result} />
      ))}
    </div>
  );
}
