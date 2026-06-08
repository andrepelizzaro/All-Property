import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vsryecclsiglogyltyrl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnllY2Nsc2lnbG9neWx0eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQ3MjksImV4cCI6MjA5Mzk0MDcyOX0.R_yzGQVg2KjUkCHdY3Uup9pf2awQxZ39z2laa-ygArE'
);

const { data, error } = await supabase
  .from('leads')
  .select('id, name, phone, source, property, notes, created_at')
  .order('created_at', { ascending: false })
  .limit(20);

if (error) { console.error('Erro:', error); process.exit(1); }

console.log(`\n=== Últimas ${data.length} leads no CRM ===\n`);
data.forEach((l, i) => {
  console.log(`[${i}] ${l.name}`);
  console.log(`    source:   ${l.source}`);
  console.log(`    property: ${l.property ?? '(vazio)'}`);
  console.log(`    created:  ${l.created_at}`);
  if (l.name?.startsWith('ERROR')) {
    console.log(`    ⚠️ NOTES: ${l.notes}`);
  }
  console.log('');
});
