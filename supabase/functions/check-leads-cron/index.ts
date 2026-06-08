import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async () => {
  try {
    // Calcula o timestamp de 3 minutos atrás
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    console.log(`🔍 Procurando leads pendentes criados antes de: ${threeMinutesAgo}`);

    // Busca leads do Meta que continuam na etapa 'col-1' (Novo Lead) e não foram notificados
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('id, name, phone, property, notes, meta_leadgen_id')
      .eq('source', 'Meta Ads')
      .eq('stage_id', 'col-1')
      .eq('neo_notified', false)
      .lt('created_at', threeMinutesAgo);

    if (fetchError) {
      console.error('❌ Erro ao buscar leads:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    console.log(`📊 Encontrados ${leads?.length || 0} leads pendentes.`);

    const neoWebhook = Deno.env.get('NEO_WEBHOOK_URL');
    if (!neoWebhook) {
      console.warn('⚠️ NEO_WEBHOOK_URL não configurado nas Secrets do Supabase.');
      return new Response(JSON.stringify({ message: 'NEO_WEBHOOK_URL not configured' }), { status: 200 });
    }

    let notifiedCount = 0;

    for (const lead of (leads || [])) {
      try {
        console.log(`✉️ Enviando lead "${lead.name}" para o Neo...`);
        const res = await fetch(neoWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lead.name,
            phone: lead.phone,
            campaign_name: lead.property || 'Nenhuma',
            notes: lead.notes,
            meta_leadgen_id: lead.meta_leadgen_id
          })
        });

        if (res.ok) {
          // Marca no banco que o lead já foi notificado para não enviar duplicado
          const { error: updateError } = await supabase
            .from('leads')
            .update({ neo_notified: true })
            .eq('id', lead.id);

          if (updateError) {
            console.error(`❌ Erro ao marcar lead "${lead.name}" como notificado:`, updateError);
          } else {
            console.log(`✅ Lead "${lead.name}" notificado e marcado com sucesso.`);
            notifiedCount++;
          }
        } else {
          console.error(`❌ Falha no webhook do Neo para "${lead.name}": Status ${res.status}`);
        }
      } catch (err: any) {
        console.error(`❌ Exceção ao notificar lead "${lead.name}":`, err.message);
      }
    }

    return new Response(JSON.stringify({ success: true, notifiedCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('❌ Exceção geral na Edge Function:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
