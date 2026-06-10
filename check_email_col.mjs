// Script para adicionar coluna email na tabela leads via Supabase REST API
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsryecclsiglogyltyrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnllY2Nsc2lnbG9neWx0eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQ3MjksImV4cCI6MjA5Mzk0MDcyOX0.R_yzGQVg2KjUkCHdY3Uup9pf2awQxZ39z2laa-ygArE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEmailColumn() {
  // Verifica se já existe coluna email tentando selecionar ela
  const { data, error } = await supabase
    .from('leads')
    .select('email')
    .limit(1);
  
  if (error) {
    console.log('Coluna email NÃO existe ainda:', error.message);
    return false;
  } else {
    console.log('Coluna email JÁ EXISTE! Valor:', data[0]?.email);
    return true;
  }
}

checkEmailColumn();
