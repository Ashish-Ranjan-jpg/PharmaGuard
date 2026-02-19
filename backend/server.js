/**
 * PharmaGuard Backend Server
 * Express API for pharmacogenomic risk prediction
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { parseVCF, validateVCF } = require('./vcfParser');
const { predictRisk } = require('./riskEngine');
const { generateExplanation } = require('./geminiService');
const { uploadVCFFile, uploadProfileImage } = require('./cloudinaryService');

const app = express();
const PORT = process.env.PORT || 5000;

// Multer config for file uploads (5MB limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.vcf') {
      cb(null, true);
    } else {
      cb(new Error('Only .vcf files are allowed'), false);
    }
  },
});

// Middleware
app.use(cors({
  origin:[process.env.FRONTEND_URL,'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'PharmaGuard API', version: '1.0.0', timestamp: new Date().toISOString() });
});

/**
 * POST /api/analyze
 * Main analysis endpoint - accepts VCF file + drug name(s)
 * Returns pharmacogenomic risk assessment
 */
app.post('/api/analyze', upload.single('vcfFile'), async (req, res) => {
  try {
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: 'No VCF file uploaded', details: 'Please upload a .vcf file' });
    }

    const drugs = req.body.drugs;
    if (!drugs || drugs.trim().length === 0) {
      return res.status(400).json({ error: 'No drug specified', details: 'Please provide at least one drug name' });
    }

    // Parse drug names (comma-separated)
    const drugList = drugs.split(',').map(d => d.trim().toUpperCase()).filter(d => d.length > 0);
    if (drugList.length === 0) {
      return res.status(400).json({ error: 'Invalid drug names', details: 'Please provide valid drug names' });
    }

    // Read VCF file content
    const vcfContent = req.file.buffer.toString('utf-8');

    // Validate VCF
    const validation = validateVCF(vcfContent);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid VCF file',
        details: validation.errors,
        quality_metrics: { vcf_parsing_success: false }
      });
    }

    // Parse VCF
    const parsedVCF = parseVCF(vcfContent);

    // Upload VCF to Cloudinary (optional, don't block on failure)
    let cloudinaryUrl = null;
    const userId = req.body.userId || 'anonymous';
    try {
      const uploadResult = await uploadVCFFile(req.file.buffer, req.file.originalname, userId);
      if (uploadResult.success) {
        cloudinaryUrl = uploadResult.url;
      }
    } catch (uploadError) {
      console.warn('Cloudinary upload failed (non-critical):', uploadError.message);
    }

    // Process each drug
    const results = [];
    for (const drug of drugList) {
      // Predict risk
      const riskResult = predictRisk(parsedVCF, drug);

      // Generate LLM explanation
      const explanation = await generateExplanation(riskResult);
      riskResult.llm_generated_explanation = explanation;

      // Add file URL if available
      if (cloudinaryUrl) {
        riskResult.quality_metrics.vcf_file_url = cloudinaryUrl;
      }

      results.push(riskResult);
    }

    // Return single result or array
    if (results.length === 1) {
      res.json(results[0]);
    } else {
      res.json({ multi_drug_analysis: true, results, total_drugs_analyzed: results.length });
    }

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      details: error.message,
      quality_metrics: { vcf_parsing_success: false }
    });
  }
});

/**
 * POST /api/upload
 * Upload VCF file to Cloudinary without analysis
 */
app.post('/api/upload', upload.single('vcfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.body.userId || 'anonymous';
    const result = await uploadVCFFile(req.file.buffer, req.file.originalname, userId);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: 'Upload failed', details: result.error });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

/**
 * POST /api/upload-profile-image
 * Upload profile image to Cloudinary
 */
app.post('/api/upload-profile-image', multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for images
  fileFilter: (req, file, cb) => {
    console.log('Multer file filter:', file.mimetype);
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'), false);
    }
  },
}).single('image'), async (req, res) => {
  try {
    console.log('Upload image request received');
    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const userId = req.body.userId || 'anonymous';
    console.log('Uploading for user:', userId, 'File size:', req.file.size);
    
    const result = await uploadProfileImage(req.file.buffer, userId);
    console.log('Cloudinary upload result:', result.success ? 'Success' : 'Failed');

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json({ error: 'Upload failed', details: result.error });
    }
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

/**
 * POST /api/validate-vcf
 * Validate a VCF file without full analysis
 */
app.post('/api/validate-vcf', upload.single('vcfFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ valid: false, errors: ['No file uploaded'] });
    }

    const vcfContent = req.file.buffer.toString('utf-8');
    const validation = validateVCF(vcfContent);

    if (validation.valid) {
      const parsed = parseVCF(vcfContent);
      res.json({
        valid: true,
        summary: {
          totalVariants: parsed.variants.length,
          pharmacogenomicVariants: parsed.pharmacogenomicVariants.length,
          genesDetected: [...new Set(parsed.pharmacogenomicVariants.map(v => v.gene))],
          patientId: parsed.patientId || 'Unknown',
          fileFormat: parsed.metadata.fileFormat,
        }
      });
    } else {
      res.json({ valid: false, errors: validation.errors });
    }
  } catch (error) {
    res.status(500).json({ valid: false, errors: [error.message] });
  }
});

/**
 * GET /api/supported-drugs
 * Return list of supported drugs
 */
app.get('/api/supported-drugs', (req, res) => {
  res.json({
    drugs: [
      { name: 'CODEINE', gene: 'CYP2D6', category: 'Analgesic (Opioid)' },
      { name: 'CLOPIDOGREL', gene: 'CYP2C19', category: 'Antiplatelet' },
      { name: 'WARFARIN', gene: 'CYP2C9', category: 'Anticoagulant' },
      { name: 'SIMVASTATIN', gene: 'SLCO1B1', category: 'Statin (Lipid-lowering)' },
      { name: 'AZATHIOPRINE', gene: 'TPMT', category: 'Immunosuppressant' },
      { name: 'FLUOROURACIL', gene: 'DPYD', category: 'Chemotherapy (Antimetabolite)' },
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large', details: 'Maximum file size limit exceeded' });
    }
    return res.status(400).json({ error: 'File upload error', details: err.message });
  }
  
  // Handle custom file filter errors
  if (err.message.includes('Only') && err.message.includes('allowed')) {
    return res.status(400).json({ error: 'Invalid file type', details: err.message });
  }

  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🧬 PharmaGuard API Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ Not configured'}\n`);
});

module.exports = app;
