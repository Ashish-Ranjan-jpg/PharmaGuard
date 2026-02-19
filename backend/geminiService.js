/**
 * Gemini AI Service
 * Generates clinical explanations with variant citations and biological mechanisms
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

function initGemini() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

/**
 * Generate a clinical explanation for a pharmacogenomic risk assessment
 * @param {object} riskResult - The risk prediction result from riskEngine
 * @returns {object} LLM-generated explanation object
 */
async function generateExplanation(riskResult) {
  try {
    const ai = initGemini();
    if (!ai) {
      return getFallbackExplanation(riskResult);
    }

    const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = buildPrompt(riskResult);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to parse structured response
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, use text as summary
    }

    if (parsed) {
      return {
        summary: parsed.summary || text.substring(0, 500),
        detailed_explanation: parsed.detailed_explanation || text,
        mechanism_of_action: parsed.mechanism_of_action || '',
        variant_impact_analysis: parsed.variant_impact_analysis || '',
        clinical_significance: parsed.clinical_significance || '',
        patient_friendly_summary: parsed.patient_friendly_summary || '',
        references: parsed.references || ['CPIC Guidelines', 'PharmGKB'],
        model_used: 'gemini-2.0-flash',
        generated_at: new Date().toISOString(),
      };
    }

    return {
      summary: text.substring(0, 500),
      detailed_explanation: text,
      mechanism_of_action: extractSection(text, 'mechanism'),
      variant_impact_analysis: extractSection(text, 'variant'),
      clinical_significance: extractSection(text, 'clinical'),
      patient_friendly_summary: extractSection(text, 'patient'),
      references: ['CPIC Guidelines', 'PharmGKB'],
      model_used: 'gemini-2.0-flash',
      generated_at: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Gemini API error:', error.message);
    return getFallbackExplanation(riskResult);
  }
}

/**
 * Build a detailed prompt for Gemini
 */
function buildPrompt(riskResult) {
  const variants = riskResult.pharmacogenomic_profile.detected_variants
    .map(v => `- ${v.rsid} (${v.gene} ${v.star_allele || ''}): ${v.clinical_description || v.functional_effect}`)
    .join('\n');

  return `You are a clinical pharmacogenomics expert. Generate a comprehensive clinical explanation for the following pharmacogenomic analysis result.

PATIENT ANALYSIS:
- Drug: ${riskResult.drug}
- Primary Gene: ${riskResult.pharmacogenomic_profile.primary_gene}
- Diplotype: ${riskResult.pharmacogenomic_profile.diplotype}
- Phenotype: ${riskResult.pharmacogenomic_profile.phenotype}
- Risk Label: ${riskResult.risk_assessment.risk_label}
- Severity: ${riskResult.risk_assessment.severity}

DETECTED VARIANTS:
${variants || 'No specific variants detected - assumed wildtype (*1/*1)'}

CLINICAL RECOMMENDATION:
${riskResult.clinical_recommendation.recommendation}

Respond in this EXACT JSON format:
{
  "summary": "A 2-3 sentence clinical summary citing specific variants and their impact on drug metabolism",
  "detailed_explanation": "A detailed paragraph explaining the pharmacogenomic interaction, the biological pathway, and how the detected variants affect drug response",
  "mechanism_of_action": "Specific description of how ${riskResult.drug} is metabolized by ${riskResult.pharmacogenomic_profile.primary_gene} and how the patient's variants alter this process",
  "variant_impact_analysis": "Analysis of each detected variant's functional impact on enzyme/transporter activity",
  "clinical_significance": "The clinical significance of this finding including potential adverse events or therapeutic failure",
  "patient_friendly_summary": "A simple, non-technical explanation a patient could understand about what this result means for them",
  "references": ["CPIC Guideline for ${riskResult.drug}", "PharmGKB ${riskResult.pharmacogenomic_profile.primary_gene}"]
}

IMPORTANT: Cite specific rsIDs and star alleles in your explanations. Be clinically accurate and evidence-based.`;
}

/**
 * Extract a section from unstructured text
 */
function extractSection(text, keyword) {
  const lines = text.split('\n');
  const sectionStart = lines.findIndex(l => l.toLowerCase().includes(keyword));
  if (sectionStart === -1) return '';
  
  let section = [];
  for (let i = sectionStart; i < Math.min(sectionStart + 5, lines.length); i++) {
    section.push(lines[i]);
  }
  return section.join(' ').trim();
}

/**
 * Fallback explanation when Gemini is unavailable
 */
function getFallbackExplanation(riskResult) {
  const { drug, pharmacogenomic_profile: profile, risk_assessment: risk, clinical_recommendation: rec } = riskResult;
  const variants = profile.detected_variants;
  const variantList = variants.map(v => `${v.rsid} (${v.star_allele})`).join(', ');

  return {
    summary: `Patient has ${profile.diplotype} diplotype for ${profile.primary_gene}, classified as ${profile.phenotype} (${getPhenotypeName(profile.phenotype)}). ${variants.length > 0 ? `Key variants detected: ${variantList}.` : 'No actionable variants detected — assumed wildtype.'} Risk for ${drug}: ${risk.risk_label} (severity: ${risk.severity}).`,
    detailed_explanation: `The ${profile.primary_gene} gene encodes an enzyme critical for ${drug} metabolism. The patient's ${profile.diplotype} diplotype results in ${getPhenotypeName(profile.phenotype)} status. ${rec.recommendation}`,
    mechanism_of_action: `${drug} is processed by the ${profile.primary_gene} enzyme. The patient's genetic variants alter enzyme activity, affecting drug levels and clinical response.`,
    variant_impact_analysis: variants.length > 0
      ? variants.map(v => `${v.rsid} (${v.gene} ${v.star_allele}): ${v.clinical_description || v.functional_effect} — ${v.zygosity}`).join('. ')
      : 'No pharmacogenomic variants detected for this gene. Patient is assumed to have normal (wildtype) enzyme activity.',
    clinical_significance: `${risk.risk_label} risk (${risk.severity} severity). ${rec.recommendation}`,
    patient_friendly_summary: getPatientFriendlySummary(riskResult),
    references: ['CPIC Guidelines (cpicpgx.org)', 'PharmGKB (pharmgkb.org)', 'FDA Table of Pharmacogenomic Biomarkers'],
    model_used: 'fallback_template',
    generated_at: new Date().toISOString(),
  };
}

function getPhenotypeName(code) {
  const names = {
    PM: 'Poor Metabolizer', IM: 'Intermediate Metabolizer', NM: 'Normal Metabolizer',
    RM: 'Rapid Metabolizer', URM: 'Ultra-Rapid Metabolizer', Unknown: 'Unknown',
  };
  return names[code] || code;
}

function getPatientFriendlySummary(result) {
  const { drug, risk_assessment: risk, pharmacogenomic_profile: profile } = result;
  
  const riskMessages = {
    Safe: `Based on your genetic profile, ${drug} is expected to work normally for you at standard doses.`,
    'Adjust Dosage': `Your genetics suggest you may need a different dose of ${drug} than usual. Your doctor should consider adjusting your dose or monitoring you more closely.`,
    Toxic: `Your genetics indicate you are at HIGH RISK for serious side effects from ${drug}. Your doctor should consider an alternative medication.`,
    Ineffective: `Your genetics suggest ${drug} may NOT work effectively for you. Your doctor should consider an alternative medication.`,
    Unknown: `We couldn't determine your risk level for ${drug} based on the available genetic data. Please consult your doctor.`,
  };

  return riskMessages[risk.risk_label] || riskMessages.Unknown;
}

module.exports = { generateExplanation };
