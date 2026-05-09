import { 
  Users, Home, Calendar, TrendingUp, DollarSign, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useLeads } from '../context/LeadsContext';
import { useProperties } from '../context/PropertiesContext';
import './Dashboard.css';

const revenueData = [
  { name: 'Jan', value: 0 },
  { name: 'Fev', value: 0 },
  { name: 'Mar', value: 0 },
  { name: 'Abr', value: 0 },
  { name: 'Mai', value: 2400000 },
  { name: 'Jun', value: 0 },
  { name: 'Jul', value: 0 },
];

const leadsData = [
  { name: 'Seg', leads: 2 },
  { name: 'Ter', leads: 4 },
  { name: 'Qua', leads: 3 },
  { name: 'Qui', leads: 1 },
  { name: 'Sex', leads: 5 },
  { name: 'Sáb', leads: 0 },
  { name: 'Dom', leads: 0 },
];

const StatCard = ({ title, value, icon, trend, trendValue }) => (
  <div className="stat-card glass-panel animate-fade-in">
    <div className="stat-header">
      <h3 className="stat-title">{title}</h3>
      <div className="stat-icon-wrapper">{icon}</div>
    </div>
    <div className="stat-value">{value}</div>
    <div className={`stat-trend ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
      {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      <span>{trendValue} vs mês passado</span>
    </div>
  </div>
);

const Dashboard = () => {
  const { leads, columns, followUpLeads } = useLeads();
  const { properties } = useProperties();

  // Real Stats
  const newLeadsCount = columns['col-1']?.leadIds.length || 0;
  const visitsCount = columns['col-4']?.leadIds.length || 0;
  const closedCount = columns['col-7']?.leadIds.length || 0;
  const availableProperties = properties.filter(p => p.status === 'Disponível').length;

  const recentLeads = Object.values(leads).slice(-5).reverse();
  const upcomingVisits = Object.values(leads)
    .filter(l => l.scheduledDate)
    .slice(0, 3);

  const formatPrice = (p) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <StatCard 
          title="Novos Leads" 
          value={newLeadsCount} 
          icon={<Users size={20} className="text-primary-light" />} 
          trend="up" 
          trendValue="+100%" 
        />
        <StatCard 
          title="Visitas Agendadas" 
          value={visitsCount} 
          icon={<Calendar size={20} className="text-neon" />} 
          trend="up" 
          trendValue="+20%" 
        />
        <StatCard 
          title="Imóveis Disponíveis" 
          value={availableProperties} 
          icon={<Home size={20} className="text-warning" />} 
          trend="up" 
          trendValue="+2%" 
        />
        <StatCard 
          title="Negócios Fechados" 
          value={closedCount} 
          icon={<DollarSign size={20} className="text-success" />} 
          trend="up" 
          trendValue="+5%" 
        />
      </div>

      <div className="charts-grid mt-4">
        <div className="chart-card glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3>Receita Projetada</h3>
            <button className="btn-icon"><MoreHorizontal size={20} /></button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000000}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value) => formatPrice(value)}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3>Atividade Semanal</h3>
            <button className="btn-icon"><MoreHorizontal size={20} /></button>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar dataKey="leads" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="lists-grid mt-4">
        <div className="list-card glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3>Leads Recentes</h3>
            <a href="/leads" className="view-all">Ver todos</a>
          </div>
          <div className="list-content">
            {recentLeads.length > 0 ? recentLeads.map((lead) => (
              <div key={lead.id} className="list-item">
                <div className="item-avatar">{lead.name[0]}</div>
                <div className="item-details">
                  <h4>{lead.name}</h4>
                  <p>Interesse: {lead.property || 'Não informado'}</p>
                </div>
                <span className="badge badge-primary">Ativo</span>
              </div>
            )) : <p className="text-muted p-4">Nenhum lead cadastrado.</p>}
          </div>
        </div>

        <div className="list-card glass-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3>Próximas Atividades</h3>
            <a href="/calendar" className="view-all">Agenda</a>
          </div>
          <div className="list-content">
            {upcomingVisits.length > 0 ? upcomingVisits.map((lead) => (
              <div key={lead.id} className="list-item">
                <div className="date-box">
                  <span className="date-month">MAI</span>
                  <span className="date-day">{lead.scheduledDate.split('-')[2]}</span>
                </div>
                <div className="item-details">
                  <h4>{lead.scheduledAction || 'Atividade'}</h4>
                  <p>{lead.name} - {lead.scheduledTime || 'Horário não definido'}</p>
                </div>
                <button className="btn-icon-small"><ArrowUpRight size={16} /></button>
              </div>
            )) : <p className="text-muted p-4">Nenhuma atividade agendada.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
