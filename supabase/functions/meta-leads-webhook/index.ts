// ============================================================
// Supabase Edge Function — Meta Lead Ads Webhook
// Recebe leads do Meta e insere direto no CRM (stage: Novo Lead)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const VERIFY_TOKEN      = Deno.env.get('META_VERIFY_TOKEN') ?? 'allproperty_verify_2026';
const PAGE_ACCESS_TOKEN = Deno.env.get('META_PAGE_ACCESS_TOKEN') ?? '';
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Lê o token de anúncios do banco (renovado automaticamente a cada 30 dias) ──
async function getAdsToken(): Promise<string> {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'META_ADS_ACCESS_TOKEN')
      .maybeSingle();
    if (data?.value) return data.value;
  } catch (_) { /* ignora erro, usa fallback */ }
  // Fallback: variável de ambiente (usada na primeira vez ou se o banco falhar)
  return Deno.env.get('META_ADS_ACCESS_TOKEN') || PAGE_ACCESS_TOKEN;
}

// ── Busca os dados do lead na API do Meta ──
async function getLeadData(leadgenId: string) {
  const url = `https://graph.facebook.com/v19.0/${leadgenId}?fields=field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id&access_token=${PAGE_ACCESS_TOKEN}`;
  const res = await fetch(url);
  return await res.json();
}

// ── Extrai campo pelo nome do array field_data ──
function extractField(fieldData: { name: string; values: string[] }[], fieldName: string): string {
  const field = fieldData.find(
    (f) => f.name === fieldName || f.name.includes(fieldName)
  );
  return field?.values?.[0] ?? '';
}

// ── Busca o nome do formulário como alternativa na API do Meta ──
async function getFormName(formId: string): Promise<string | null> {
  if (!formId) return null;
  try {
    // Page Access Token consegue ler formulários da própria página
    const url = `https://graph.facebook.com/v19.0/${formId}?fields=name&access_token=${PAGE_ACCESS_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.warn('⚠️ Erro ao buscar dados do formulário:', data.error);
      return null;
    }
    return data.name || null;
  } catch (err) {
    console.error('⚠️ Exceção ao buscar nome do formulário:', err);
    return null;
  }
}

// ── Executa diagnóstico com a API do Meta e auto-inscreve se necessário ──
async function runDiagnostics() {
  const results: any = {
    token_configured: !!PAGE_ACCESS_TOKEN,
    supabase_configured: !!SUPABASE_URL && !!SUPABASE_SERVICE_KEY,
  };

  if (!PAGE_ACCESS_TOKEN) {
    return { error: 'META_PAGE_ACCESS_TOKEN não configurado nos Secrets do Supabase' };
  }

  try {
    // 1. Testa validade do token e busca informações da página/perfil
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${PAGE_ACCESS_TOKEN}`);
    const pageData = await pageRes.json();
    results.page_info = pageData;

    if (pageData.error) {
      return { error: 'Erro de Token (Token expirado ou inválido)', detail: pageData.error };
    }

    // 1.b. Busca contas/páginas gerenciadas por este token
    const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${PAGE_ACCESS_TOKEN}`);
    const accountsData = await accountsRes.json();
    results.accessible_pages = accountsData;

    // 2. Verifica aplicativos inscritos na página
    const subsRes = await fetch(`https://graph.facebook.com/v19.0/me/subscribed_apps?access_token=${PAGE_ACCESS_TOKEN}`);
    const subsData = await subsRes.json();
    results.subscriptions = subsData;

    // 3. Tenta inscrever automaticamente a página no app com o campo 'leadgen' se necessário
    const subsList = subsData.data ?? [];
    const appSubscribed = subsList.find((app: any) => app.id === '727538613777787');
    const isLeadgenSubscribed = appSubscribed?.subscribed_fields?.includes('leadgen');

    if (!appSubscribed || !isLeadgenSubscribed) {
      results.auto_subscribe_attempted = true;
      const subPost = await fetch(
        `https://graph.facebook.com/v19.0/me/subscribed_apps?subscribed_fields=leadgen&access_token=${PAGE_ACCESS_TOKEN}`,
        { method: 'POST' }
      );
      results.auto_subscribe_response = await subPost.json();
    } else {
      results.already_subscribed = true;
    }

    return results;
  } catch (e: any) {
    return { error: 'Erro de rede ou exceção durante diagnóstico', detail: e.message };
  }
}

