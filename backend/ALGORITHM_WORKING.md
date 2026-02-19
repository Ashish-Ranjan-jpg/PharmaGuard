# PharmaGuard Backend Algorithm: Working, Terms, and Example

## 1. What the algorithm does
The backend converts a patient's VCF genetic file into a pharmacogenomic risk decision for one or more drugs.

Pipeline:
1. Input intake (`VCF file` + `drug name(s)`)
2. VCF validation
3. VCF parsing and pharmacogenomic variant extraction
4. Diplotype construction for the drug's primary gene
5. Phenotype inference from diplotype
6. Drug-risk mapping (CPIC-aligned knowledge base)
7. Confidence score calculation
8. Structured JSON response (+ optional LLM explanation)

---

## 2. Step-by-step algorithm flow

### Step 1: Input
Endpoint receives:
- `vcfFile`: uploaded `.vcf` file
- `drugs`: one or more drug names (comma-separated)
- optional `userId` (used for storage grouping)

### Step 2: VCF validation
The validator checks:
- file is non-empty
- contains `##fileformat=VCF`
- contains `#CHROM` header line
- contains at least one variant data line

If validation fails, API returns a 400 response with validation errors.

### Step 3: Parse VCF and extract relevant variants
For each variant line, parser extracts:
- chromosome (`CHROM`)
- position (`POS`)
- variant ID (`ID`, often rsID)
- reference allele (`REF`)
- alternate allele (`ALT`)
- quality (`QUAL`)
- filter status (`FILTER`)
- INFO tags (for example `GENE`, `STAR`, `RS`, `CLNSIG`, `AF`)
- genotype (`GT`) from sample format columns

Then it determines zygosity from genotype:
- `0/0` -> `homozygous_reference`
- `0/1` or `1/0` -> `heterozygous`
- `1/1` -> `homozygous_variant`

It keeps only pharmacogenomic target genes:
- `CYP2D6`, `CYP2C19`, `CYP2C9`, `SLCO1B1`, `TPMT`, `DPYD`

And only if patient carries alternate allele (not `0/0`).

### Step 4: Select the primary gene for the drug
Drug-to-gene mapping is done through the knowledge base, for example:
- `WARFARIN -> CYP2C9`
- `CLOPIDOGREL -> CYP2C19`
- `CODEINE -> CYP2D6`

If drug is unsupported, response is returned as `Unknown`.

### Step 5: Build diplotype
Diplotype = pair of star alleles for the selected gene (for example `*1/*3`).

Rules used:
1. Collect star alleles from detected variants (from INFO or rsID DB fallback).
2. If genotype is homozygous variant, include allele twice.
3. If heterozygous, include allele once.
4. If no usable star alleles, default to wildtype/wildtype:
   - usually `*1/*1` (SLCO1B1 uses `*1a/*1a`)
5. If >2 candidate alleles exist, prioritize by effect severity:
   - non-functional > decreased/decreased_transport > increased > functional/normal
6. Sort for stable representation and output as `alleleA/alleleB`.

### Step 6: Infer phenotype from diplotype
Lookup tables map `(gene, diplotype)` to phenotype code:
- `PM` = Poor Metabolizer
- `IM` = Intermediate Metabolizer
- `NM` = Normal Metabolizer
- `RM` = Rapid Metabolizer
- `URM` = Ultra-Rapid Metabolizer
- `Unknown` if no mapping exists

### Step 7: Map phenotype to clinical risk for the drug
Using drug-specific interaction rules, engine outputs:
- `risk_label` (Safe / Adjust Dosage / Toxic / Ineffective / Unknown)
- `severity`
- recommendation text
- dosing guideline
- CPIC recommendation level
- monitoring recommendations
- potential alternative drugs

### Step 8: Compute confidence score
Starts at `0.5`, then adjusted:
- `+0.15` if at least one gene-specific variant exists
- `+0.10` if more than one gene-specific variant exists
- `+0.15` if diplotype method is `variant_based`
- `-0.10` if method is `default_wildtype`
- `+0.10` if phenotype is known (not `Unknown`)

Final score is clamped between `0.1` and `0.99`.

### Step 9: Build API response
Response includes:
- patient ID
- drug
- timestamp
- risk assessment block
- pharmacogenomic profile block
- clinical recommendation block
- quality metrics block
- optional `llm_generated_explanation`

---

## 3. Definitions of all key terms

- **VCF (Variant Call Format):** Standard text file format for genomic variant calls.
- **Variant:** A DNA position where patient sequence differs from reference.
- **rsID:** dbSNP identifier for a specific known variant (example: `rs1057910`).
- **Gene:** Functional DNA unit affecting biology; here, drug metabolism/transport genes.
- **Allele:** One version of a variant at a locus.
- **Reference allele (REF):** Genome reference nucleotide(s) at the site.
- **Alternate allele (ALT):** Observed non-reference nucleotide(s) in patient sample.
- **Genotype (GT):** Pair of allele calls (for diploid samples), e.g. `0/1`, `1/1`.
- **Zygosity:** Whether both alleles are same or different at the site.
- **Star allele:** Pharmacogenomic allele naming convention (e.g. `*1`, `*2`, `*3`).
- **Wildtype:** Typical baseline allele; represented as `*1` (or gene-specific equivalent like `*1a`).
- **Diplotype:** Pair of star alleles across two chromosomes for a gene (e.g. `*1/*2`).
- **Phenotype:** Predicted functional activity class inferred from diplotype.
- **CPIC:** Clinical Pharmacogenetics Implementation Consortium; guideline source for gene-drug actions.
- **Risk label:** Clinical action category in output (`Safe`, `Adjust Dosage`, `Toxic`, `Ineffective`, `Unknown`).
- **Severity:** Relative seriousness of predicted risk (none/moderate/high/critical/low).
- **Confidence score:** Heuristic confidence value for algorithm output.
- **Pharmacogenomic variant:** Genetic variant relevant to drug response for target PGx genes.

---

## 4. Worked example (Warfarin)

### Input
- Drug: `WARFARIN`
- VCF contains CYP2C9 variant:
  - rsID: `rs1799853`
  - Gene: `CYP2C9`
  - Genotype: `0/1` (heterozygous)
  - Known star allele mapping: `*2`

### Algorithm execution
1. VCF passes structural validation.
2. Parser extracts variant and marks it pharmacogenomically relevant.
3. Drug-gene mapping chooses primary gene `CYP2C9`.
4. Diplotype builder sees one heterozygous `*2` variant, combines with wildtype:
   - Diplotype = `*1/*2`
5. Phenotype mapping for `CYP2C9 *1/*2` -> `IM`.
6. Drug interaction mapping for `WARFARIN + IM`:
   - Risk label: `Adjust Dosage`
   - Typical guidance: lower initial dose and increase INR monitoring.
7. Confidence score is computed from variant presence, method, and known phenotype.
8. Final structured response is returned.

### Clinical interpretation (high level)
This genotype suggests reduced warfarin metabolism compared with normal metabolizers, so standard dosing can increase bleeding risk; dose adjustment and closer INR follow-up are recommended.

---

## 5. Notes and scope
- This backend currently supports only the configured drug-gene pairs in the knowledge base.
- If a drug or diplotype is not mapped, response falls back to `Unknown` guidance.
- Algorithm is rule/knowledge-base driven, not a trained ML model.
