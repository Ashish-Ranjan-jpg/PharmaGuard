/**
 * Pharmacogenomics Knowledge Base
 * CPIC-aligned lookup tables mapping genes → diplotypes → phenotypes → drug interactions
 * Covers all 6 target genes and 6 supported drugs
 */

// Phenotype definitions
const PHENOTYPES = {
  PM: "Poor Metabolizer",
  IM: "Intermediate Metabolizer",
  NM: "Normal Metabolizer",
  RM: "Rapid Metabolizer",
  URM: "Ultra-Rapid Metabolizer",
  Unknown: "Unknown/Indeterminate",
};

// Key pharmacogenomic variant database
const VARIANT_DATABASE = {
  // CYP2D6 variants
  rs3892097: {
    gene: "CYP2D6",
    starAllele: "*4",
    effect: "non-functional",
    description:
      "Splicing defect leading to non-functional enzyme. Most common loss-of-function variant in Caucasians.",
  },
  rs5030655: {
    gene: "CYP2D6",
    starAllele: "*6",
    effect: "non-functional",
    description:
      "Single nucleotide deletion causing frameshift. Results in non-functional protein.",
  },
  rs16947: {
    gene: "CYP2D6",
    starAllele: "*2",
    effect: "functional",
    description: "Normal function variant with amino acid change R296C.",
  },
  rs1065852: {
    gene: "CYP2D6",
    starAllele: "*10",
    effect: "decreased",
    description: "Decreased enzyme activity. Common in East Asian populations.",
  },
  rs28371725: {
    gene: "CYP2D6",
    starAllele: "*41",
    effect: "decreased",
    description: "Decreased expression due to splicing defect.",
  },
  rs35742686: {
    gene: "CYP2D6",
    starAllele: "*3",
    effect: "non-functional",
    description: "Frameshift mutation resulting in non-functional enzyme.",
  },
  rs1135840: {
    gene: "CYP2D6",
    starAllele: "*2",
    effect: "functional",
    description: "Normal function variant S486T.",
  },

  // CYP2C19 variants
  rs4244285: {
    gene: "CYP2C19",
    starAllele: "*2",
    effect: "non-functional",
    description:
      "Aberrant splice site leading to non-functional enzyme. Most common loss-of-function allele.",
  },
  rs4986893: {
    gene: "CYP2C19",
    starAllele: "*3",
    effect: "non-functional",
    description: "Premature stop codon (W212X). Common in Asian populations.",
  },
  rs12248560: {
    gene: "CYP2C19",
    starAllele: "*17",
    effect: "increased",
    description: "Increased transcription leading to ultra-rapid metabolism.",
  },
  rs28399504: {
    gene: "CYP2C19",
    starAllele: "*4",
    effect: "non-functional",
    description: "Loss-of-function variant affecting enzyme activity.",
  },

  // CYP2C9 variants
  rs1799853: {
    gene: "CYP2C9",
    starAllele: "*2",
    effect: "decreased",
    description:
      "R144C amino acid change causing ~30% reduced activity. Affects warfarin metabolism.",
  },
  rs1057910: {
    gene: "CYP2C9",
    starAllele: "*3",
    effect: "decreased",
    description:
      "I359L amino acid change causing ~80% reduced activity. Major impact on warfarin dosing.",
  },
  rs28371686: {
    gene: "CYP2C9",
    starAllele: "*5",
    effect: "decreased",
    description: "D360E substitution with decreased enzyme activity.",
  },

  // SLCO1B1 variants
  rs4149056: {
    gene: "SLCO1B1",
    starAllele: "*5",
    effect: "decreased_transport",
    description:
      "V174A substitution decreasing hepatic uptake of statins. Major risk factor for simvastatin-induced myopathy.",
  },
  rs2306283: {
    gene: "SLCO1B1",
    starAllele: "*1b",
    effect: "normal",
    description: "Normal function transporter variant N130D.",
  },
  rs4149015: {
    gene: "SLCO1B1",
    starAllele: "*15",
    effect: "decreased_transport",
    description: "Significantly decreased transporter function.",
  },

  // TPMT variants
  rs1800462: {
    gene: "TPMT",
    starAllele: "*2",
    effect: "non-functional",
    description:
      "A80P substitution causing enzyme instability. Rare but severe impact on thiopurine metabolism.",
  },
  rs1800460: {
    gene: "TPMT",
    starAllele: "*3B",
    effect: "non-functional",
    description: "A154T substitution causing loss of catalytic activity.",
  },
  rs1142345: {
    gene: "TPMT",
    starAllele: "*3C",
    effect: "non-functional",
    description:
      "Y240C substitution. Most common non-functional allele in East Asians and African Americans.",
  },

  // DPYD variants
  rs3918290: {
    gene: "DPYD",
    starAllele: "*2A",
    effect: "non-functional",
    description:
      "IVS14+1G>A splice site mutation causing complete loss of DPD activity. High risk so fluoropyrimidine toxicity.",
  },
  rs55886062: {
    gene: "DPYD",
    starAllele: "*13",
    effect: "non-functional",
    description: "I560S substitution causing loss of DPD enzyme function.",
  },
  rs67376798: {
    gene: "DPYD",
    starAllele: "D949V",
    effect: "decreased",
    description: "D949V substitution with decreased DPD activity.",
  },
  rs75017182: {
    gene: "DPYD",
    starAllele: "HapB3",
    effect: "decreased",
    description:
      "Intronic variant affecting splicing and reducing DPD activity by ~50%.",
  },
};

