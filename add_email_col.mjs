// Tenta adicionar a coluna email via Supabase Management API
// Usa o access token do supabase CLI se disponível
import { execSync } from 'child_process';

const PROJECT_REF = 'vsryecclsiglogyltyrl';
const SQL = "ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';";

async function addColumnViaManagementAPI(token) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: SQL }),
  });

  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
  return res.ok;
}

async function main() {
  // Tenta obter o token do supabase CLI
  let token = null;
  try {
    // Tenta ler o token do arquivo de config do supabase CLI
    const os = process.platform;
    let configPath;
    if (os === 'win32') {
      configPath = `${process.env.APPDATA}\\supabase\\access-token`;
    } else {
      configPath = `${process.env.HOME}/.supabase/access-token`;
    }
    
    const { readFileSync } = await import('fs');
    try {
      token = readFileSync(configPath, 'utf-8').trim();
      console.log('✅ Token Supabase CLI encontrado!');
    } catch {
      console.log('⚠️ Arquivo de token não encontrado em:', configPath);
    }
  } catch (e) {
    console.log('Erro ao ler token:', e.message);
  }

  if (!token) {
    console.log('\n📋 INSTRUÇÕES PARA ADICIONAR A COLUNA EMAIL:');
    console.log('');
    console.log('Acesse o link abaixo e execute o SQL:');
    console.log(`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`);
    console.log('');
    console.log('SQL a executar:');
    console.log(SQL);
    console.log('');
    console.log('OU execute via CLI após login:');
    console.log('npx.cmd supabase login');
    console.log(`npx.cmd supabase db query --linked "${SQL}"`);
    return;
  }

  console.log('Tentando adicionar coluna via Management API...');
  const ok = await addColumnViaManagementAPI(token);
  if (ok) {
    console.log('✅ Coluna email adicionada com sucesso!');
  } else {
    console.log('❌ Falhou. Veja as instruções acima.');
  }
}

main().catch(console.error);
