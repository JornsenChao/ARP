import fs from 'fs';
import path from 'path';
import { Document } from 'langchain/document';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { advancedPdfLoader } from './advancedPdfLoader.js';
import { CSVLoader } from 'langchain/document_loaders/fs/csv';
import XLSX from 'xlsx';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export const embeddingsService = {
  async loadAndSplitDocumentsByType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    let docs = [];

    if (ext === '.pdf') {
      // const loader = new PDFLoader(filePath);
      // docs = await loader.load();
      docs = await advancedPdfLoader(filePath, {
        chunkSizeChars: 1500,
        lineLen: 100,
      });
    } else if (ext === '.csv') {
      const loader = new CSVLoader(filePath);
      docs = await loader.load();
    } else if (ext === '.xlsx' || ext === '.xls') {
      const workbook = XLSX.readFile(filePath);
      let allText = '';
      workbook.SheetNames.forEach((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(sheet);
        allText += `Sheet: ${sheetName}\n${csvData}\n`;
      });
      docs = [new Document({ pageContent: allText })];
    } else if (ext === '.txt') {
      const txt = fs.readFileSync(filePath, 'utf-8');
      docs = [new Document({ pageContent: txt })];
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    return splitter.splitDocuments(docs);
  },

  async buildMemoryVectorStore(docs) {
    // 构建向量索引 (OpenAI Embeddings)
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    return await MemoryVectorStore.fromDocuments(docs, embeddings);
  },
};
