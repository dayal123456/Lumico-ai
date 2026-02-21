
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Handle potential default export structure from different bundlers/CDNs
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

// Configure PDF Worker
// We use the CDN version loaded in index.html, but ensure the library uses it
if (pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
  console.warn("PDF.js GlobalWorkerOptions not found, PDF reading might fail.");
}

export interface ProcessedFile {
  name: string;
  content: string; // The extracted text
  type: 'file' | 'image';
  originalType: string;
}

export const processFile = async (file: File): Promise<ProcessedFile> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  // Images (pass as base64 for vision models)
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileType || '')) {
    const base64 = await readFileAsBase64(file);
    return { name: file.name, content: base64, type: 'image', originalType: file.type };
  }

  // Text-based processing for AI context
  let textContent = '';

  try {
    if (fileType === 'pdf') {
      textContent = await readPdfFile(file);
    } else if (['xlsx', 'xls', 'csv'].includes(fileType || '')) {
      textContent = await readExcelFile(file);
    } else if (fileType === 'zip') {
      textContent = await readZipFile(file);
    } else {
      // Default to plain text reading
      textContent = await readFileAsText(file);
    }
  } catch (error) {
    console.error("Error reading file:", error);
    textContent = `[Error reading file ${file.name}: ${(error as any).message}]`;
  }

  return { name: file.name, content: textContent, type: 'file', originalType: file.type };
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const readPdfFile = async (file: File): Promise<string> => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  // Use the normalized pdfjs object
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let fullText = `--- PDF FILE: ${file.name} ---\n`;
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }
  return fullText;
};

const readExcelFile = async (file: File): Promise<string> => {
  const arrayBuffer = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  let fullText = `--- EXCEL FILE: ${file.name} ---\n`;

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    fullText += `[Sheet: ${sheetName}]\n`;
    fullText += jsonData.map((row: any) => row.join(' | ')).join('\n');
    fullText += '\n\n';
  });
  return fullText;
};

const readZipFile = async (file: File): Promise<string> => {
  const zip = await JSZip.loadAsync(file);
  let fullText = `--- ZIP ARCHIVE: ${file.name} ---\n`;
  
  // Limit processing to prevent browser crash on huge zips
  const MAX_FILES = 20;
  let fileCount = 0;

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    const entry = zipEntry as any;
    if (entry.dir) continue;
    if (fileCount >= MAX_FILES) {
      fullText += `\n[...Truncated: Too many files in ZIP...]\n`;
      break;
    }
    
    // Skip binary files usually not useful for LLM context (exe, dll, images inside zip)
    if (relativePath.match(/\.(exe|dll|png|jpg|jpeg|gif|webp|mp4|mp3)$/i)) continue;

    try {
      const content = await entry.async('string');
      fullText += `\n--- FILE: ${relativePath} ---\n${content}\n`;
      fileCount++;
    } catch (e) {
      fullText += `\n--- FILE: ${relativePath} (Unreadable) ---\n`;
    }
  }
  return fullText;
};
