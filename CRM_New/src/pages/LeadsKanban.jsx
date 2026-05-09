import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, MoreVertical, Phone, MessageSquare, Tag, Clock, Calendar, Edit3, Trash2, X, Home, ArrowRightLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLeads } from '../context/LeadsContext';
import './LeadsKanban.css';

const PriorityBadge = ({ priority }) => {
  const colors = {
    Alta: 'bg-danger-transparent text-danger',
    Média: 'bg-warning-transparent text-warning',
    Baixa: 'bg-success-transparent text-success'
  };
  return (
    <span className={`badge ${colors[priority] || 'bg-secondary-transparent text-secondary'}`}>
      {priority}
    </span>
  );
};

const LeadsKanban = () => {
  const { leads, columns, columnOrder, addLead, updateLead, deleteLead, sendToFollowUp, removeFromFollowUp, moveLeadInKanban } = useLeads();
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    property: '',
    source: 'WhatsApp',
    broker: 'Admin',
    priority: 'Média',
    notes: '',
    scheduledDate: '',
    scheduledTime: '',
    scheduledAction: ''
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') scrollLeft();
      else if (e.key === 'ArrowRight') scrollRight();
    };

    const handleWheel = (e) => {
      if (scrollRef.current) {
        // Scroll horizontally with wheel
        const isOverColumnContent = e.target.closest('.kanban-column-content');
        // If not over a scrollable column list, or if holding shift, scroll the board
        if (!isOverColumnContent || e.shiftKey) {
          e.preventDefault();
          scrollRef.current.scrollLeft += e.deltaY;
        }
      }
    };

    window.addEventListener('keydown', handleKey);
    const scrollEl = scrollRef.current;
    
    if (scrollEl) {
      scrollEl.addEventListener('wheel', handleWheel, { passive: false });
    }

    return () => {
      window.removeEventListener('keydown', handleKey);
      if (scrollEl) {
        scrollEl.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    moveLeadInKanban(source, destination, draggableId);
  };

  const handleOpenNew = () => {
    setEditingLeadId(null);
    setFormData({
      name: '', phone: '', property: '', source: 'WhatsApp', 
      broker: 'Admin', priority: 'Média', notes: '',
      scheduledDate: '', scheduledTime: '', scheduledAction: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLeadId(lead.id);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      property: lead.property || '',
      source: lead.source || 'WhatsApp',
      broker: lead.broker || 'Admin',
      priority: lead.priority || 'Média',
      notes: lead.notes || '',
      scheduledDate: lead.scheduledDate || '',
      scheduledTime: lead.scheduledTime || '',
      scheduledAction: lead.scheduledAction || ''
    });
    setShowModal(true);
  };

  const handleSaveLead = () => {
    if (!formData.name.trim()) return;
    if (editingLeadId) {
      updateLead(editingLeadId, formData);
    } else {
      addLead(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    deleteLead(id);
    setShowDeleteConfirm(null);
  };

  const openWhatsApp = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  const isEditing = editingLeadId !== null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban-page">
        <div className="kanban-header">
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={18} /> Novo Lead
          </button>
          <div className="kanban-header-info">
            <p className="text-secondary" style={{ margin: 0 }}>Gerencie seus leads arrastando entre as etapas</p>
          </div>
        </div>

        <div className="kanban-board-scroll" ref={scrollRef}>
          <div className="kanban-board">
            {columnOrder.map(columnId => {
              const column = columns[columnId];
              const colLeads = column.leadIds.map(id => leads[id]).filter(Boolean);

              return (
                <div key={column.id} className="kanban-column-wrapper">
                  <div className="kanban-column-header">
                    <h3>{column.title}</h3>
                    <span className="column-count">{colLeads.length}</span>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        className={`kanban-column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {colLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                className={`kanban-card glass-panel ${snapshot.isDragging ? 'is-dragging' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <div className="card-top">
                                  <PriorityBadge priority={lead.priority} />
                                  <div className="card-actions">
                                    {lead.inFollowUp ? (
                                      <button className="card-action-btn followup-active-btn" title="Remover do Follow-up"
                                        onClick={(e) => { e.stopPropagation(); removeFromFollowUp(lead.id); }}>
                                        <ArrowRightLeft size={13} />
                                      </button>
                                    ) : (
                                      <button className="card-action-btn followup-btn" title="Enviar para Follow-up"
                                        onClick={(e) => { e.stopPropagation(); sendToFollowUp(lead.id); }}>
                                        <ArrowRightLeft size={13} />
                                      </button>
                                    )}
                                    <button className="card-action-btn schedule-btn" title="Agendar"
                                          onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}>
                                          <Calendar size={13} />
                                    </button>
                                    <button className="card-action-btn edit-btn" title="Editar"
                                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}>
                                      <Edit3 size={13} />
                                    </button>
                                    <button className="card-action-btn delete-btn" title="Excluir"
                                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(lead.id); }}>
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                                
                                <h4 className="lead-name lead-name-clickable" onClick={() => handleOpenEdit(lead)}>
                                  {lead.name}
                                  {lead.inFollowUp && <span className="followup-indicator" title="No Follow-up">●</span>}
                                </h4>
                                
                                <button className="card-schedule-display-btn" onClick={(e) => { e.stopPropagation(); handleOpenEdit(lead); }}>
                                  <Calendar size={14} /> {lead.scheduledDate ? `${lead.scheduledAction || 'Agendado'}: ${lead.scheduledDate} ${lead.scheduledTime ? ' às ' + lead.scheduledTime : ''}` : 'Agendar'}
                                </button>

                                <div className="lead-details">
                                  <div className="detail-item"><Phone size={14} /> <span>{lead.phone}</span></div>
                                  <div className="detail-item"><Home size={14} /> <span>{lead.property}</span></div>
                                </div>
                                
                                <div className="card-footer">
                                  <div className="source-tag"><Tag size={12} /> {lead.source}</div>
                                  <button className="btn-icon-small whatsapp-btn" title="WhatsApp"
                                    onClick={(e) => { e.stopPropagation(); openWhatsApp(lead.phone); }}>
                                    <MessageSquare size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modals */}
        {showDeleteConfirm && (
          <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="delete-confirm-box glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon"><Trash2 size={32} /></div>
              <h3>Excluir Lead?</h3>
              <p className="text-secondary">
                Tem certeza que deseja excluir <strong>{leads[showDeleteConfirm]?.name}</strong>?<br/>Esta ação não pode ser desfeita.
              </p>
              <div className="delete-confirm-actions">
                <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{isEditing ? 'Editar Lead' : 'Cadastrar Novo Lead'}</h2>
                <button className="btn-icon" onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Nome Completo *</label>
                    <input className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: João da Silva" autoFocus />
                  </div>
                  <div className="form-group">
                    <label className="label">Telefone</label>
                    <input className="input-field" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(11) 99999-9999" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Imóvel de Interesse</label>
                    <input className="input-field" value={formData.property} onChange={(e) => setFormData({...formData, property: e.target.value})} placeholder="Ex: Apt 302 Lumiere" />
                  </div>
                  <div className="form-group">
                    <label className="label">Origem</label>
                    <select className="input-field" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})}>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Meta Ads">Meta Ads</option>
                      <option value="Site">Site</option>
                      <option value="Indicação">Indicação</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Prioridade</label>
                    <select className="input-field" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Corretor Responsável</label>
                    <input className="input-field" value={formData.broker} onChange={(e) => setFormData({...formData, broker: e.target.value})} placeholder="Admin" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Data Agendada</label>
                    <input className="input-field" type="date" value={formData.scheduledDate || ''} onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="label">Horário</label>
                    <input className="input-field" type="time" value={formData.scheduledTime || ''} onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="label">Ação Agendada (ex: Visita, Retorno)</label>
                  <input className="input-field" value={formData.scheduledAction || ''} onChange={(e) => setFormData({...formData, scheduledAction: e.target.value})} placeholder="O que deve ser feito?" />
                </div>
                <div className="form-group">
                  <label className="label">Observações / Histórico</label>
                  <textarea className="input-field" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Informações adicionais..." rows={3}></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleSaveLead}>{isEditing ? 'Salvar Alterações' : 'Cadastrar Lead'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default LeadsKanban;