// Drug-Gene interaction mapping with CPIC-aligned recommendations
const DRUG_GENE_INTERACTIONS = {
  CODEINE: {
    gene: "CYP2D6",
    mechanism:
      "CYP2D6 converts codeine to its active metabolite morphine via O-demethylation. Variations in CYP2D6 activity directly affect the amount of morphine produced.",
    interactions: {
      URM: {
        riskLabel: "Toxic",
        severity: "critical",
        recommendation:
          "AVOID codeine. Ultra-rapid CYP2D6 metabolism causes excessive morphine production, risking life-threatening respiratory depression and death.",
        dosingGuideline:
          "Use alternative analgesic NOT metabolized by CYP2D6 (e.g., morphine, acetaminophen, NSAIDs). Codeine is CONTRAINDICATED.",
        cpicLevel: "Strong recommendation",
      },
      RM: {
        riskLabel: "Adjust Dosage",
        severity: "moderate",
        recommendation:
          "Use codeine with caution. Rapid metabolism may increase morphine levels. Consider lower doses and close monitoring.",
        dosingGuideline:
          "If codeine is necessary, use lowest effective dose. Monitor for signs of opioid toxicity. Consider alternative analgesic.",
        cpicLevel: "Moderate recommendation",
      },
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Standard codeine therapy is expected to produce normal morphine levels. Use at standard dosing.",
        dosingGuideline: "Use label-recommended age-appropriate dosing.",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Ineffective",
        severity: "moderate",
        recommendation:
          "Reduced codeine-to-morphine conversion. Codeine may provide insufficient pain relief.",
        dosingGuideline:
          "Use alternative analgesic NOT metabolized by CYP2D6 (e.g., morphine, acetaminophen, NSAIDs). If codeine is used, monitor for adequate pain control.",
        cpicLevel: "Moderate recommendation",
      },
      PM: {
        riskLabel: "Ineffective",
        severity: "high",
        recommendation:
          "AVOID codeine. No CYP2D6-mediated conversion to morphine. Codeine will provide NO analgesic effect.",
        dosingGuideline:
          "Use alternative analgesic NOT metabolized by CYP2D6 (e.g., morphine for pain). Codeine is INEFFECTIVE in poor metabolizers.",
        cpicLevel: "Strong recommendation",
      },
    },
  },

  CLOPIDOGREL: {
    gene: "CYP2C19",
    mechanism:
      "CYP2C19 bioactivates clopidogrel (a prodrug) into its active thiol metabolite. Without adequate CYP2C19 activity, clopidogrel cannot inhibit platelet aggregation.",
    interactions: {
      URM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Enhanced clopidogrel activation. Standard dosing is expected to be effective with potentially increased antiplatelet effect.",
        dosingGuideline:
          "Use label-recommended dosing. Monitor for signs of increased bleeding risk.",
        cpicLevel: "Moderate recommendation",
      },
      RM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Standard clopidogrel therapy expected to be effective.",
        dosingGuideline: "Use label-recommended dosing.",
        cpicLevel: "Strong recommendation",
      },
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Standard clopidogrel therapy expected to be effective with normal antiplatelet response.",
        dosingGuideline: "Use label-recommended dosing.",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Adjust Dosage",
        severity: "high",
        recommendation:
          "Reduced clopidogrel activation. Increased risk of cardiovascular events due to inadequate platelet inhibition.",
        dosingGuideline:
          "Consider alternative antiplatelet therapy (e.g., prasugrel, ticagrelor) if no contraindications. If clopidogrel is used, consider higher loading doses with platelet function testing.",
        cpicLevel: "Strong recommendation",
      },
      PM: {
        riskLabel: "Ineffective",
        severity: "critical",
        recommendation:
          "AVOID clopidogrel. Significantly reduced or absent bioactivation results in minimal antiplatelet effect. High risk of stent thrombosis and cardiovascular events.",
        dosingGuideline:
          "Use alternative antiplatelet therapy (e.g., prasugrel, ticagrelor). Clopidogrel is CONTRAINDICATED in CYP2C19 poor metabolizers.",
        cpicLevel: "Strong recommendation",
      },
    },
  },

  WARFARIN: {
    gene: "CYP2C9",
    mechanism:
      "CYP2C9 is the primary enzyme responsible for metabolizing the more potent S-warfarin enantiomer. Reduced CYP2C9 activity leads to decreased warfarin clearance and increased bleeding risk.",
    interactions: {
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Standard warfarin metabolism expected. Use standard dosing algorithm with INR monitoring.",
        dosingGuideline:
          "Initiate warfarin per clinical protocol with standard INR monitoring. Consider pharmacogenomic-guided dosing algorithms (e.g., warfarindosing.org).",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Adjust Dosage",
        severity: "high",
        recommendation:
          "Reduced warfarin metabolism. Requires lower doses to achieve therapeutic INR. Higher bleeding risk at standard doses.",
        dosingGuideline:
          "Reduce initial dose by 25-50% per CPIC guidelines. Monitor INR more frequently. Consider pharmacogenomic dosing calculator.",
        cpicLevel: "Strong recommendation",
      },
      PM: {
        riskLabel: "Toxic",
        severity: "critical",
        recommendation:
          "Severely impaired warfarin metabolism. Standard doses cause supratherapeutic INR and high risk of major bleeding including intracranial hemorrhage.",
        dosingGuideline:
          "Reduce initial dose by 50-80%. Increase INR monitoring frequency to every 1-3 days initially. Consider alternative anticoagulant (e.g., DOAC).",
        cpicLevel: "Strong recommendation",
      },
    },
  },

  SIMVASTATIN: {
    gene: "SLCO1B1",
    mechanism:
      "SLCO1B1 encodes the hepatic uptake transporter OATP1B1, which facilitates statin entry into hepatocytes. Reduced SLCO1B1 function increases systemic statin exposure, raising myopathy risk.",
    interactions: {
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Normal hepatic statin uptake. Standard simvastatin dosing is appropriate.",
        dosingGuideline:
          "Use label-recommended dosing (up to 40mg/day). Monitor for muscle symptoms.",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Adjust Dosage",
        severity: "high",
        recommendation:
          "Decreased hepatic statin uptake increases systemic exposure. Elevated risk for simvastatin-induced myopathy.",
        dosingGuideline:
          "Limit simvastatin to 20mg/day or consider alternative statin (pravastatin, rosuvastatin). Avoid simvastatin 80mg. Monitor CK levels.",
        cpicLevel: "Strong recommendation",
      },
      PM: {
        riskLabel: "Toxic",
        severity: "critical",
        recommendation:
          "Markedly increased systemic simvastatin exposure. HIGH risk of myopathy and rhabdomyolysis.",
        dosingGuideline:
          "AVOID simvastatin. Use alternative statin with lower myopathy risk (pravastatin, rosuvastatin) at lowest effective dose. Monitor CK levels regularly.",
        cpicLevel: "Strong recommendation",
      },
    },
  },

  AZATHIOPRINE: {
    gene: "TPMT",
    mechanism:
      "TPMT methylates thiopurine drugs (azathioprine → 6-MP). Reduced TPMT activity leads to accumulation of cytotoxic thioguanine nucleotides (TGN), causing severe and potentially fatal myelosuppression.",
    interactions: {
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Normal TPMT activity. Standard azathioprine dosing with routine monitoring.",
        dosingGuideline:
          "Use standard starting dose (2-3 mg/kg/day). Monitor CBC weekly for first month, then monthly.",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Adjust Dosage",
        severity: "high",
        recommendation:
          "Intermediate TPMT activity leads to increased TGN accumulation. Moderate risk of myelosuppression at standard doses.",
        dosingGuideline:
          "Reduce starting dose to 30-70% of standard dose. Monitor CBC more frequently (weekly for 2-3 months). Titrate based on tolerance.",
        cpicLevel: "Strong recommendation",
      },
      PM: {
        riskLabel: "Toxic",
        severity: "critical",
        recommendation:
          "Absent TPMT activity causes extreme TGN accumulation. LIFE-THREATENING myelosuppression (pancytopenia) at standard doses.",
        dosingGuideline:
          "Drastically reduce dose to 10% of standard dose (3x weekly instead of daily) OR consider alternative immunosuppressant. MANDATORY frequent CBC monitoring (weekly).",
        cpicLevel: "Strong recommendation",
      },
    },
  },

  FLUOROURACIL: {
    gene: "DPYD",
    mechanism:
      "DPYD encodes dihydropyrimidine dehydrogenase (DPD), the rate-limiting enzyme for fluoropyrimidine catabolism. DPD deficiency causes accumulation of 5-FU, leading to severe and potentially fatal toxicity.",
    interactions: {
      NM: {
        riskLabel: "Safe",
        severity: "none",
        recommendation:
          "Normal DPD activity. Standard fluorouracil dosing with routine monitoring.",
        dosingGuideline:
          "Use standard dosing per treatment protocol. Monitor for toxicity per clinical guidelines.",
        cpicLevel: "Strong recommendation",
      },
      IM: {
        riskLabel: "Adjust Dosage",
        severity: "high",
        recommendation:
          "Partial DPD deficiency increases fluorouracil exposure. Elevated risk of severe toxicity including mucositis, diarrhea, and neutropenia.",
        dosingGuideline:
          "Reduce starting dose by 25-50% based on specific DPYD variant activity score. Titrate dose based on clinical tolerance and therapeutic drug monitoring if available.",
        cpicLevel: "Strong recommendation",
      },
      PM: {
        riskLabel: "Toxic",
        severity: "critical",
        recommendation:
          "Complete or near-complete DPD deficiency. LIFE-THREATENING toxicity expected: severe neutropenia, mucositis, hand-foot syndrome, neurotoxicity. Potentially FATAL.",
        dosingGuideline:
          "AVOID fluorouracil and all fluoropyrimidines (capecitabine). Use alternative chemotherapy agents. If fluoropyrimidine is essential, reduce dose by ≥75% with intensive monitoring.",
        cpicLevel: "Strong recommendation",
      },
    },
  },
};

