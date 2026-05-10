import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User, X, Trash2, MessageSquare, Phone, Home, ArrowRightLeft } from 'lucide-react';
import { useLeads } from '../context/LeadsContext';
import { supabase } from '../supabaseClient';
import './Calendar.css';

const today = new Date();

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CalendarPage = () => {
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const { leads, sendToFollowUp, updateLead, loading: leadsLoading } = useLeads();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync events from Supabase and merge with Lead schedules
  const fetchEvents = async () => {
    let manualEvents = [];
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*');
      
      if (error) {
        console.warn('Tabela calendar_events não encontrada ou inacessível. Usando apenas agendamentos de leads.');
      } else {
        manualEvents = data || [];
      }
    } catch (e) {
      console.warn('Erro ao conectar com calendar_events:', e);
    }

    // Convert leads with scheduled dates to events
    const scheduledLeads = Object.values(leads)
      .filter(l => l.scheduledDate && l.scheduledDate.includes('-'))
      .map(l => {
        try {
          const [year, month, day] = l.scheduledDate.split('-');
          return {
            id: l.id,
            year: parseInt(year, 10),
            month: parseInt(month, 10) - 1,
            day: parseInt(day, 10),
            title: l.name,
            action: l.scheduledAction || 'Ação',
            time: l.scheduledTime || '09:00',
            client: l.name,
            type: 'visita',
            isLead: true
          };
        } catch (err) {
          console.error('Erro ao processar data do lead:', l.name, err);
          return null;
        }
      })
      .filter(ev => ev !== null);

    console.log('Eventos processados para a agenda:', [...manualEvents, ...scheduledLeads]);
    setEvents([...manualEvents, ...scheduledLeads]);
    setLoading(false);
  };

  useEffect(() => {
    if (!leadsLoading) {
      fetchEvents();
    }
  }, [leads, leadsLoading]);

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
    if (ev.isLead || leads[ev.id]) {
      const leadId = ev.id;
      const lead = leads[leadId];
      setSelectedLeadId(leadId);
      setLeadEditData({
        notes: lead.notes || '',
        action: lead.scheduledAction || '',
        date: lead.scheduledDate || '',
        time: lead.scheduledTime || ''
      });
      setShowLeadModal(true);
    } else {
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

  const handleSaveLeadUpdate = async () => {
    if (!selectedLeadId) return;
    await updateLead(selectedLeadId, {
      notes: leadEditData.notes,
      scheduledAction: leadEditData.action,
      scheduledDate: leadEditData.date,
      scheduledTime: leadEditData.time
    });
    setShowLeadModal(false);
  };

  const handleClearSchedule = async () => {
    if (!selectedLeadId) return;
    await updateLead(selectedLeadId, {
      scheduledDate: '',
      scheduledAction: '',
      scheduledTime: ''
    });
    setShowLeadModal(false);
  };

  const handleAddNote = async (text) => {
    if (!text.trim() || !selectedLeadId) return;
    const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const newNote = `[${timestamp}] ${text}`;
    const currentNotes = leadEditData.notes;
    const updatedNotes = currentNotes ? `${newNote}\n${currentNotes}` : newNote;
    setLeadEditData({ ...leadEditData, notes: updatedNotes });
    await updateLead(selectedLeadId, { notes: updatedNotes });
  };

  const dayEvents = (day) => events.filter(e => 
    e.day === day && 
    (e.month === undefined || e.month === currentMonth) && 
    (e.year === undefined || e.year === currentYear)
  );

  const selectedEvents = dayEvents(selectedDay);

  const handleAddEvent = async () => {
    if (!formData.title.trim()) return;
    
    if (formData.leadId) {
      await updateLead(formData.leadId, {
        scheduledDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`,
        scheduledTime: formData.time,
        scheduledAction: formData.title.replace('Agendado - ', '').split(' (')[0] || formData.title
      });
    } else {
      const payload = {
        title: formData.title,
        time: formData.time,
        client: formData.client,
        type: formData.type,
        day: selectedDay,
        month: currentMonth,
        year: currentYear
      };

      if (formData.id) {
        await supabase.from('calendar_events').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('calendar_events').insert([payload]);
      }
      fetchEvents();
    }
    
    setFormData({ title: '', time: '', client: '', type: 'visita', leadId: '' });
    setShowModal(false);
  };

  const handleDeleteManualEvent = async (id) => {
    await supabase.from('calendar_events').delete().eq('id', id);
    fetchEvents();
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
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

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
        <div className="calendar-main glass-panel animate-fade-in">
          <div className="calendar-nav">
            <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={20} /></button>
            <h2>{monthNames[currentMonth]} {currentYear}</h2>
            <button className="btn-icon" onClick={nextMonth}><ChevronRight size={20} /></button>
          </div>

          <div className="calendar-weekdays">
            {weekDays.map(day => <div key={day} className="weekday">{day}</div>)}
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

        <div className="events-sidebar glass-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="sidebar-day-title">{selectedDay} de {monthNames[currentMonth]}</h3>
          <div className="sidebar-content-wrapper">
            <div className="selected-day-section">
              {selectedEvents.length === 0 ? (
                <div className="no-events"><p className="text-secondary">Nenhum evento neste dia</p></div>
              ) : (
                <div className="events-list-sidebar">
                  {selectedEvents.map(ev => (
                    <div key={ev.id} className="event-item-sidebar clickable" style={{ borderLeftColor: eventTypeColor(ev.type) }} onClick={() => handleEventClick(ev)}>
                      <div className="event-type-badge" style={{ background: eventTypeColor(ev.type) + '22', color: eventTypeColor(ev.type) }}>
                        {ev.action || eventTypeLabel(ev.type)}
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
                  .slice(0, 5)
                  .map(ev => (
                    <div key={ev.id} className="upcoming-item clickable" onClick={() => handleEventClick(ev)}>
                      <div className="upcoming-date">
                        <span className="upcoming-day">{ev.day}</span>
                        <span className="upcoming-month">{monthNames[ev.month !== undefined ? ev.month : currentMonth].slice(0, 3)}</span>
                      </div>
                      <div className="upcoming-info">
                        <span className="upcoming-title-text">{ev.title}</span>
                        <span className="upcoming-time">{ev.time} • {ev.action || eventTypeLabel(ev.type)}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{formData.id ? 'Editar Evento' : 'Novo Evento'} - Dia {selectedDay}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Vincular Cliente do CRM</label>
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
              {formData.id && (
                <button className="btn btn-danger mr-auto" onClick={() => handleDeleteManualEvent(formData.id)}>Excluir</button>
              )}
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAddEvent}>Agendar</button>
            </div>
          </div>
        </div>
      )}

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
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="label">Histórico do Cliente</label>
                <div className="history-display-modal" style={{ 
                  maxHeight: '150px', 
                  overflowY: 'auto', 
                  background: 'rgba(255,255,255,0.02)', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border)',
                  marginBottom: '12px',
                  fontSize: '0.85rem'
                }}>
                  {leadEditData.notes ? (
                    leadEditData.notes.split('\n').map((line, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }}></div>
                        <span style={{ color: 'var(--text-secondary)' }}>{line}</span>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Sem histórico.</p>
                  )}
                </div>
                <label className="label">Adicionar ao Histórico</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input className="input-field" id="new-note-input" placeholder="O que aconteceu?" onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddNote(e.target.value);
                      e.target.value = '';
                    }
                  }} />
                  <button className="btn btn-primary" onClick={() => {
                    const el = document.getElementById('new-note-input');
                    if (el.value) { handleAddNote(el.value); el.value = ''; }
                  }}>Add</button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Reagendar</label>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Ação</label>
                    <input className="input-field" value={leadEditData.action} onChange={(e) => setLeadEditData({...leadEditData, action: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Data</label>
                    <input className="input-field" type="date" value={leadEditData.date} onChange={(e) => setLeadEditData({...leadEditData, date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label" style={{ fontSize: '0.75rem' }}>Hora</label>
                    <input className="input-field" type="time" value={leadEditData.time} onChange={(e) => setLeadEditData({...leadEditData, time: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger mr-auto" onClick={handleClearSchedule}>Excluir</button>
              <button className="btn btn-outline" onClick={() => setShowLeadModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveLeadUpdate}>Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