// ── Handler principal ──
Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ── Verificação do webhook (GET) — exigido pelo Meta ──
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'diagnostics') {
      const diagData = await runDiagnostics();
      return new Response(JSON.stringify(diagData, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    }

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado pelo Meta');
      return new Response(challenge, { status: 200 });
    }

    return new Response('Token inválido', { status: 403 });
  }

  // ── Recebe novo lead (POST) ──
  if (req.method === 'POST') {
    let rawBody = '';
    try {
      rawBody = await req.text();
      const body = JSON.parse(rawBody);
      console.log('📥 Webhook recebido:', JSON.stringify(body));

      const entries = body?.entry ?? [];

      for (const entry of entries) {
        const changes = entry?.changes ?? [];

        for (const change of changes) {
          if (change.field !== 'leadgen') continue;

          const leadgenId = change.value?.leadgen_id;
          if (!leadgenId) continue;

          console.log('🔍 Buscando lead ID:', leadgenId);

          // Busca dados reais do lead na API do Meta
          const leadData = await getLeadData(leadgenId);

          if (leadData.error) {
            console.error('❌ Erro ao buscar lead:', leadData.error);
            await supabase.from('leads').insert([{
              name: 'ERROR: Falha getLeadData',
              phone: '0000000000',
              source: 'Meta Ads',
              stage_id: 'col-1',
              priority: 'Média',
              notes: `LeadgenID: ${leadgenId}\nErro: ${JSON.stringify(leadData.error)}`,
              in_follow_up: false,
            }]);
            continue;
          }

          const fieldData = leadData.field_data ?? [];

          // Extrai os campos comuns do formulário Meta
          const name  = extractField(fieldData, 'full_name')
                     || extractField(fieldData, 'first_name')
                     || 'Lead Meta Ads';
          const phone = extractField(fieldData, 'phone_number')
                     || extractField(fieldData, 'phone');
          const email = extractField(fieldData, 'email');

          // Tenta obter o nome da campanha, anúncio ou do formulário
          const campaignName = leadData.campaign_name;
          const adName = leadData.ad_name;
          const formId = leadData.form_id;
          let propertyName = '';

          if (campaignName) {
            propertyName = campaignName;
          } else if (adName) {
            propertyName = adName;
          } else if (formId) {
            console.log('📄 Buscando informações do formulário ID:', formId);
            const formInfo = await getFormName(formId);
            if (formInfo) {
              propertyName = `Formulário: ${formInfo}`;
            }
          }

          console.log(`🏠 Imóvel/Campanha atribuído à lead: "${propertyName || 'Nenhum'}"`);

          // Monta as notas com email e rastreabilidade detalhada do anúncio
          const notesLines: string[] = [];
          if (email) notesLines.push(`Email: ${email}`);

          notesLines.push(`[Origem Meta Ads]`);
          if (leadData.campaign_name) {
            notesLines.push(`Campanha: ${leadData.campaign_name} (${leadData.campaign_id || 'n/a'})`);
          }
          if (leadData.adset_name) {
            notesLines.push(`Conjunto de Anúncios: ${leadData.adset_name} (${leadData.adset_id || 'n/a'})`);
          }
          if (leadData.ad_name) {
            notesLines.push(`Anúncio: ${leadData.ad_name} (${leadData.ad_id || 'n/a'})`);
          }
          
          if (formId) {
            const formInfo = await getFormName(formId);
            if (formInfo) {
              notesLines.push(`Formulário: ${formInfo} (${formId})`);
            } else {
              notesLines.push(`Formulário ID: ${formId}`);
            }
          }
          
          const notes = notesLines.join('\n');

          // Evita duplicatas pelo leadgen_id
          const { data: existing } = await supabase
             .from('leads')
             .select('id')
             .eq('meta_leadgen_id', leadgenId)
             .maybeSingle();

          if (existing) {
            console.log('⚠️ Lead já existe, ignorando:', leadgenId);
            continue;
          }

          // Insere no CRM em "Novo Lead" (col-1)
          const { error } = await supabase.from('leads').insert([{
            name:            name,
            phone:           phone,
            property:        propertyName || null,
            source:          'Meta Ads',
            stage_id:        'col-1',
            priority:        'Média',
            notes:           notes,
            meta_leadgen_id: leadgenId,
            in_follow_up:    false,
          }]);

          if (error) {
            console.error('❌ Erro ao inserir lead no Supabase:', error);
            await supabase.from('leads').insert([{
              name: 'ERROR: Falha insert CRM',
              phone: '0000000000',
              source: 'Meta Ads',
              stage_id: 'col-1',
              priority: 'Média',
              notes: `Erro: ${JSON.stringify(error)}`,
              in_follow_up: false,
            }]);
          } else {
            console.log(`✅ Lead "${name}" (${phone}) inserido em Novo Lead!`);
          }
        }
      }

      return new Response('OK', { status: 200 });
    } catch (err: any) {
      console.error('❌ Erro no processamento:', err);
      // Insere erro detalhado no banco
      await supabase.from('leads').insert([{
        name: 'ERROR: Exceção no Webhook',
        phone: '0000000000',
        source: 'Meta Ads',
        stage_id: 'col-1',
        priority: 'Média',
        notes: `Mensagem: ${err?.message || err}\nCorpo bruto: ${rawBody}`,
        in_follow_up: false,
      }]);
      return new Response('Erro interno: ' + err.message, { status: 500 });
    }
  }

  return new Response('Método não suportado', { status: 405 });
});