// Diplotype to phenotype mapping for each gene
const DIPLOTYPE_PHENOTYPES = {
  CYP2D6: {
    "*1/*1": "NM",
    "*1/*2": "NM",
    "*2/*2": "NM",
    "*1/*4": "IM",
    "*1/*10": "IM",
    "*1/*41": "IM",
    "*2/*4": "IM",
    "*2/*10": "IM",
    "*1/*3": "IM",
    "*1/*6": "IM",
    "*2/*41": "IM",
    "*4/*4": "PM",
    "*4/*6": "PM",
    "*3/*4": "PM",
    "*6/*6": "PM",
    "*4/*10": "PM",
    "*3/*3": "PM",
    "*3/*6": "PM",
    "*1/*1xN": "URM",
    "*2/*2xN": "URM",
    "*1/*2xN": "URM",
    "*10/*10": "PM",
    "*41/*41": "IM",
    "*10/*41": "IM",
  },
  CYP2C19: {
    "*1/*1": "NM",
    "*1/*17": "RM",
    "*17/*17": "URM",
    "*1/*2": "IM",
    "*1/*3": "IM",
    "*2/*17": "IM",
    "*3/*17": "IM",
    "*2/*2": "PM",
    "*2/*3": "PM",
    "*3/*3": "PM",
  },
  CYP2C9: {
    "*1/*1": "NM",
    "*1/*2": "IM",
    "*1/*3": "IM",
    "*1/*5": "IM",
    "*2/*2": "PM",
    "*2/*3": "PM",
    "*3/*3": "PM",
    "*2/*5": "PM",
    "*3/*5": "PM",
  },
  SLCO1B1: {
    // *1a-based wildtype entries (primary)
    "*1a/*1a": "NM",
    "*1a/*1b": "NM",
    "*1b/*1b": "NM",
    "*1a/*5": "IM",
    "*1b/*5": "IM",
    "*1a/*15": "IM",
    "*5/*5": "PM",
    "*15/*15": "PM",
    "*5/*15": "PM",
    // Safety net: *1-based entries (in case of fallback)
    "*1/*1": "NM",
    "*1/*5": "IM",
    "*1/*15": "IM",
    "*1/*1b": "NM",
  },
  TPMT: {
    "*1/*1": "NM",
    "*1/*2": "IM",
    "*1/*3A": "IM",
    "*1/*3B": "IM",
    "*1/*3C": "IM",
    "*3A/*3A": "PM",
    "*3C/*3C": "PM",
    "*2/*3A": "PM",
    "*3A/*3C": "PM",
    "*3B/*3B": "PM",
    "*3B/*3C": "PM",
    "*2/*3B": "PM",
    "*2/*3C": "PM",
    "*2/*2": "PM",
  },
  DPYD: {
    "*1/*1": "NM",
    "Normal/Normal": "NM",
    "*1/*2A": "IM",
    "*1/*13": "IM",
    "*1/D949V": "IM",
    "*1/HapB3": "IM",
    "*2A/*2A": "PM",
    "*13/*13": "PM",
    "*2A/*13": "PM",
    "*2A/D949V": "PM",
    "D949V/D949V": "PM",
  },
};

