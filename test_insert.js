import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsryecclsiglogyltyrl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzcnllY2Nsc2lnbG9neWx0eXJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNjQ3MjksImV4cCI6MjA5Mzk0MDcyOX0.R_yzGQVg2KjUkCHdY3Uup9pf2awQxZ39z2laa-ygArE';

// We use the anon key or we can just run a query
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log('Testing insert into leads table...');
  const { data, error } = await supabase.from('leads').insert([{
    name: 'DEBUG: Test Insert',
    phone: '0000000000',
    source: 'Meta Ads',
    stage_id: 'col-1',
    priority: 'Média',
    notes: 'Testing constraints',
    in_follow_up: false,
  }]).select();

  if (error) {
    console.error('❌ Insert failed:', error);
  } else {
    console.log('✅ Insert succeeded!', data);
  }
}

testInsert();
