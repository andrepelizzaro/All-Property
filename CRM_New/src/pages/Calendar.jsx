import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, X, Trash2, MessageSquare, Phone, Home, ArrowRightLeft } from 'lucide-react';
import { useLeads } from '../context/LeadsContext';
import './Calendar.css';

const today = new Date();

const initialEvents = [
  { id: 'lead-1', day: 8, title: 'Visita - Apt 302 Lumiere', time: '10:00', client: 'Carlos Andrade', type: 'visita' },
  { id: 'lead-2', day: 12, title: 'Visita - Casa Alphaville', time: '09:00', client: 'Ana Beatriz', type: 'visita' },
  { id: 'lead-4', day: 15, title: 'Assinatura Contrato', time: '16:00', client: 'Juliana Costa', type: 'contrato' },
  { id: 'lead-3', day: 22, title: 'Follow-up Marcos', time: '11:00', client: 'Marcos Paulo', type: 'followup' },
];

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const { leads, columns, columnOrder, addLead, updateLead, deleteLead, sendToFollowUp, removeFromFollowUp, moveLeadInKanban } = useLeads();
  const [events, setEvents] = useState(initialEvents);

  // Merge scheduled leads into events
  useEffect(() => {
    const scheduled = Object.values(leads)
      .filter(l => l.scheduledDate)
      .map(l => {
        const [year, month, day] = l.scheduledDate.split('-');
        return {
          id: l.id,
          year: parseInt(year, 10),
          month: parseInt(month, 10) - 1, // JS month is 0-indexed
          day: parseInt(day, 10),
          title: `Agendado - ${l.scheduledAction || 'Ação'} (${l.name})`,
          time: l.scheduledTime || '09:00',
          client: l.name,
          type: 'visita',
        };
      });

    setEvents([...initialEvents, ...scheduled]);
  }, [leads]);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showModal, setShowModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [leadEditData, setLeadEditData] = useState({ notes: '', action: '', date: '', time: '' });
  const [formData, setFormData] = useState({ title: '', time: '', client: '', type: 'visita' });

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleEventClick = (ev) => {
    // If it's a lead-based event
    if (leads[ev.id]) {
      const lead = leads[ev.id];
      setSelectedLeadId(ev.id);
      setLeadEditData({
        notes: lead.notes || '',
        action: lead.scheduledAction || '',
        date: lead.scheduledDate || '',
        time: lead.scheduledTime || ''
      });
      setShowLeadModal(true);
    } else {
      // If it's a manual/initial event
      setFormData({
        id: ev.id,
        title: ev.title,
        time: ev.time,
        client: ev.client,
        type: ev.type,
        day: ev.day
      });
      setShowModal(true);
    }
  };

  const handleSaveLeadUpdate = () => {
    if (!selectedLeadId) return;
    updateLead(selectedLeadId, {
      notes: leadEditData.notes,
      scheduledAction: leadEditData.action,
      scheduledDate: leadEditData.date,
      scheduledTime: leadEditData.time
    });
    setShowLeadModal(false);
  };

  const handleClearSchedule = () => {
    if (!selectedLeadId) return;
    updateLead(selectedLeadId, {
      scheduledDate: '',
      scheduledAction: ''
    });
    setShowLeadModal(false);
  };

  const handleAddNote = (text) => {
    if (!text.trim()) return;
    const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const newNote = `[${timestamp}] ${text}`;
    const currentNotes = leadEditData.notes;
    setLeadEditData({ ...leadEditData, notes: currentNotes ? `${newNote}\n${currentNotes}` : newNote });
  };

  const dayEvents = (day) => events.filter(e => 
    e.day === day && 
    (e.month === undefined || e.month === currentMonth) && 
    (e.year === undefined || e.year === currentYear)
  );
  const selectedEvents = dayEvents(selectedDay);

  const handleAddEvent = () => {
    if (!formData.title.trim()) return;
    
    if (formData.leadId) {
      // If linked to a lead, update the lead's scheduling instead of local events
      updateLead(formData.leadId, {
        scheduledDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
        scheduledTime: formData.time,
        scheduledAction: formData.title.replace('Agendado - ', '').split(' (')[0] || formData.title
      });
    } else {
      if (formData.id) {
        setEvents(events.map(e => e.id === formData.id ? { ...formData } : e));
      } else {
        setEvents([...events, { ...formData, id: Date.now(), day: selectedDay }]);
      }
    }
    
    setFormData({ title: '', time: '', client: '', type: 'visita', leadId: '' });
    setShowModal(false);
  };

  const handleOpenNew = () => {
    setFormData({ title: '', time: '', client: '', type: 'visita' });
    setShowModal(true);
  };

  const eventTypeColor = (type) => {
    const map = {
      visita: 'var(--primary)',
      reuniao: 'var(--accent)',
      contrato: 'var(--success)',
      vistoria: 'var(--warning)',
      followup: 'var(--neon)',
    };
    return map[type] || 'var(--primary)';
  };

  const eventTypeLabel = (type) => {
    const map = {
      visita: 'Visita',
      reuniao: 'Reunião',
      contrato: 'Contrato',
      vistoria: 'Vistoria',
      followup: 'Follow-up',
    };
    return map[type] || type;
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <div className="calendar-page">
      <div className="page-header-row">
        <div>
          <h1>Agenda</h1>
          <p className="text-secondary">Organize suas visitas e compromissos</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={18} /> Novo Evento
        </button>
      </div>

      <div className="calendar-layout">
        {/* Calendar Grid */}
        <div className="calendar-main glass-panel animate-fade-in">
          <div className="calendar-nav">
            <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2>{monthNames[currentMonth]} {currentYear}</h2>
            <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>

          <div className="calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day === null ? 'empty' : ''} ${day === selectedDay ? 'selected' : ''} ${day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear() ? 'today' : ''}`}
                onClick={() => day && setSelectedDay(day)}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {dayEvents(day).length > 0 && (
                      <div className="day-events-dots">
                        {dayEvents(day).slice(0, 3).map(ev => (
                          <span key={ev.id} className="event-dot" style={{ background: eventTypeColor(ev.type) }}></span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Events Sidebar */}
        <div className="events-sidebar glass-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="sidebar-day-title">
            {selectedDay} de {monthNames[currentMonth]}
          </h3>

          <div className="sidebar-content-wrapper">
            <div className="selected-day-section">
              {selectedEvents.length === 0 ? (
                <div className="no-events">
                  <p className="text-secondary">Nenhum evento neste dia</p>
                </div>
              ) : (
                <div className="events-list-sidebar">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="event-item-sidebar clickable" style={{ borderLeftColor: eventTypeColor(ev.type) }} onClick={() => handleEventClick(ev)}>
                      <div className="event-type-badge" style={{ background: eventTypeColor(ev.type) + '22', color: eventTypeColor(ev.type) }}>
                        {eventTypeLabel(ev.type)}
                      </div>
                      <h4>{ev.title}</h4>
                      <div className="event-meta">
                        <span><Clock size={13} /> {ev.time}</span>
                        <span><User size={13} /> {ev.client}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="upcoming-section">
              <h4 className="upcoming-title">Próximos Eventos</h4>
              <div className="upcoming-list">
                {events
                  .filter(e => {
                    const eventDate = new Date(e.year || currentYear, e.month !== undefined ? e.month : currentMonth, e.day);
                    const compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    return eventDate >= compareDate;
                  })
                  .sort((a, b) => {
                    const dateA = new Date(a.year || currentYear, a.month !== undefined ? a.month : currentMonth, a.day);
                    const dateB = new Date(b.year || currentYear, b.month !== undefined ? b.month : currentMonth, b.day);
                    return dateA - dateB;
                  })
                  .map(ev => (
                    <div key={ev.id} className="upcoming-item clickable" onClick={() => handleEventClick(ev)}>
                      <div className="upcoming-date">
                        <span className="upcoming-day">{ev.day}</span>
                        <span className="upcoming-month">{monthNames[ev.month !== undefined ? ev.month : currentMonth].slice(0, 3)}</span>
                      </div>
                      <div className="upcoming-info">
                        <span className="upcoming-title-text">{ev.title}</span>
                        <span className="upcoming-time">{ev.time} • {ev.client}</span>
                      </div>
                    </div>
                  ))
                }
                {events.filter(e => {
                  const eventDate = new Date(e.year || currentYear, e.month !== undefined ? e.month : currentMonth, e.day);
                  const compareDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  return eventDate >= compareDate;
                }).length === 0 && (
                  <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Nenhum evento futuro.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Evento' : 'Novo Evento'} - Dia {selectedDay}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Vincular Cliente do CRM (Recomendado)</label>
                <select className="input-field" value={formData.leadId || ''} onChange={(e) => {
                  const lid = e.target.value;
                  const lead = leads[lid];
                  if (lead) {
                    setFormData({...formData, leadId: lid, client: lead.name, title: `Agendado - ${formData.title.split(' (')[0] || 'Visita'} (${lead.name})`});
                  } else {
                    setFormData({...formData, leadId: '', client: ''});
                  }
                }}>
                  <option value="">-- Selecionar Cliente Existente --</option>
                  {Object.values(leads).map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.property}</option>
                  ))}
                </select>
              </div>

              {formData.leadId && leads[formData.leadId] && (
                <div className="lead-quick-info" style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid var(--primary)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <User size={14} className="text-primary" /> <strong>{leads[formData.leadId].name}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Phone size={14} className="text-primary" /> <span>{leads[formData.leadId].phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Home size={14} className="text-primary" /> <span>{leads[formData.leadId].property}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { sendToFollowUp(formData.leadId); alert('Lead enviado para Follow-up!'); }} title="Mover para Follow-up">
                        <ArrowRightLeft size={14} /> Mover p/ Follow-up
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="label">Título do Evento</label>
                <input className="input-field" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Visita Apt 302" />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Horário</label>
                  <input className="input-field" type="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="label">Tipo</label>
                  <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    <option value="visita">Visita</option>
                    <option value="reuniao">Reunião</option>
                    <option value="contrato">Contrato</option>
                    <option value="vistoria">Vistoria</option>
                    <option value="followup">Follow-up</option>
                  </select>
                </div>
              </div>

              {!formData.leadId && (
                <div className="form-group">
                  <label className="label">Cliente (Manual)</label>
                  <input className="input-field" value={formData.client} onChange={(e) => setFormData({...formData, client: e.target.value})} placeholder="Nome do cliente" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddEvent}>Agendar</button>
            </div>
          </div>
        </div>
      )}
      {/* Lead Edit Modal */}
      {showLeadModal && selectedLeadId && (
        <div className="modal-overlay" onClick={() => setShowLeadModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Atualizar Agendamento - {leads[selectedLeadId]?.name}</h2>
              <button className="btn-icon" onClick={() => setShowLeadModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Informações do Cliente</label>
                <div className="lead-quick-info" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Phone size={14} className="text-primary" /> <span>{leads[selectedLeadId]?.phone}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                        <Home size={14} className="text-primary" /> <span>{leads[selectedLeadId]?.property}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" onClick={() => { sendToFollowUp(selectedLeadId); setShowLeadModal(false); }} title="Mover para Follow-up">
                        <ArrowRightLeft size={14} /> Mover p/ Follow-up
                      </button>
                      <button className="btn btn-whatsapp btn-sm" onClick={() => openWhatsApp(leads[selectedLeadId]?.phone)}>
                        <MessageSquare size={14} /> WhatsApp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Adicionar ao Histórico (Resultado da Ação)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input-field" id="new-note-input" placeholder="O que aconteceu?" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote(e.target.value);
                      e.target.value = '';
                    }
                  }} />
                  <button className="btn btn-primary" onClick={() => {
                    const el = document.getElementById('new-note-input');
                    if (el.value) {
                      handleAddNote(el.value);
                      el.value = '';
                    }
                  }}>Add</button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Próximo Agendamento (Reagendar)</label>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Ação</label>
                    <input className="input-field" value={leadEditData.action} onChange={(e) => setLeadEditData({...leadEditData, action: e.target.value})} placeholder="Ex: Retorno, Reunião" />
                  </div>
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Data</label>
                    <input className="input-field" type="date" value={leadEditData.date} onChange={(e) => setLeadEditData({...leadEditData, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Hora</label>
                    <input className="input-field" type="time" value={leadEditData.time || ''} onChange={(e) => setLeadEditData({...leadEditData, time: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Histórico Recente</label>
                <div className="notes-preview-scroll" style={{ maxHeight: '120px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                  {leadEditData.notes ? (
                    leadEditData.notes.split('\n').map((n, i) => <div key={i} style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>• {n}</div>)
                  ) : <div className="text-secondary" style={{ fontSize: '0.85rem' }}>Nenhum histórico.</div>}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger mr-auto" onClick={handleClearSchedule}>
                <Trash2 size={16} /> Excluir Agendamento
              </button>
              <button className="btn btn-outline" onClick={() => setShowLeadModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveLeadUpdate}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