/**
 * Get the primary gene for a given drug
 */
function getGeneForDrug(drugName) {
  const drug = drugName.toUpperCase();
  if (DRUG_GENE_INTERACTIONS[drug]) {
    return DRUG_GENE_INTERACTIONS[drug].gene;
  }
  return null;
}

/**
 * Determine phenotype from a diplotype and gene
 */
function getPhenotype(gene, diplotype) {
  const geneMap = DIPLOTYPE_PHENOTYPES[gene];
  if (geneMap && geneMap[diplotype]) {
    return geneMap[diplotype];
  }
  return "Unknown";
}

/**
 * Get drug interaction details for a given drug and phenotype
 */
function getDrugInteraction(drugName, phenotype) {
  const drug = drugName.toUpperCase();
  const drugInfo = DRUG_GENE_INTERACTIONS[drug];
  if (!drugInfo) return null;

  const interaction = drugInfo.interactions[phenotype];
  if (!interaction) {
    // Default to Unknown
    return {
      riskLabel: "Unknown",
      severity: "low",
      recommendation: `Insufficient data to determine ${drug} risk for ${PHENOTYPES[phenotype] || phenotype} phenotype. Consult clinical pharmacogenomics specialist.`,
      dosingGuideline:
        "Use standard dosing with enhanced monitoring. Consider specialist consultation.",
      cpicLevel: "No recommendation",
    };
  }
  return { ...interaction, mechanism: drugInfo.mechanism };
}

/**
 * Get variant information from the database
 */
function getVariantInfo(rsid) {
  return VARIANT_DATABASE[rsid] || null;
}

module.exports = {
  PHENOTYPES,
  VARIANT_DATABASE,
  DRUG_GENE_INTERACTIONS,
  DIPLOTYPE_PHENOTYPES,
  getGeneForDrug,
  getPhenotype,
  getDrugInteraction,
  getVariantInfo,
};
