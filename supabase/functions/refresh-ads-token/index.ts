// ============================================================
// Supabase Edge Function — Renovação Automática do Token Meta Ads
// Chamada pelo pg_cron a cada 30 dias para renovar o token de
// acesso à API de Anúncios do Meta (ads_read) sem expirar nunca.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APP_ID     = '727538613777787';
const APP_SECRET = '214446e1604b87776f49d55d7d9a7ec6';
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    // 1. Lê o token atual salvo no banco
    const { data: setting, error: readErr } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'META_ADS_ACCESS_TOKEN')
      .maybeSingle();

    if (readErr || !setting?.value) {
      console.error('❌ Não encontrou META_ADS_ACCESS_TOKEN no banco:', readErr);
      return new Response(JSON.stringify({ error: 'Token não encontrado no banco' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const currentToken = setting.value;
    console.log('🔄 Renovando token Meta Ads...');

    // 2. Troca pelo novo token de longa duração (~60 dias, renovado a cada 30)
    const exchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${currentToken}`;
    const res  = await fetch(exchangeUrl);
    const data = await res.json();

    if (data.error || !data.access_token) {
      console.error('❌ Erro ao renovar token:', data.error);
      return new Response(JSON.stringify({ error: data.error }), { status: 500 });
    }

    // 3. Salva o novo token no banco
    const { error: writeErr } = await supabase
      .from('app_settings')
      .upsert({ key: 'META_ADS_ACCESS_TOKEN', value: data.access_token, updated_at: new Date().toISOString() });

    if (writeErr) {
      console.error('❌ Erro ao salvar novo token:', writeErr);
      return new Response(JSON.stringify({ error: writeErr }), { status: 500 });
    }

    const expiresInDays = data.expires_in ? Math.floor(data.expires_in / 86400) : 60;
    console.log(`✅ Token renovado com sucesso! Válido por ~${expiresInDays} dias.`);

    return new Response(JSON.stringify({
      success: true,
      message: `Token renovado. Válido por ~${expiresInDays} dias.`,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('❌ Exceção:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
