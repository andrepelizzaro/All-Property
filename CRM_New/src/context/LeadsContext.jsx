import { createContext, useContext, useState } from 'react';

const initialLeads = {
  'lead-1': { 
    id: 'lead-1', name: 'Carlos Andrade', phone: '(11) 98765-4321', 
    property: 'Apt 302 Lumiere', source: 'WhatsApp', 
    broker: 'Admin', priority: 'Alta', date: 'Hoje', notes: '',
    inFollowUp: true,
  },
  'lead-2': { 
    id: 'lead-2', name: 'Ana Beatriz', phone: '(11) 91234-5678', 
    property: 'Casa Alphaville', source: 'Meta Ads', 
    broker: 'Admin', priority: 'Média', date: 'Ontem', notes: '',
    inFollowUp: false,
  },
  'lead-3': { 
    id: 'lead-3', name: 'Marcos Paulo', phone: '(21) 99888-7777', 
    property: 'Cobertura Jardins', source: 'Site', 
    broker: 'Admin', priority: 'Baixa', date: '2 dias atrás', notes: '',
    inFollowUp: true,
  },
  'lead-4': { 
    id: 'lead-4', name: 'Juliana Costa', phone: '(31) 97777-6666', 
    property: 'Sala Comercial Centro', source: 'Indicação', 
    broker: 'Admin', priority: 'Alta', date: 'Hoje', notes: '',
    inFollowUp: false,
  },
};

const initialColumns = {
  'col-1': { id: 'col-1', title: 'Novo Lead', leadIds: ['lead-1', 'lead-2'] },
  'col-2': { id: 'col-2', title: 'Primeiro Contato', leadIds: ['lead-3'] },
  'col-3': { id: 'col-3', title: 'Interesse', leadIds: [] },
  'col-4': { id: 'col-4', title: 'Visita Agendada', leadIds: ['lead-4'] },
  'col-5': { id: 'col-5', title: 'Proposta', leadIds: [] },
  'col-6': { id: 'col-6', title: 'Negociação', leadIds: [] },
  'col-7': { id: 'col-7', title: 'Fechado', leadIds: [] },
  'col-8': { id: 'col-8', title: 'Perdido', leadIds: [] },
};

const columnOrder = ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6', 'col-7', 'col-8'];

const LeadsContext = createContext(null);

export const useLeads = () => {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error('useLeads must be used within LeadsProvider');
  return ctx;
};

export const LeadsProvider = ({ children }) => {
  const [leads, setLeads] = useState(initialLeads);
  const [columns, setColumns] = useState(initialColumns);

  // ── Add lead ──
  const addLead = (leadData, targetColumn = 'col-1') => {
    const id = `lead-${Date.now()}`;
    const newLead = { id, ...leadData, date: 'Hoje' };
    setLeads(prev => ({ ...prev, [id]: newLead }));
    setColumns(prev => ({
      ...prev,
      [targetColumn]: {
        ...prev[targetColumn],
        leadIds: [id, ...prev[targetColumn].leadIds],
      }
    }));
    return id;
  };

  // ── Update lead ──
  const updateLead = (id, updates) => {
    setLeads(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  };

  // ── Delete lead ──
  const deleteLead = (id) => {
    setLeads(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setColumns(prev => {
      const newCols = {};
      for (const colId of columnOrder) {
        newCols[colId] = {
          ...prev[colId],
          leadIds: prev[colId].leadIds.filter(lid => lid !== id),
        };
      }
      return newCols;
    });
  };

  // ── Toggle follow-up ──
  const toggleFollowUp = (id) => {
    setLeads(prev => ({
      ...prev,
      [id]: { ...prev[id], inFollowUp: !prev[id].inFollowUp }
    }));
  };

  const sendToFollowUp = (id) => {
    setLeads(prev => ({ ...prev, [id]: { ...prev[id], inFollowUp: true } }));
  };

  const removeFromFollowUp = (id) => {
    setLeads(prev => ({ ...prev, [id]: { ...prev[id], inFollowUp: false } }));
  };

  // ── Kanban drag ──
  const moveLeadInKanban = (source, destination, draggableId) => {
    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];

    if (start === finish) {
      const newLeadIds = Array.from(start.leadIds);
      newLeadIds.splice(source.index, 1);
      newLeadIds.splice(destination.index, 0, draggableId);
      setColumns(prev => ({
        ...prev,
        [start.id]: { ...start, leadIds: newLeadIds },
      }));
    } else {
      const startIds = Array.from(start.leadIds);
      startIds.splice(source.index, 1);
      const finishIds = Array.from(finish.leadIds);
      finishIds.splice(destination.index, 0, draggableId);
      setColumns(prev => ({
        ...prev,
        [start.id]: { ...start, leadIds: startIds },
        [finish.id]: { ...finish, leadIds: finishIds },
      }));
    }
  };

  // Get follow-up leads
  const followUpLeads = Object.values(leads).filter(l => l.inFollowUp);

  // Get all leads as array
  const allLeads = Object.values(leads);

  return (
    <LeadsContext.Provider value={{
      leads,
      columns,
      columnOrder,
      allLeads,
      followUpLeads,
      addLead,
      updateLead,
      deleteLead,
      toggleFollowUp,
      sendToFollowUp,
      removeFromFollowUp,
      moveLeadInKanban,
    }}>
      {children}
    </LeadsContext.Provider>
  );
};

export default LeadsContext;
