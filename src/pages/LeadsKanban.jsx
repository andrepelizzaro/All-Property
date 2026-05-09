import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Phone, MessageSquare, Tag, Calendar, Edit3, Trash2, X, Home, ArrowRightLeft } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useLeads } from '../context/LeadsContext';
import './LeadsKanban.css';

const PriorityBadge = ({ priority }) => {
  const colors = {
    Alta: 'badge-danger',
    Média: 'badge-warning',
    Baixa: 'badge-success'
  };
  return (
    <span className={`badge ${colors[priority] || 'badge-primary'}`}>
      {priority}
    </span>
  );
};

const LeadsKanban = () => {
  const { leads, columns, columnOrder, addLead, updateLead, deleteLead, sendToFollowUp, removeFromFollowUp, moveLeadInKanban } = useLeads();
  const [currentStageId, setCurrentStageId] = useState('col-1');
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
    stageId: 'col-1',
    scheduledDate: '',
    scheduledTime: '',
    scheduledAction: ''
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleOpenNew = () => {
    setEditingLeadId(null);
    setFormData({
      name: '', phone: '', property: '', source: 'WhatsApp', 
      broker: 'Admin', priority: 'Média', notes: '',
      stageId: currentStageId,
      scheduledDate: '', scheduledTime: '', scheduledAction: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (lead) => {
    // Find which column this lead belongs to
    let leadStageId = 'col-1';
    for (const colId of columnOrder) {
      if (columns[colId].leadIds.includes(lead.id)) {
        leadStageId = colId;
        break;
      }
    }

    setEditingLeadId(lead.id);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      property: lead.property || '',
      source: lead.source || 'WhatsApp',
      broker: lead.broker || 'Admin',
      priority: lead.priority || 'Média',
      notes: lead.notes || '',
      stageId: leadStageId,
      scheduledDate: lead.scheduledDate || '',
      scheduledTime: lead.scheduledTime || '',
      scheduledAction: lead.scheduledAction || ''
    });
    setShowModal(true);
  };

  const handleSaveLead = () => {
    if (!formData.name.trim()) return;
    const { stageId, ...leadData } = formData;
    if (editingLeadId) {
      updateLead(editingLeadId, leadData, stageId);
    } else {
      addLead(leadData, stageId);
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    deleteLead(id);
    setShowDeleteConfirm(null);
  };

  const openWhatsApp = (phone) => {
    if (!phone) return;
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  const isEditing = editingLeadId !== null;

  return (
    <div className="kanban-page">
        <div className="kanban-header">
          <button className="btn btn-primary" onClick={handleOpenNew}>
            <Plus size={18} /> Novo Lead
          </button>
          <div className="kanban-header-info">
            <p className="text-secondary" style={{ margin: 0 }}>Organize seus leads de forma simples e eficiente através de pastas</p>
          </div>
        </div>

      <div className="folders-navigation-wrapper">
        <div className="folders-tabs">
          {columnOrder.map(colId => (
            <button 
              key={colId}
              className={`folder-tab ${currentStageId === colId ? 'active' : ''}`}
              onClick={() => setCurrentStageId(colId)}
            >
              <span className="folder-name">{columns[colId].title}</span>
              <span className="folder-badge">{columns[colId].leadIds.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="active-folder-content">
        {columns[currentStageId].leadIds.length === 0 ? (
          <div className="empty-folder-msg glass-panel">
            <Search size={48} />
            <p>Nenhum lead nesta pasta</p>
            <button className="btn btn-outline" onClick={handleOpenNew}>Cadastrar Primeiro Lead</button>
          </div>
        ) : (
          <div className="leads-grid">
            {columns[currentStageId].leadIds.map(leadId => {
              const lead = leads[leadId];
              if (!lead) return null;
              return (
                <div key={lead.id} className="kanban-card glass-panel animate-fade-in">
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
              );
            })}
          </div>
        )}
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
                    <label className="label">Etapa do Funil (Pasta)</label>
                    <select className="input-field" value={formData.stageId} onChange={(e) => setFormData({...formData, stageId: e.target.value})}>
                      {columnOrder.map(colId => (
                        <option key={colId} value={colId}>{columns[colId].title}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Prioridade</label>
                    <select className="input-field" value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value})}>
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </select>
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
    );
  };

export default LeadsKanban;
