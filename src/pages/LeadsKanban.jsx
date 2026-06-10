import { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Phone, MessageSquare, Tag, Calendar, Edit3, Trash2, X, Home, ArrowRightLeft, Clock } from 'lucide-react';
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
  const { leads, columns, columnOrder, loading, addLead, updateLead, deleteLead, sendToFollowUp } = useLeads();
  const [currentStageId, setCurrentStageId] = useState('col-1');
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Permissão de exclusão: apenas Andre, Araujo e Jonata
  const currentUserEmail = (localStorage.getItem('userEmail') || '').trim().toLowerCase();
  const canDelete = [
    'andre@allproperty.com',
    'araujo@allproperty.com',
    'jonata@allproperty.com',
  ].includes(currentUserEmail);

  const isJorge = currentUserEmail === 'jorge@allproperty.com';
  const isGustavo = currentUserEmail === 'gustavo@allproperty.com';
  const isRestricted = isJorge || isGustavo;
  const canAssign = !isRestricted;

  const getDefaultAssignedTo = () => {
    if (isJorge) return 'Jorge';
    if (isGustavo) return 'Gustavo';
    return '';
  };
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    property: '',
    source: 'WhatsApp',
    broker: 'Admin',
    priority: 'Média',
    assignedTo: '',
    notes: '',
    stageId: 'col-1',
    scheduledDate: '',
    scheduledTime: '',
    scheduledAction: ''
  });

  const isEditing = editingLeadId !== null;

  useEffect(() => {
    if (editingLeadId && leads[editingLeadId]) {
      const lead = leads[editingLeadId];
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        property: lead.property || '',
        source: lead.source || 'WhatsApp',
        broker: lead.broker || 'Admin',
        priority: lead.priority || 'Média',
        assignedTo: lead.assignedTo || '',
        notes: lead.notes || '',
        stageId: Object.keys(columns).find(key => columns[key].leadIds.includes(editingLeadId)) || 'col-1',
        scheduledDate: lead.scheduledDate || '',
        scheduledTime: lead.scheduledTime || '',
        scheduledAction: lead.scheduledAction || ''
      });
    } else {
      setFormData(prev => ({ 
        ...prev, 
        stageId: currentStageId,
        assignedTo: prev.assignedTo || getDefaultAssignedTo()
      }));
    }
  }, [editingLeadId, leads, currentStageId, columns]);

  const handleSaveLead = async () => {
    if (!formData.name.trim()) return;
    const { stageId, ...leadData } = formData;
    
    if (editingLeadId) {
      await updateLead(editingLeadId, leadData, stageId);
    } else {
      await addLead(leadData, stageId);
    }
    
    setShowModal(false);
    setEditingLeadId(null);
    resetForm();
  };

  const handleDelete = async (id) => {
    await deleteLead(id);
    setShowDeleteConfirm(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      property: '',
      source: 'WhatsApp',
      broker: 'Admin',
      priority: 'Média',
      assignedTo: getDefaultAssignedTo(),
      notes: '',
      stageId: currentStageId,
      scheduledDate: '',
      scheduledTime: '',
      scheduledAction: ''
    });
  };

  const openWhatsApp = (phone) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Carregando funil...</p>
      </div>
    );
  }

  const currentLeads = (columns[currentStageId]?.leadIds || [])
    .map(id => leads[id])
    .filter(lead => lead && lead.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="kanban-page">
      <header className="kanban-header">
        <div className="header-info">
          <h1>Funil de Leads</h1>
          <p className="text-secondary">Organize seus leads de forma simples e eficiente através de pastas</p>
        </div>
        <div className="header-actions">
          <div className="search-wrapper">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={() => { setEditingLeadId(null); resetForm(); setShowModal(true); }}>
            <Plus size={20} />
            Novo Lead
          </button>
        </div>
      </header>

      <div className="folders-navigation-wrapper">
        <div className="folders-tabs">
          {columnOrder.map(colId => (
            <button 
              key={colId}
              className={`folder-tab ${currentStageId === colId ? 'active' : ''}`}
              onClick={() => setCurrentStageId(colId)}
            >
              <span className="folder-title">{columns[colId].title}</span>
              <span className="folder-count">{columns[colId].leadIds.length}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="leads-content-area">
        {currentLeads.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <Search size={48} />
            </div>
            <h3>Nenhum lead nesta pasta</h3>
            <p>Cadastre um novo lead ou mude a etapa de um existente.</p>
            <button className="btn-outline" onClick={() => setShowModal(true)}>
              Cadastrar Primeiro Lead
            </button>
          </div>
        ) : (
          <div className="leads-grid">
            {currentLeads.map(lead => (
              <div key={lead.id} className="lead-card-premium">
                <div className="lead-card-header">
                  <div className="lead-card-badges">
                    <PriorityBadge priority={lead.priority} />
                    {lead.assignedTo && (
                      <span className="badge badge-broker" title="Corretor Responsável">
                        👤 {lead.assignedTo}
                      </span>
                    )}
                  </div>
                  <div className="lead-card-actions">
                    <button onClick={() => { setEditingLeadId(lead.id); setShowModal(true); }} title="Editar">
                      <Edit3 size={16} />
                    </button>
                    {canDelete && (
                      <button onClick={() => setShowDeleteConfirm(lead.id)} title="Excluir" className="btn-delete-card">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="lead-card-body">
                  <h3 className="lead-name">{lead.name}</h3>
                  <div className="lead-info-row">
                    <Home size={14} />
                    <span>{lead.property || 'Não especificado'}</span>
                  </div>
                  <div className="lead-info-row">
                    <Tag size={14} />
                    <span>{lead.source}</span>
                  </div>
                  <div className="lead-info-row">
                    <Calendar size={14} />
                    <span>{lead.date}</span>
                  </div>
                </div>

                <div className="lead-card-footer">
                  <button className="action-btn chat" onClick={() => openWhatsApp(lead.phone)}>
                    <MessageSquare size={16} />
                    WhatsApp
                  </button>
                  <button className="action-btn follow" onClick={() => sendToFollowUp(lead.id)}>
                    <Clock size={16} />
                    Follow-up
                  </button>
                  <button className="action-btn call">
                    <Phone size={16} />
                    Ligar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content premium-modal">
            <div className="modal-header">
              <h2>{isEditing ? 'Editar Lead' : 'Novo Lead'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            
            <div className="modal-body scrollable-modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ex: João Silva" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    placeholder="(00) 00000-0000" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Origem do Lead</label>
                  <select 
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Site">Site</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Portal">Portal Imobiliário</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prioridade</label>
                  <select 
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Corretor Responsável</label>
                  <select 
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                    disabled={!canAssign}
                  >
                    <option value="">-- Sem responsável --</option>
                    <option value="Araujo">Araujo</option>
                    <option value="Jonata">Jonata</option>
                    <option value="Jorge">Jorge</option>
                    <option value="Gustavo">Gustavo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Etapa do Funil (Pasta)</label>
                  <select 
                    value={formData.stageId}
                    onChange={(e) => setFormData({...formData, stageId: e.target.value})}
                  >
                    {columnOrder.map(colId => (
                      <option key={colId} value={colId}>{columns[colId].title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Imóvel de Interesse</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Apt 302 Ed. Lumiere" 
                    value={formData.property}
                    onChange={(e) => setFormData({...formData, property: e.target.value})}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Histórico do Cliente</label>
                  <div className="history-container">
                    {formData.notes ? (
                      formData.notes.split('\n').map((line, i) => (
                        <div key={i} className="history-item">
                          <span className="history-dot"></span>
                          <span className="history-text">{line}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-secondary" style={{ fontSize: '13px', margin: '8px 0' }}>Nenhum histórico registrado.</p>
                    )}
                  </div>
                  
                  <div className="add-history-box">
                    <textarea 
                      id="new-note-kanban"
                      placeholder="Adicionar nova observação ao histórico..." 
                      rows="2"
                    ></textarea>
                    <button className="btn-secondary btn-sm" onClick={() => {
                      const el = document.getElementById('new-note-kanban');
                      if (!el.value.trim()) return;
                      const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
                      const newNote = `[${timestamp}] ${el.value}`;
                      const updatedNotes = formData.notes ? `${newNote}\n${formData.notes}` : newNote;
                      setFormData({...formData, notes: updatedNotes});
                      el.value = '';
                    }}>Adicionar Nota</button>
                  </div>
                </div>

                <div className="form-section-title full-width">Agendamento de Compromisso</div>
                
                <div className="form-group">
                  <label>Ação Agendada (ex: Visita)</label>
                  <input 
                    type="text" 
                    placeholder="O que deve ser feito?" 
                    value={formData.scheduledAction}
                    onChange={(e) => setFormData({...formData, scheduledAction: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Data</label>
                  <input 
                    type="date" 
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Horário</label>
                  <input 
                    type="time" 
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveLead}>
                {isEditing ? 'Salvar Alterações' : 'Cadastrar Lead'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content mini-modal">
            <h3>Excluir Lead?</h3>
            <p>Esta ação não pode ser desfeita.</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-danger" onClick={() => handleDelete(showDeleteConfirm)}>Excluir Agora</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsKanban;
