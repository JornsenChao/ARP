import { csvParse } from 'd3-dsv';
import XLSX from 'xlsx';
import fs from 'fs';

export function parseTable(filePath) {
  const ext = filePath.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    // 读文本 -> 用 d3-dsv 的 csvParse
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = csvParse(raw);
    // data 就是 [ {col1: val1, col2: val2, ...}, {...} ]
    return data;
  } else if (ext === 'xlsx' || ext === 'xls') {
    // 读 XLSX -> 用 XLSX 库
    const workbook = XLSX.readFile(filePath);
    // 假设只读第一个sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // 直接转 json
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return data;
  } else {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
}
