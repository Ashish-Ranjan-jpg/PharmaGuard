/**
 * Risk Prediction Engine
 * Takes parsed VCF variants + drug name, produces risk assessment,
 * pharmacogenomic profile, and clinical recommendation
 */

const { getGeneForDrug, getPhenotype, getDrugInteraction, getVariantInfo, DIPLOTYPE_PHENOTYPES, PHENOTYPES } = require('./pharmacoKB');

/**
 * Build diplotype from detected variants for a specific gene
 */
function buildDiplotype(variants, gene) {
  const geneVariants = variants.filter(v => v.gene === gene);
  
  if (geneVariants.length === 0) {
    return { diplotype: '*1/*1', method: 'default_wildtype' };
  }

  // Collect star alleles from variants
  const starAlleles = [];
  for (const v of geneVariants) {
    const variantInfo = getVariantInfo(v.rsid);
    if (variantInfo && variantInfo.starAllele) {
      // Check zygosity
      if (v.zygosity === 'homozygous_variant') {
        starAlleles.push(variantInfo.starAllele);
        starAlleles.push(variantInfo.starAllele);
      } else if (v.zygosity === 'heterozygous') {
        starAlleles.push(variantInfo.starAllele);
      }
    } else if (v.starAllele) {
      if (v.zygosity === 'homozygous_variant') {
        starAlleles.push(v.starAllele);
        starAlleles.push(v.starAllele);
      } else {
        starAlleles.push(v.starAllele);
      }
    }
  }

  if (starAlleles.length === 0) {
    return { diplotype: '*1/*1', method: 'no_star_alleles_found' };
  }

  // Build diplotype string
  let allele1, allele2;
  if (starAlleles.length >= 2) {
    // Sort for consistency
    const sorted = starAlleles.sort();
    allele1 = sorted[0];
    allele2 = sorted[1];
  } else {
    // One variant allele + one wildtype
    allele1 = '*1';
    allele2 = starAlleles[0];
  }

  // Normalize format
  allele1 = allele1.startsWith('*') ? allele1 : `*${allele1}`;
  allele2 = allele2.startsWith('*') ? allele2 : `*${allele2}`;

  const diplotype = `${allele1}/${allele2}`;
  return { diplotype, method: 'variant_based' };
}

/**
 * Predict risk for a specific drug given parsed VCF data
 * @param {object} parsedVCF - Output from vcfParser.parseVCF()
 * @param {string} drugName - Drug name to assess
 * @returns {object} Complete risk assessment matching required JSON schema
 */
function predictRisk(parsedVCF, drugName) {
  const drug = drugName.toUpperCase();
  const primaryGene = getGeneForDrug(drug);
  
  if (!primaryGene) {
    return createUnknownResponse(parsedVCF, drug, `Drug "${drug}" is not in the supported drug database.`);
  }

  // Get pharmacogenomic variants for the primary gene
  const geneVariants = parsedVCF.pharmacogenomicVariants.filter(
    v => v.gene === primaryGene
  );

  // Build diplotype
  const { diplotype, method } = buildDiplotype(parsedVCF.pharmacogenomicVariants, primaryGene);

  // Determine phenotype
  const phenotype = getPhenotype(primaryGene, diplotype);

  // Get drug interaction
  const interaction = getDrugInteraction(drug, phenotype);

  // Calculate confidence score
  const confidenceScore = calculateConfidence(geneVariants, method, phenotype);

  // Build detected variants array
  const detectedVariants = geneVariants.map(v => {
    const info = getVariantInfo(v.rsid) || {};
    return {
      rsid: v.rsid || 'unknown',
      gene: v.gene,
      chromosome: v.chromosome,
      position: v.position,
      ref_allele: v.ref,
      alt_allele: v.alt,
      zygosity: v.zygosity,
      star_allele: info.starAllele || v.starAllele || 'unknown',
      functional_effect: info.effect || 'unknown',
      clinical_description: info.description || 'No description available',
    };
  });

  // Build result
  const result = {
    patient_id: parsedVCF.patientId || 'PATIENT_UNKNOWN',
    drug: drug,
    timestamp: new Date().toISOString(),
    risk_assessment: {
      risk_label: interaction.riskLabel,
      confidence_score: parseFloat(confidenceScore.toFixed(2)),
      severity: interaction.severity,
    },
    pharmacogenomic_profile: {
      primary_gene: primaryGene,
      diplotype: diplotype,
      phenotype: phenotype,
      detected_variants: detectedVariants,
    },
    clinical_recommendation: {
      recommendation: interaction.recommendation,
      dosing_guideline: interaction.dosingGuideline,
      cpic_guideline_level: interaction.cpicLevel,
      monitoring_recommendations: getMonitoringRecommendations(drug, phenotype),
      alternative_drugs: getAlternativeDrugs(drug, phenotype),
    },
    quality_metrics: {
      vcf_parsing_success: parsedVCF.parsingSuccess,
      total_variants_parsed: parsedVCF.variants.length,
      pharmacogenomic_variants_found: parsedVCF.pharmacogenomicVariants.length,
      gene_specific_variants: geneVariants.length,
      diplotype_determination_method: method,
      analysis_version: '1.0.0',
    },
  };

  return result;
}

