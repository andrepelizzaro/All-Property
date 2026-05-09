import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsryecclsiglogyltyrl.supabase.co';
const supabaseAnonKey = 'sb_publishable_pTMwPkNq9NmFxV3V4rWpDg_A0Vf2nhb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
