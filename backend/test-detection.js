/**
 * Test script: Verify variant detection pipeline for all 3 sample VCF files.
 * Run: node test-detection.js
 */

const fs = require("fs");
const path = require("path");
const { parseVCF, validateVCF } = require("./vcfParser");
const { predictRisk } = require("./riskEngine");

const SAMPLES_DIR = path.join(__dirname, "..", "samples");

// Expected results for each sample file
const TEST_CASES = [
  {
    file: "sample_patient_001.vcf",
    tests: [
      {
        drug: "CODEINE",
        expectedGene: "CYP2D6",
        expectedDiplotype: "*4/*4",
        expectedPhenotype: "PM",
        expectedRisk: "Ineffective",
      },
      {
        drug: "WARFARIN",
        expectedGene: "CYP2C9",
        expectedDiplotype: "*1/*2",
        expectedPhenotype: "IM",
        expectedRisk: "Adjust Dosage",
      },
      {
        drug: "SIMVASTATIN",
        expectedGene: "SLCO1B1",
        expectedDiplotype: "*1a/*5",
        expectedPhenotype: "IM",
        expectedRisk: "Adjust Dosage",
      },
    ],
  },
  {
    file: "sample_patient_002.vcf",
    tests: [
      {
        drug: "CLOPIDOGREL",
        expectedGene: "CYP2C19",
        expectedDiplotype: "*2/*2",
        expectedPhenotype: "PM",
        expectedRisk: "Ineffective",
      },
      {
        drug: "FLUOROURACIL",
        expectedGene: "DPYD",
        expectedDiplotype: "*1/*2A",
        expectedPhenotype: "IM",
        expectedRisk: "Adjust Dosage",
      },
      {
        drug: "CODEINE",
        expectedGene: "CYP2D6",
        expectedDiplotype: "*1/*4",
        expectedPhenotype: "IM",
        expectedRisk: "Ineffective",
      },
    ],
  },
  {
    file: "sample_patient_003.vcf",
    tests: [
      {
        drug: "SIMVASTATIN",
        expectedGene: "SLCO1B1",
        expectedDiplotype: "*5/*5",
        expectedPhenotype: "PM",
        expectedRisk: "Toxic",
      },
      {
        drug: "CLOPIDOGREL",
        expectedGene: "CYP2C19",
        expectedDiplotype: "*2/*17",
        expectedPhenotype: "IM",
        expectedRisk: "Adjust Dosage",
      },
      {
        drug: "AZATHIOPRINE",
        expectedGene: "TPMT",
        expectedDiplotype: "*3B/*3C",
        expectedPhenotype: null,
        expectedRisk: null,
      }, // check detection only
    ],
  },
];

let passed = 0;
let failed = 0;

for (const sample of TEST_CASES) {
  const filePath = path.join(SAMPLES_DIR, sample.file);
  const vcfContent = fs.readFileSync(filePath, "utf-8");

  // Validate
  const validation = validateVCF(vcfContent);
  if (!validation.valid) {
    console.error(
      `❌ VALIDATION FAILED for ${sample.file}:`,
      validation.errors,
    );
    failed++;
    continue;
  }

  // Parse
  const parsedVCF = parseVCF(vcfContent);
  console.log(`\n📄 ${sample.file}`);
  console.log(`   Patient: ${parsedVCF.patientId}`);
  console.log(`   Total variants: ${parsedVCF.variants.length}`);
  console.log(
    `   Pharmacogenomic variants: ${parsedVCF.pharmacogenomicVariants.length}`,
  );
  console.log(
    `   PGx variants: ${parsedVCF.pharmacogenomicVariants.map((v) => `${v.rsid}(${v.gene} ${v.starAllele} ${v.zygosity})`).join(", ")}`,
  );

  for (const test of sample.tests) {
    const result = predictRisk(parsedVCF, test.drug);
    const profile = result.pharmacogenomic_profile;
    const risk = result.risk_assessment;

    const diploMatch = profile.diplotype === test.expectedDiplotype;
    const phenoMatch =
      test.expectedPhenotype === null ||
      profile.phenotype === test.expectedPhenotype;
    const riskMatch =
      test.expectedRisk === null || risk.risk_label === test.expectedRisk;
    const allPass = diploMatch && phenoMatch && riskMatch;

    if (allPass) {
      console.log(
        `   ✅ ${test.drug}: diplotype=${profile.diplotype} phenotype=${profile.phenotype} risk=${risk.risk_label} (confidence=${risk.confidence_score})`,
      );
      passed++;
    } else {
      console.log(`   ❌ ${test.drug}:`);
      if (!diploMatch)
        console.log(
          `      Diplotype: got "${profile.diplotype}" expected "${test.expectedDiplotype}"`,
        );
      if (!phenoMatch)
        console.log(
          `      Phenotype: got "${profile.phenotype}" expected "${test.expectedPhenotype}"`,
        );
      if (!riskMatch)
        console.log(
          `      Risk:      got "${risk.risk_label}" expected "${test.expectedRisk}"`,
        );
      // Show detected variants for debugging
      console.log(
        `      Detected variants: ${profile.detected_variants.map((v) => `${v.rsid}(${v.star_allele} ${v.zygosity})`).join(", ") || "none"}`,
      );
      failed++;
    }
  }
}

console.log(`\n${"=".repeat(50)}`);
console.log(
  `Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`,
);
console.log(`${"=".repeat(50)}\n`);
process.exit(failed > 0 ? 1 : 0);