/**
 * Calculate confidence score
 */
function calculateConfidence(geneVariants, method, phenotype) {
  let score = 0.5; // Base confidence

  // More variants detected = higher confidence
  if (geneVariants.length > 0) score += 0.15;
  if (geneVariants.length > 1) score += 0.10;

  // Method-based adjustments
  if (method === 'variant_based') score += 0.15;
  if (method === 'default_wildtype') score -= 0.10;

  // Known phenotype boosts confidence
  if (phenotype !== 'Unknown') score += 0.10;

  return Math.min(Math.max(score, 0.1), 0.99);
}

/**
 * Get monitoring recommendations based on drug and phenotype
 */
function getMonitoringRecommendations(drug, phenotype) {
  const monitoring = {
    CODEINE: { PM: 'Monitor for inadequate pain relief. Consider pain scoring.', IM: 'Monitor pain control efficacy.', URM: 'Monitor for respiratory depression, sedation, and signs of opioid toxicity.', NM: 'Standard monitoring.', RM: 'Monitor for signs of increased opioid effect.' },
    CLOPIDOGREL: { PM: 'Monitor platelet function. Consider VerifyNow P2Y12 assay.', IM: 'Monitor platelet reactivity. Consider platelet function testing.', NM: 'Standard monitoring.', RM: 'Standard monitoring.', URM: 'Monitor for bleeding.' },
    WARFARIN: { PM: 'INR monitoring every 1-3 days initially. Watch for bleeding signs.', IM: 'INR monitoring twice weekly initially. Adjust dose to target INR 2-3.', NM: 'Standard INR monitoring per protocol.' },
    SIMVASTATIN: { PM: 'Monitor CK levels every 2-4 weeks. Report any muscle pain immediately.', IM: 'Monitor CK levels. Report muscle symptoms.', NM: 'Standard lipid panel monitoring.' },
    AZATHIOPRINE: { PM: 'CBC with differential WEEKLY. Monitor for signs of infection.', IM: 'CBC weekly for first 2-3 months, then monthly.', NM: 'CBC monthly after initial weekly monitoring.' },
    FLUOROURACIL: { PM: 'INTENSIVE monitoring: CBC, hepatic/renal function. Watch for mucositis, diarrhea, hand-foot syndrome.', IM: 'Enhanced monitoring of CBC and toxicity signs.', NM: 'Standard chemotherapy monitoring protocol.' },
  };

  return monitoring[drug]?.[phenotype] || 'Standard clinical monitoring recommended.';
}

/**
 * Get alternative drug suggestions
 */
function getAlternativeDrugs(drug, phenotype) {
  if (phenotype === 'NM' || phenotype === 'RM') return [];

  const alternatives = {
    CODEINE: ['Morphine (direct agonist)', 'Acetaminophen', 'NSAIDs (ibuprofen)', 'Tramadol (caution — also CYP2D6)'],
    CLOPIDOGREL: ['Prasugrel', 'Ticagrelor'],
    WARFARIN: ['Apixaban (Eliquis)', 'Rivaroxaban (Xarelto)', 'Dabigatran (Pradaxa)'],
    SIMVASTATIN: ['Pravastatin', 'Rosuvastatin', 'Fluvastatin'],
    AZATHIOPRINE: ['Mycophenolate mofetil', 'Methotrexate (with monitoring)'],
    FLUOROURACIL: ['Alternative chemotherapy per oncology consult'],
  };

  return alternatives[drug] || [];
}

/**
 * Create response for unknown/unsupported scenarios
 */
function createUnknownResponse(parsedVCF, drug, reason) {
  return {
    patient_id: parsedVCF.patientId || 'PATIENT_UNKNOWN',
    drug: drug,
    timestamp: new Date().toISOString(),
    risk_assessment: {
      risk_label: 'Unknown',
      confidence_score: 0.0,
      severity: 'low',
    },
    pharmacogenomic_profile: {
      primary_gene: 'Unknown',
      diplotype: 'Unknown',
      phenotype: 'Unknown',
      detected_variants: [],
    },
    clinical_recommendation: {
      recommendation: reason,
      dosing_guideline: 'Use standard dosing per clinical guidelines.',
      cpic_guideline_level: 'No recommendation',
      monitoring_recommendations: 'Standard clinical monitoring.',
      alternative_drugs: [],
    },
    quality_metrics: {
      vcf_parsing_success: parsedVCF.parsingSuccess,
      total_variants_parsed: parsedVCF.variants.length,
      pharmacogenomic_variants_found: parsedVCF.pharmacogenomicVariants.length,
      gene_specific_variants: 0,
      diplotype_determination_method: 'none',
      analysis_version: '1.0.0',
    },
  };
}

module.exports = { predictRisk, buildDiplotype };
