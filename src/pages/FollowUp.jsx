import { useState } from 'react';
import { 
  Bell, Clock, CheckCircle2, AlertCircle, Phone, 
  MessageSquare, Calendar, Plus, MapPin, Edit3,
  Trash2, X, ArrowRightLeft, User, Search
} from 'lucide-react';
import { useLeads } from '../context/LeadsContext';
import './FollowUp.css';

const emptyForm = {
  name: '', phone: '', property: '', source: 'WhatsApp',
  broker: 'Admin', priority: 'Média', notes: '',
  scheduledDate: '', scheduledTime: '', scheduledAction: ''
};

const FollowUp = () => {
  const { leads, followUpLeads, addLead, updateLead, deleteLead, removeFromFollowUp, sendToFollowUp } = useLeads();
  const [selectedLeadId, setSelectedLeadId] = useState(followUpLeads.length > 0 ? followUpLeads[0]?.id : null);
  const [showModal, setShowModal] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const selectedLead = selectedLeadId ? leads[selectedLeadId] : null;

  const filtered = followUpLeads.filter(l =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.property.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Open modal to add a new lead directly to follow-up
  const handleOpenNew = () => {
    setEditingLeadId(null);
    setFormData({ ...emptyForm });
    setShowModal(true);
  };

  // Open modal to edit existing lead
  const handleOpenEdit = (lead) => {
    setEditingLeadId(lead.id);
    setFormData({
      name: lead.name, phone: lead.phone, property: lead.property,
      source: lead.source, broker: lead.broker, priority: lead.priority, 
      notes: lead.notes || '', 
      scheduledDate: lead.scheduledDate || '',
      scheduledTime: lead.scheduledTime || '',
      scheduledAction: lead.scheduledAction || ''
    });
    setShowModal(true);
  };

  const handleSaveLead = async () => {
    if (!formData.name.trim()) return;
    if (editingLeadId) {
      await updateLead(editingLeadId, formData);
    } else {
      const id = await addLead({ ...formData, inFollowUp: true });
      if (id) setSelectedLeadId(id);
    }
    setShowModal(false);
    setEditingLeadId(null);
  };

  const handleDeleteLead = async (id) => {
    if (selectedLeadId === id) {
      const remaining = followUpLeads.filter(l => l.id !== id);
      setSelectedLeadId(remaining.length > 0 ? remaining[0].id : null);
    }
    await deleteLead(id);
    setShowDeleteConfirm(null);
  };

  const handleRemoveFromFollowUp = async (id) => {
    if (selectedLeadId === id) {
      const remaining = followUpLeads.filter(l => l.id !== id);
      setSelectedLeadId(remaining.length > 0 ? remaining[0].id : null);
    }
    await removeFromFollowUp(id);
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLead) return;
    const currentNotes = selectedLead.notes || '';
    const timestamp = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const newNote = `[${timestamp}] ${noteText}`;
    await updateLead(selectedLeadId, { notes: currentNotes ? `${newNote}\n${currentNotes}` : newNote });
    setNoteText('');
    setShowNoteInput(false);
  };

  const openWhatsApp = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleaned}`, '_blank');
  };

  const priorityLabel = (p) => {
    if (p === 'Alta') return 'Lead Quente';
    if (p === 'Média') return 'Lead Morno';
    return 'Lead Frio';
  };

  const priorityBadgeClass = (p) => {
    if (p === 'Alta') return 'badge-danger';
    if (p === 'Média') return 'badge-warning';
    return 'badge-success';
  };

  const isEditing = editingLeadId !== null;

  return (
    <div className="followup-page">
      <div className="followup-top-header">
        <button className="btn btn-primary" onClick={handleOpenNew}>
          <Plus size={18} /> Novo Follow-up
        </button>
        <div>
          <h1>Central de Follow-up</h1>
          <p className="text-secondary">Gerencie o relacionamento com seus leads</p>
        </div>
      </div>

      <div className="followup-grid">
        {/* ── Left: Leads List ── */}
        <div className="followup-left">
          <div className="leads-list-panel glass-panel animate-fade-in">
            <div className="followup-search-box">
              <Search size={16} className="followup-search-icon" />
              <input
                type="text"
                className="input-field followup-search-input"
                placeholder="Buscar lead..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="leads-compact-list">
              {filtered.length === 0 && (
                <div className="empty-follow-up">
                  <p className="text-secondary">Nenhum lead no follow-up</p>
                  <button className="btn btn-outline btn-sm" onClick={handleOpenNew}>
                    <Plus size={14} /> Adicionar
                  </button>
                </div>
              )}
              {filtered.map((lead) => (
                <div 
                  key={lead.id} 
                  className={`lead-compact-item ${selectedLeadId === lead.id ? 'active' : ''}`}
                  onClick={() => setSelectedLeadId(lead.id)}
                >
                  <div className="lead-compact-avatar">
                    {lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="lead-compact-info">
                    <h4>{lead.name}</h4>
                    <span className="lead-compact-status">{lead.property || 'Sem imóvel'}</span>
                  </div>
                  <div className="lead-compact-actions">
                    <span className={`badge badge-sm ${priorityBadgeClass(lead.priority)}`}>{lead.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Lead Detail ── */}
        <div className="followup-right">
          {selectedLead ? (
            <div className="lead-detail-panel glass-panel animate-fade-in">
              <div className="lead-profile-header">
                <div className="profile-main">
                  <div className="profile-avatar-large">
                    {selectedLead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2>{selectedLead.name}</h2>
                    <div className="profile-tags">
                      <span className={`badge ${priorityBadgeClass(selectedLead.priority)}`}>
                        {priorityLabel(selectedLead.priority)}
                      </span>
                      <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(selectedLead)}>
                        <Calendar size={14} /> {selectedLead.scheduledDate ? `${selectedLead.scheduledAction || 'Agendado'}: ${selectedLead.scheduledDate} ${selectedLead.scheduledTime ? ' às ' + selectedLead.scheduledTime : ''}` : 'Agendar'}
                      </button>
                      <span className="badge badge-primary">{selectedLead.source}</span>
                    </div>
                  </div>
                </div>
                <div className="profile-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(selectedLead)}>
                    <Edit3 size={14} /> Editar
                  </button>
                  <button className="btn btn-outline btn-sm text-danger-btn" onClick={() => handleRemoveFromFollowUp(selectedLead.id)}>
                    <ArrowRightLeft size={14} /> Remover
                  </button>
                  <button className="btn btn-outline btn-sm text-danger-btn" onClick={() => setShowDeleteConfirm(selectedLead.id)}>
                    <Trash2 size={14} /> Excluir
                  </button>
                </div>
              </div>

              <div className="lead-info-grid">
                <div className="info-box">
                  <span className="info-label">Telefone</span>
                  <span className="info-value">{selectedLead.phone || '—'}</span>
                </div>
                <div className="info-box">
                  <span className="info-label">Imóvel de Interesse</span>
                  <span className="info-value">{selectedLead.property || '—'}</span>
                </div>
                <div className="info-box">
                  <span className="info-label">Corretor</span>
                  <span className="info-value">{selectedLead.broker}</span>
                </div>
                <div className="info-box">
                  <span className="info-label">Prioridade</span>
                  <span className="info-value">{selectedLead.priority}</span>
                </div>
              </div>

              <div className="followup-contact-buttons">
                {selectedLead.phone && (
                  <a href={`tel:${selectedLead.phone}`} className="btn btn-outline">
                    <Phone size={16} /> Ligar
                  </a>
                )}
                {selectedLead.phone && (
                  <button className="btn btn-whatsapp" onClick={() => openWhatsApp(selectedLead.phone)}>
                    <MessageSquare size={16} /> WhatsApp
                  </button>
                )}
              </div>

              {/* Notes / Timeline */}
              <div className="timeline-section">
                <div className="timeline-header">
                  <h3>Observações e Histórico</h3>
                  <button className="action-btn" title="Adicionar nota" onClick={() => setShowNoteInput(!showNoteInput)}>
                    <Plus size={16} />
                  </button>
                </div>

                {showNoteInput && (
                  <div className="note-input-area">
                    <textarea
                      className="input-field textarea"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Escreva uma observação..."
                      rows={2}
                      autoFocus
                    />
                    <div className="note-input-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => { setShowNoteInput(false); setNoteText(''); }}>Cancelar</button>
                      <button className="btn btn-primary btn-sm" onClick={handleAddNote}>Salvar Nota</button>
                    </div>
                  </div>
                )}

                <div className="notes-display">
                  {selectedLead.notes ? (
                    selectedLead.notes.split('\n').map((line, i) => (
                      <div key={i} className="note-line">
                        <CheckCircle2 size={14} className="note-icon" />
                        <span>{line}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-secondary no-notes">Nenhuma observação registrada.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-lead-selected glass-panel animate-fade-in">
              <User size={48} />
              <h3>Selecione um lead</h3>
              <p className="text-secondary">Escolha um lead na lista ou adicione um novo para começar o follow-up</p>
              <button className="btn btn-primary" onClick={handleOpenNew}>
                <Plus size={16} /> Novo Follow-up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="delete-confirm-box glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-icon"><Trash2 size={32} /></div>
            <h3>Excluir Lead?</h3>
            <p className="text-secondary">
              Tem certeza que deseja excluir <strong>{leads[showDeleteConfirm]?.name}</strong>?<br/>Isso remove do funil e do follow-up.
            </p>
            <div className="delete-confirm-actions">
              <button className="btn btn-outline" onClick={() => setShowDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDeleteLead(showDeleteConfirm)}>
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Editar Lead' : 'Novo Lead - Follow-up'}</h2>
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
                    <option value="Portal">Portal Imobiliário</option>
                    <option value="Telefone">Telefone</option>
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
                  <label className="label">Corretor</label>
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
                <label className="label">Observações</label>
                <textarea className="input-field textarea" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Anotações..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveLead}>
                {isEditing ? 'Salvar Alterações' : (<><Plus size={16} /> Cadastrar</>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUp;
