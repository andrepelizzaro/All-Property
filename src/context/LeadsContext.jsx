import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const columnOrder = ['col-1', 'col-2', 'col-3', 'col-4', 'col-6', 'col-7', 'col-8'];

const LeadsContext = createContext(null);

export const useLeads = () => {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider');
  return ctx;
};

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState({});
  const [columns, setColumns] = useState({
    'col-1': { id: 'col-1', title: 'Novo Lead', leadIds: [] },
    'col-2': { id: 'col-2', title: 'Primeiro Contato', leadIds: [] },
    'col-3': { id: 'col-3', title: 'Interesse', leadIds: [] },
    'col-4': { id: 'col-4', title: 'Visita Agendada', leadIds: [] },
    'col-6': { id: 'col-6', title: 'Negociação', leadIds: [] },
    'col-7': { id: 'col-7', title: 'Fechado', leadIds: [] },
    'col-8': { id: 'col-8', title: 'Perdido', leadIds: [] },
  });
  const [loading, setLoading] = useState(true);

  // ── Sync with Supabase ──
  const syncFromSupabase = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar leads:', error);
      return;
    }

    const newLeads = {};
    const newColumns = {
      'col-1': { id: 'col-1', title: 'Novo Lead', leadIds: [] },
      'col-2': { id: 'col-2', title: 'Primeiro Contato', leadIds: [] },
      'col-3': { id: 'col-3', title: 'Interesse', leadIds: [] },
      'col-4': { id: 'col-4', title: 'Visita Agendada', leadIds: [] },
      'col-6': { id: 'col-6', title: 'Negociação', leadIds: [] },
      'col-7': { id: 'col-7', title: 'Fechado', leadIds: [] },
      'col-8': { id: 'col-8', title: 'Perdido', leadIds: [] },
    };

    data.forEach(lead => {
      const stage = lead.stage_id || 'col-1';
      newLeads[lead.id] = {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        property: lead.property,
        source: lead.source,
        broker: lead.broker,
        priority: lead.priority,
        notes: lead.notes,
        inFollowUp: lead.in_follow_up,
        scheduledDate: lead.scheduled_date,
        scheduledTime: lead.scheduled_time,
        scheduledAction: lead.scheduled_action,
        date: new Date(lead.created_at).toLocaleDateString('pt-BR'),
      };
      if (newColumns[stage]) {
        newColumns[stage].leadIds.push(lead.id);
      }
    });

    setLeads(newLeads);
    setColumns(newColumns);
    setLoading(false);
  };

  useEffect(() => {
    syncFromSupabase();

    // Sincronização em Tempo Real
    const channel = supabase
      .channel('public:leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        syncFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Add lead ──
  const addLead = async (leadData, targetColumn = 'col-1') => {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        name: leadData.name,
        phone: leadData.phone,
        property: leadData.property,
        source: leadData.source || 'WhatsApp',
        broker: leadData.broker || 'Admin',
        priority: leadData.priority || 'Média',
        notes: leadData.notes || '',
        stage_id: targetColumn,
        in_follow_up: leadData.inFollowUp || false,
        scheduled_date: leadData.scheduledDate,
        scheduled_time: leadData.scheduledTime,
        scheduled_action: leadData.scheduledAction
      }])
      .select();

    if (error) {
      console.error('Erro ao adicionar lead:', error);
      return null;
    }
    return data[0].id;
  };

  // ── Update lead ──
  const updateLead = async (id, updates, targetColumn = null) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.property !== undefined) payload.property = updates.property;
    if (updates.source !== undefined) payload.source = updates.source;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.inFollowUp !== undefined) payload.in_follow_up = updates.inFollowUp;
    if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
    if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
    if (updates.scheduledAction !== undefined) payload.scheduled_action = updates.scheduledAction;
    if (targetColumn) payload.stage_id = targetColumn;

    const { error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id);

    if (error) console.error('Erro ao atualizar lead:', error);
  };

  // ── Delete lead ──
  const deleteLead = async (id) => {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) console.error('Erro ao excluir lead:', error);
  };

  // ── Follow-up helpers ──
  const sendToFollowUp = (id) => updateLead(id, { inFollowUp: true });
  const removeFromFollowUp = (id) => updateLead(id, { inFollowUp: false });

  // ── Kanban drag ──
  const moveLeadInKanban = async (source, destination, draggableId) => {
    // Para simplificar no Supabase, apenas atualizamos a stage_id
    if (source.droppableId !== destination.droppableId) {
      await updateLead(draggableId, {}, destination.droppableId);
    }
    // A reordenação interna não é persistida por padrão no DB simples sem campo 'order'
    // Mas o syncFromSupabase() vai rodar e re-renderizar
  };

  const followUpLeads = Object.values(leads).filter(l => l.inFollowUp);
  const allLeads = Object.values(leads);

  return (
    <LeadsContext.Provider value={{
      leads,
      columns,
      columnOrder,
      allLeads,
      followUpLeads,
      loading,
      addLead,
      updateLead,
      deleteLead,
      sendToFollowUp,
      removeFromFollowUp,
      moveLeadInKanban,
    }}>
      {children}
    </LeadsContext.Provider>
  );
};

export default LeadsContext;
