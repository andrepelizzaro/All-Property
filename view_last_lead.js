import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsryecclsiglogyltyrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnllY2Nsc2lnbG9neWx0eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQ3MjksImV4cCI6MjA5Mzk0MDcyOX0.R_yzGQVg2KjUkCHdY3Uup9pf2awQxZ39z2laa-ygArE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function viewLastLead() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }

  data.forEach((lead, i) => {
    console.log(`\n--- [${i}] Lead: ${lead.name} ---`);
    console.log(`ID: ${lead.id}`);
    console.log(`Source: ${lead.source}`);
    console.log(`Created at: ${lead.created_at}`);
    console.log(`Notes:\n${lead.notes}`);
  });
}

viewLastLead();
