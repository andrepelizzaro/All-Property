import { useState } from 'react';
import { Plus, Search, MapPin, DollarSign, Home, Edit2, Eye, Trash2, X, Image } from 'lucide-react';
import { useProperties } from '../context/PropertiesContext';
import './Properties.css';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);
};

const Properties = () => {
  const { properties, addProperty, updateProperty, deleteProperty } = useProperties();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '', price: '', location: '', type: 'Apartamento',
    status: 'Disponível', description: '', broker: 'Admin', bedrooms: '', area: ''
  });

  const types = ['Todos', 'Apartamento', 'Casa', 'Cobertura', 'Comercial', 'Terreno'];
  const statuses = ['Todos', 'Disponível', 'Reservado', 'Vendido'];

  const filtered = properties.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === 'Todos' || p.type === filterType;
    const matchStatus = filterStatus === 'Todos' || p.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const openNew = () => {
    setEditingProperty(null);
    setFormData({ title: '', price: '', location: '', type: 'Apartamento', status: 'Disponível', description: '', broker: 'Admin', bedrooms: '', area: '' });
    setShowModal(true);
  };

  const openEdit = (prop) => {
    setEditingProperty(prop);
    setFormData({ ...prop, price: String(prop.price), bedrooms: String(prop.bedrooms), area: String(prop.area) });
    setShowModal(true);
  };

  const handleSave = async () => {
    const data = { ...formData, price: Number(formData.price), bedrooms: Number(formData.bedrooms), area: Number(formData.area) };
    if (editingProperty) {
      await updateProperty(editingProperty.id, data);
    } else {
      await addProperty(data);
    }
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      await deleteProperty(id);
    }
  };

  const statusClass = (status) => {
    if (status === 'Disponível') return 'badge-success';
    if (status === 'Reservado') return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <div className="properties-page">
      <div className="page-header-row">
        <div>
          <h1>Imóveis</h1>
          <p className="text-secondary">Gerencie seu portfólio de imóveis</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Novo Imóvel
        </button>
      </div>

      <div className="filters-bar glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Buscar imóveis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {types.map(t => (
            <button key={t} className={`pill ${filterType === t ? 'active' : ''}`} onClick={() => setFilterType(t)}>{t}</button>
          ))}
        </div>
        <div className="filter-pills">
          {statuses.map(s => (
            <button key={s} className={`pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="properties-grid">
        {filtered.map(prop => (
          <div key={prop.id} className="property-card glass-panel animate-fade-in">
            <div className="property-image-placeholder">
              <Image size={40} />
              <span>Galeria</span>
            </div>
            <div className="property-info">
              <div className="property-top-row">
                <span className={`badge ${statusClass(prop.status)}`}>{prop.status}</span>
                <span className="property-type-tag">{prop.type}</span>
              </div>
              <h3 className="property-title">{prop.title}</h3>
              <div className="property-location">
                <MapPin size={14} /> {prop.location}
              </div>
              <p className="property-desc">{prop.description}</p>
              <div className="property-specs">
                {prop.bedrooms > 0 && <span>{prop.bedrooms} quartos</span>}
                <span>{prop.area}m²</span>
              </div>
              <div className="property-footer">
                <div className="property-price">
                  <DollarSign size={16} /> {formatCurrency(prop.price)}
                </div>
                <div className="property-actions">
                  <button className="btn-icon-small" onClick={() => openEdit(prop)} title="Editar"><Edit2 size={14} /></button>
                  <button className="btn-icon-small danger" onClick={() => handleDelete(prop.id)} title="Excluir"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state glass-panel">
          <Home size={48} />
          <h3>Nenhum imóvel encontrado</h3>
          <p className="text-secondary">Ajuste os filtros ou cadastre um novo imóvel</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProperty ? 'Editar Imóvel' : 'Novo Imóvel'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Título</label>
                  <input className="input-field" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Ex: Apt 302 Lumiere" />
                </div>
                <div className="form-group">
                  <label className="label">Preço (R$)</label>
                  <input className="input-field" type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="850000" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Localização</label>
                  <input className="input-field" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Bairro, Cidade - UF" />
                </div>
                <div className="form-group">
                  <label className="label">Tipo</label>
                  <select className="input-field" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                    {types.filter(t => t !== 'Todos').map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="label">Quartos</label>
                  <input className="input-field" type="number" value={formData.bedrooms} onChange={(e) => setFormData({...formData, bedrooms: e.target.value})} placeholder="3" />
                </div>
                <div className="form-group">
                  <label className="label">Área (m²)</label>
                  <input className="input-field" type="number" value={formData.area} onChange={(e) => setFormData({...formData, area: e.target.value})} placeholder="142" />
                </div>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="input-field" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                    {statuses.filter(s => s !== 'Todos').map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Descrição</label>
                <textarea className="input-field textarea" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Descreva o imóvel..." rows={3} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {editingProperty ? 'Salvar Alterações' : 'Cadastrar Imóvel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Properties;
