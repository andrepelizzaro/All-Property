import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const files = [
  'lista_araujo.xlsx.xlsx',
  'lista_gustavo.xlsx.xlsx',
  'lista_jonata.xlsx.xlsx',
];

for (const fileName of files) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Não encontrado: ${fileName}`);
    continue;
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  console.log(`\n📂 ${fileName}`);
  console.log(`   Sheet: ${sheetName} | Registros: ${data.length}`);
  console.log(`   Colunas: ${headers.join(', ')}`);
  console.log(`   Primeiro registro:`, data[0]);
  console.log(`   Último registro:`, data[data.length - 1]);
}
