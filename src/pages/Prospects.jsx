import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, UserCheck, ArrowRightCircle, Trash2, X, Phone, Mail, Flame, Leaf, ChevronDown } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Prospects.css';

const CORRETORES = ['Jonata', 'Jorge', 'Gustavo', 'Araujo'];

const PotentialBadge = ({ priority }) => {
  if (priority === 'Alta') {
    return (
      <span className="potential-badge potential-high">
        <Flame size={12} /> Potencial Alto
      </span>
    );
  }
  return (
    <span className="potential-badge potential-medium">
      <Leaf size={12} /> Potencial Médio
    </span>
  );
};

const Prospects = ({ userEmail = '' }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPotential, setFilterPotential] = useState('Todos');
  const [filterCorretor, setFilterCorretor] = useState('Todos');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [promotingId, setPromotingId] = useState(null);
  const [toast, setToast] = useState(null);

  const cleanEmail = (userEmail || '').trim().toLowerCase();
  const isJorge = cleanEmail === 'jorge@allproperty.com';
  const isGustavo = cleanEmail === 'gustavo@allproperty.com';
  const isRestricted = isJorge || isGustavo;

  // Apenas Andre, Araujo e Jonata podem apagar leads
  const canDelete = [
    'andre@allproperty.com',
    'araujo@allproperty.com',
    'jonata@allproperty.com',
  ].includes(cleanEmail);

  // Apenas Araujo e Andre podem atribuir corretores
  const canAssign = !isRestricted;

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    let query = supabase
      .from('leads')
      .select('*')
      .eq('stage_id', 'prospect')
      .order('created_at', { ascending: false });

    if (isJorge) query = query.eq('assigned_to', 'Jorge');
    if (isGustavo) query = query.eq('assigned_to', 'Gustavo');

    const { data, error } = await query;
    if (!error) setLeads(data || []);
    setLoading(false);
  }, [isJorge, isGustavo]);

  useEffect(() => {
    fetchLeads();

    const channel = supabase
      .channel('prospects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchLeads]);

  const handleAssign = async (leadId, corretor) => {
    setSavingId(leadId);
    const { error } = await supabase
      .from('leads')
      .update({ assigned_to: corretor || null })
      .eq('id', leadId);

    if (!error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to: corretor } : l));
      showToast(`Lead atribuído a ${corretor || 'nenhum corretor'}.`);
    } else {
      showToast('Erro ao atribuir lead.', 'error');
    }
    setSavingId(null);
  };

  const handlePromote = async (leadId) => {
    setPromotingId(leadId);
    const { error } = await supabase
      .from('leads')
      .update({ stage_id: 'col-1' })
      .eq('id', leadId);

    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      showToast('Lead enviado para o Funil! ✅');
    } else {
      showToast('Erro ao mover lead.', 'error');
    }
    setPromotingId(null);
  };

  const handleDelete = async (leadId) => {
    const { error } = await supabase.from('leads').delete().eq('id', leadId);
    if (!error) {
      setLeads(prev => prev.filter(l => l.id !== leadId));
      showToast('Lead excluído.');
    } else {
      showToast('Erro ao excluir.', 'error');
    }
    setShowDeleteConfirm(null);
  };

  const openWhatsApp = (phone) => {
    const clean = String(phone).replace(/\D/g, '');
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  const filtered = leads.filter(lead => {
    const matchSearch =
      !search ||
      (lead.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (lead.phone || '').includes(search) ||
      (lead.email || '').toLowerCase().includes(search.toLowerCase());

    const matchPotential =
      filterPotential === 'Todos' ||
      (filterPotential === 'Alto' && lead.priority === 'Alta') ||
      (filterPotential === 'Médio' && lead.priority === 'Média');

    const matchCorretor =
      filterCorretor === 'Todos' ||
      (filterCorretor === 'Sem Corretor' && !lead.assigned_to) ||
      lead.assigned_to === filterCorretor;

    return matchSearch && matchPotential && matchCorretor;
  });

  if (loading) {
    return (
      <div className="prospects-loading">
        <div className="loader"></div>
        <p>Carregando fila de prospecção...</p>
      </div>
    );
  }

  return (
    <div className="prospects-page">
      {/* Toast */}
      {toast && (
        <div className={`prospects-toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="prospects-header">
        <div className="prospects-header-info">
          <h1>Fila de Prospecção</h1>
          <p className="text-secondary">
            {filtered.length} lead{filtered.length !== 1 ? 's' : ''} de {leads.length} total — leads frios para distribuição e contato
          </p>
        </div>
      </header>

      {/* Filters */}
      <div className="prospects-filters">
        <div className="filter-search-wrapper">
          <Search size={16} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="filter-clear-btn" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="filter-group">
          <Filter size={14} />
          <select value={filterPotential} onChange={e => setFilterPotential(e.target.value)}>
            <option value="Todos">Todos os potenciais</option>
            <option value="Alto">🔥 Potencial Alto</option>
            <option value="Médio">🌿 Potencial Médio</option>
          </select>
        </div>

        {!isRestricted && (
          <div className="filter-group">
            <UserCheck size={14} />
            <select value={filterCorretor} onChange={e => setFilterCorretor(e.target.value)}>
              <option value="Todos">Todos os corretores</option>
              <option value="Sem Corretor">Sem corretor</option>
              {CORRETORES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats bar */}
      {!isRestricted && (
        <div className="prospects-stats">
          <div className="stat-chip stat-alto">
            <Flame size={13} />
            {leads.filter(l => l.priority === 'Alta').length} Potencial Alto
          </div>
          <div className="stat-chip stat-medio">
            <Leaf size={13} />
            {leads.filter(l => l.priority === 'Média').length} Potencial Médio
          </div>
          <div className="stat-chip stat-sem">
            <UserCheck size={13} />
            {leads.filter(l => !l.assigned_to).length} Sem corretor
          </div>
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="prospects-empty">
          <Search size={48} strokeWidth={1.5} />
          <h3>Nenhum lead encontrado</h3>
          <p>Tente ajustar os filtros ou aguarde a importação dos dados.</p>
        </div>
      ) : (
        <div className="prospects-table-wrapper">
          <table className="prospects-table">
            <thead>
              <tr>
                <th>Potencial</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>E-mail</th>
                {!isRestricted && <th>Corretor Responsável</th>}
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(lead => (
                <tr key={lead.id} className="prospects-row">
                  <td>
                    <PotentialBadge priority={lead.priority} />
                  </td>
                  <td className="lead-name-cell">
                    <span className="lead-name-text">{lead.name}</span>
                    {lead.assigned_to && isRestricted && (
                      <span className="assigned-tag">👤 {lead.assigned_to}</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="phone-btn"
                      onClick={() => openWhatsApp(lead.phone)}
                      title="Abrir WhatsApp"
                    >
                      <Phone size={13} />
                      {lead.phone}
                    </button>
                  </td>
                  <td className="email-cell">
                    {lead.email ? (
                      <a href={`mailto:${lead.email}`} className="email-link">
                        <Mail size={13} />
                        {lead.email}
                      </a>
                    ) : (
                      <span className="no-data">—</span>
                    )}
                  </td>

                  {!isRestricted && (
                    <td className="assign-cell">
                      <div className="assign-select-wrapper">
                        <select
                          value={lead.assigned_to || ''}
                          onChange={e => handleAssign(lead.id, e.target.value)}
                          disabled={savingId === lead.id}
                          className={`assign-select ${lead.assigned_to ? 'has-value' : ''}`}
                        >
                          <option value="">— Atribuir —</option>
                          {CORRETORES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="select-icon" />
                      </div>
                    </td>
                  )}

                  <td className="date-cell">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </td>

                  <td className="actions-cell">
                    {/* Todos os corretores podem enviar para o Funil */}
                    <button
                      className="action-promote"
                      onClick={() => handlePromote(lead.id)}
                      disabled={promotingId === lead.id}
                      title="Enviar para o Funil de Vendas"
                    >
                      <ArrowRightCircle size={15} />
                      {promotingId === lead.id ? '...' : 'Funil'}
                    </button>

                    {/* Apenas Andre, Araujo e Jonata podem excluir */}
                    {canDelete && (
                      <button
                        className="action-delete"
                        onClick={() => setShowDeleteConfirm(lead.id)}
                        title="Excluir lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirm Modal */}
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

export default Prospects;
