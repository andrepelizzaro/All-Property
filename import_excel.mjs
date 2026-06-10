// ============================================================
// Script de Importação - 3 Listas de Leads por Corretor
// Fila de Prospecção - All Property CRM
// ============================================================
import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://vsryecclsiglogyltyrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnllY2Nsc2lnbG9neWx0eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQ3MjksImV4cCI6MjA5Mzk0MDcyOX0.R_yzGQVg2KjUkCHdY3Uup9pf2awQxZ39z2laa-ygArE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extrai o nome do corretor pelo nome do arquivo
function getCorretor(fileName) {
  const lower = fileName.toLowerCase();
  if (lower.includes('araujo')) return 'Araujo';
  if (lower.includes('gustavo')) return 'Gustavo';
  if (lower.includes('jonata') || lower.includes('jônata')) return 'Jonata';
  return null;
}

// Mapeia a classificação para prioridade do CRM
function mapPriority(classificacao) {
  const val = String(classificacao || '').toLowerCase();
  if (val.includes('alto')) return 'Alta';
  if (val.includes('médio') || val.includes('medio')) return 'Média';
  if (val.includes('sem contato')) return 'Baixa';
  return 'Média';
}

// Limpa telefone mantendo o + inicial
function cleanPhone(phone) {
  const str = String(phone || '').trim();
  return str.replace(/[^\d+]/g, '');
}

async function importFile(fileName, corretor) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`  ❌ Arquivo não encontrado: ${fileName}`);
    return { inserted: 0, errors: 0 };
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  // Filtra e mapeia para o formato do Supabase
  const leads = rawData
    .filter(row => String(row['Nome'] || '').trim().length > 0)
    .map(row => ({
      name: String(row['Nome'] || '').trim(),
      phone: cleanPhone(row['Contato']),
      email: String(row['e-mail'] || row['Email'] || row['E-mail'] || '')
        .trim()
        .toLowerCase()
        .replace(/^-$/, ''),
      priority: mapPriority(row['Classificação'] || row['Classificacao']),
      source: 'Lista Fria',
      broker: 'Admin',
      stage_id: 'prospect',
      notes: '',
      in_follow_up: false,
      assigned_to: corretor,
    }));

  console.log(`  📊 ${leads.length} registros válidos para ${corretor}`);

  // Importa em lotes de 50
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  let totalErrors = 0;

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(leads.length / BATCH_SIZE);

    process.stdout.write(`    Lote ${batchNum}/${totalBatches}... `);

    const { data, error } = await supabase
      .from('leads')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`❌ ERRO: ${error.message}`);
      totalErrors += batch.length;
    } else {
      console.log(`✅ ${data.length} inseridos`);
      totalInserted += data.length;
    }

    await new Promise(r => setTimeout(r, 200));
  }

  return { inserted: totalInserted, errors: totalErrors };
}

async function main() {
  console.log('🚀 IMPORTAÇÃO DE LEADS - FILA DE PROSPECÇÃO');
  console.log('='.repeat(50));

  // Verifica se a coluna email existe
  const { error: colCheck } = await supabase
    .from('leads')
    .select('email')
    .limit(1);

  if (colCheck && colCheck.code === 'PGRST204') {
    console.error('\n❌ ERRO: A coluna "email" ainda não existe na tabela leads!');
    console.error('\nExecute este SQL no Supabase antes de continuar:');
    console.error('https://supabase.com/dashboard/project/vsryecclsiglogyltyrl/sql/new');
    console.error('\nALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT DEFAULT \'\';');
    console.error('\nDepois execute este script novamente.\n');
    process.exit(1);
  }

  // Mapeamento: arquivo → corretor
  const files = [
    { fileName: 'lista_araujo.xlsx.xlsx', corretor: 'Araujo' },
    { fileName: 'lista_gustavo.xlsx.xlsx', corretor: 'Gustavo' },
    { fileName: 'lista_jonata.xlsx.xlsx', corretor: 'Jonata' },
  ];

  let grandTotal = 0;
  let grandErrors = 0;

  for (const { fileName, corretor } of files) {
    console.log(`\n📂 Importando: ${fileName} → Corretor: ${corretor}`);
    const { inserted, errors } = await importFile(fileName, corretor);
    grandTotal += inserted;
    grandErrors += errors;
    console.log(`  ✅ Subtotal ${corretor}: ${inserted} leads importados`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log(`   ✅ Total importado: ${grandTotal} leads`);
  if (grandErrors > 0) {
    console.log(`   ❌ Com erro: ${grandErrors}`);
  }
  console.log('='.repeat(50));
  console.log('\nAcesse o CRM em https://all-property.vercel.app/prospects');
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
