/**
 * VCF Parser Module
 * Parses Variant Call Format (VCF v4.2) files and extracts pharmacogenomic variants
 * for 6 critical genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD
 */

const TARGET_GENES = ['CYP2D6', 'CYP2C19', 'CYP2C9', 'SLCO1B1', 'TPMT', 'DPYD'];

/**
 * Parse a VCF file content string into structured variant data
 * @param {string} vcfContent - Raw VCF file content
 * @returns {object} Parsed VCF data with metadata and variants
 */
function parseVCF(vcfContent) {
  const lines = vcfContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const result = {
    metadata: {
      fileFormat: '',
      source: '',
      reference: '',
      sampleIds: [],
    },
    variants: [],
    pharmacogenomicVariants: [],
    parsingSuccess: true,
    errors: [],
  };

  try {
    let headerColumns = [];

    for (const line of lines) {
      // Meta-information lines
      if (line.startsWith('##')) {
        const meta = parseMetaLine(line);
        if (meta.key === 'fileformat') result.metadata.fileFormat = meta.value;
        if (meta.key === 'source') result.metadata.source = meta.value;
        if (meta.key === 'reference') result.metadata.reference = meta.value;
        continue;
      }

      // Header line
      if (line.startsWith('#CHROM')) {
        headerColumns = line.substring(1).split('\t');
        // Extract sample IDs (columns after FORMAT)
        const formatIdx = headerColumns.indexOf('FORMAT');
        if (formatIdx !== -1 && formatIdx < headerColumns.length - 1) {
          result.metadata.sampleIds = headerColumns.slice(formatIdx + 1);
        }
        continue;
      }

      // Data lines
      const variant = parseVariantLine(line, headerColumns);
      if (variant) {
        result.variants.push(variant);

        // Check if this variant is pharmacogenomically relevant
        if (variant.gene && TARGET_GENES.includes(variant.gene.toUpperCase())) {
          result.pharmacogenomicVariants.push({
            rsid: variant.rsid || variant.id,
            gene: variant.gene.toUpperCase(),
            chromosome: variant.chrom,
            position: variant.pos,
            ref: variant.ref,
            alt: variant.alt,
            starAllele: variant.starAllele || null,
            genotype: variant.genotype || null,
            quality: variant.qual,
            filter: variant.filter,
            zygosity: determineZygosity(variant.genotype),
            clinicalSignificance: variant.clinicalSignificance || 'unknown',
            frequency: variant.frequency || null,
          });
        }
      }
    }

    // Extract patient ID from sample IDs or filename
    if (result.metadata.sampleIds.length > 0) {
      result.patientId = result.metadata.sampleIds[0];
    }

  } catch (error) {
    result.parsingSuccess = false;
    result.errors.push(`VCF parsing error: ${error.message}`);
  }

  return result;
}

/**
 * Parse a VCF meta-information line (##key=value)
 */
function parseMetaLine(line) {
  const match = line.match(/^##(\w+)=(.+)$/);
  if (match) {
    return { key: match[1].toLowerCase(), value: match[2] };
  }
  return { key: '', value: '' };
}

/**
 * Parse a single variant data line
 */
function parseVariantLine(line, headerColumns) {
  const fields = line.split('\t');
  if (fields.length < 8) return null;

  const variant = {
    chrom: fields[0],
    pos: parseInt(fields[1]),
    id: fields[2] || '.',
    ref: fields[3],
    alt: fields[4],
    qual: fields[5] !== '.' ? parseFloat(fields[5]) : null,
    filter: fields[6],
    info: parseInfoField(fields[7]),
    genotype: null,
    rsid: null,
    gene: null,
    starAllele: null,
    clinicalSignificance: null,
    frequency: null,
  };

  // Extract rsID
  if (variant.id && variant.id.startsWith('rs')) {
    variant.rsid = variant.id;
  }
  // Also check INFO field for RS tag
  if (variant.info.RS) {
    variant.rsid = variant.info.RS.startsWith('rs') ? variant.info.RS : `rs${variant.info.RS}`;
  }

  // Extract gene from INFO
  if (variant.info.GENE) {
    variant.gene = variant.info.GENE;
  }

  // Extract star allele from INFO
  if (variant.info.STAR) {
    variant.starAllele = variant.info.STAR;
  }

  // Extract clinical significance
  if (variant.info.CLNSIG) {
    variant.clinicalSignificance = variant.info.CLNSIG;
  }

  // Extract allele frequency
  if (variant.info.AF) {
    variant.frequency = parseFloat(variant.info.AF);
  }

  // Extract genotype from FORMAT/SAMPLE columns
  if (fields.length > 9) {
    const formatField = fields[8];
    const sampleField = fields[9];
    const formatKeys = formatField.split(':');
    const sampleValues = sampleField.split(':');
    const gtIndex = formatKeys.indexOf('GT');
    if (gtIndex !== -1 && gtIndex < sampleValues.length) {
      variant.genotype = sampleValues[gtIndex];
    }
  }

  return variant;
}

/**
 * Parse INFO field (key=value pairs separated by semicolons)
 */
function parseInfoField(infoStr) {
  const info = {};
  if (!infoStr || infoStr === '.') return info;

  const pairs = infoStr.split(';');
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex !== -1) {
      const key = pair.substring(0, eqIndex);
      const value = pair.substring(eqIndex + 1);
      info[key] = value;
    } else {
      info[pair] = true; // Flag fields like "DB"
    }
  }
  return info;
}

/**
 * Determine zygosity from genotype string
 */
function determineZygosity(genotype) {
  if (!genotype) return 'unknown';
  const alleles = genotype.split(/[\/\|]/);
  if (alleles.length !== 2) return 'unknown';
  if (alleles[0] === alleles[1]) {
    return alleles[0] === '0' ? 'homozygous_reference' : 'homozygous_variant';
  }
  return 'heterozygous';
}

/**
 * Validate VCF content before parsing
 */
function validateVCF(vcfContent) {
  const errors = [];

  if (!vcfContent || vcfContent.trim().length === 0) {
    errors.push('VCF file is empty');
    return { valid: false, errors };
  }

  if (!vcfContent.includes('##fileformat=VCF')) {
    errors.push('Missing VCF file format header (##fileformat=VCF)');
  }

  if (!vcfContent.includes('#CHROM')) {
    errors.push('Missing column header line (#CHROM)');
  }

  const lines = vcfContent.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
  if (lines.length === 0) {
    errors.push('No variant data lines found');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { parseVCF, validateVCF, TARGET_GENES };
