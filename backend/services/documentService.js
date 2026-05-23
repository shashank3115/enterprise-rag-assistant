// ============================================
// Document Service
// Extract text, chunk, and generate embeddings
// ============================================

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const csv = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const { generateEmbedding, generateEmbeddings } = require('../config/gemini');
const vectorStore = require('../config/vectorStore');

// ---- Text Extraction ----

// Extract text from PDF
const extractPDF = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return data.text;
};

// Extract text from CSV
const extractCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Convert each row to a readable string
        const rowText = Object.entries(row)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        rows.push(rowText);
      })
      .on('end', () => resolve(rows.join('\n')))
      .on('error', reject);
  });
};

// Extract text from JSON
const extractJSON = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  // If array, convert each item to readable text
  if (Array.isArray(data)) {
    return data
      .map((item) =>
        Object.entries(item)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ')
      )
      .join('\n\n');
  }

  // If object, just stringify nicely
  return JSON.stringify(data, null, 2);
};

// Extract text from TXT
const extractTXT = (filePath) => {
  return fs.readFileSync(filePath, 'utf-8');
};

// Route to correct extractor based on file type
const extractText = async (filePath, fileType) => {
  switch (fileType) {
    case 'pdf':
      return extractPDF(filePath);
    case 'csv':
      return extractCSV(filePath);
    case 'json':
      return extractJSON(filePath);
    case 'txt':
      return extractTXT(filePath);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
};

// ---- Chunking ----

// Split text into overlapping chunks
const chunkText = (text, chunkSize = 500, overlap = 100) => {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 20) {
      // Skip very small chunks
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
};

// ---- Main Processing Pipeline ----

const processDocument = async (filePath, fileType, documentId, metadata = {}) => {
  try {
    // 1. Extract text
    console.log(`📄 Extracting text from ${fileType} file...`);
    const text = await extractText(filePath, fileType);

    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file.');
    }

    // 2. Chunk the text
    console.log(`✂️ Chunking text (${text.length} chars)...`);
    const chunks = chunkText(text);
    console.log(`   Created ${chunks.length} chunks`);

    // 3. Generate embeddings for all chunks
    console.log(`🧠 Generating embeddings...`);
    const embeddings = await generateEmbeddings(chunks);

    // 4. Store in vector store and MongoDB
    console.log(`💾 Storing chunks and embeddings...`);
    const chunkDocs = [];

    for (let i = 0; i < chunks.length; i++) {
      const embeddingId = uuidv4();

      // Store in in-memory vector store
      vectorStore.add(embeddingId, embeddings[i], chunks[i], {
        documentId: documentId.toString(),
        department: metadata.department || 'general',
        roleAccess: metadata.allowedRoles || [],
        source: metadata.title || 'unknown',
        documentTitle: metadata.title || 'Untitled',
      });

      // Store chunk in MongoDB
      chunkDocs.push({
        documentId,
        content: chunks[i],
        chunkIndex: i,
        embeddingId,
        metadata: {
          source: metadata.title || 'unknown',
          department: metadata.department || 'general',
          roleAccess: metadata.allowedRoles || [],
          confidence: 1.0,
          documentTitle: metadata.title || 'Untitled',
        },
      });
    }

    // Bulk insert chunks
    await Chunk.insertMany(chunkDocs);

    // Update document status
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunkCount: chunks.length,
      embeddingReference: `vectorstore:${documentId}`,
    });

    console.log(`✅ Document processed: ${chunks.length} chunks stored`);
    return { chunkCount: chunks.length, status: 'ready' };
  } catch (err) {
    console.error(`❌ Document processing error:`, err.message);
    await Document.findByIdAndUpdate(documentId, { status: 'error' });
    throw err;
  }
};

// Process raw text directly (for seed data)
const processRawText = async (text, documentId, metadata = {}) => {
  try {
    const chunks = chunkText(text);
    const embeddings = await generateEmbeddings(chunks);
    const chunkDocs = [];

    for (let i = 0; i < chunks.length; i++) {
      const embeddingId = uuidv4();
      vectorStore.add(embeddingId, embeddings[i], chunks[i], {
        documentId: documentId.toString(),
        department: metadata.department || 'general',
        roleAccess: metadata.allowedRoles || [],
        source: metadata.title || 'unknown',
        documentTitle: metadata.title || 'Untitled',
      });

      chunkDocs.push({
        documentId,
        content: chunks[i],
        chunkIndex: i,
        embeddingId,
        metadata: {
          source: metadata.title || 'unknown',
          department: metadata.department || 'general',
          roleAccess: metadata.allowedRoles || [],
          confidence: 1.0,
          documentTitle: metadata.title || 'Untitled',
        },
      });
    }

    await Chunk.insertMany(chunkDocs);
    await Document.findByIdAndUpdate(documentId, {
      status: 'ready',
      chunkCount: chunks.length,
      embeddingReference: `vectorstore:${documentId}`,
    });

    return { chunkCount: chunks.length };
  } catch (err) {
    await Document.findByIdAndUpdate(documentId, { status: 'error' });
    throw err;
  }
};

module.exports = { extractText, chunkText, processDocument, processRawText };
