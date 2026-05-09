import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Users, Home, Target, Award } from 'lucide-react';
import { useLeads } from '../context/LeadsContext';
import { useProperties } from '../context/PropertiesContext';
import './Analytics.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const tooltipStyle = {
  contentStyle: { backgroundColor: 'rgba(25, 28, 41, 0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' },
  itemStyle: { color: '#f0f2f5' },
  labelStyle: { color: '#a0a8b8' },
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={tooltipStyle.contentStyle}>
        <p style={{ ...tooltipStyle.labelStyle, margin: '0 0 8px', padding: '8px 12px 0' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: 0, padding: '4px 12px', fontSize: '0.85rem' }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Analytics = () => {
  const { leads, columns } = useLeads();
  const { properties } = useProperties();

  const allLeadsArr = Object.values(leads);
  const totalLeads = allLeadsArr.length;
  
  // Leads by Origin
  const originCounts = allLeadsArr.reduce((acc, lead) => {
    const src = lead.source || 'Outro';
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {});
  
  const leadsByOrigin = Object.keys(originCounts).map(name => ({
    name,
    value: originCounts[name]
  }));

  // Funnel Data
  const conversionFunnel = [
    { stage: 'Entrada', count: columns['col-1']?.leadIds.length || 0 },
    { stage: 'Contato', count: columns['col-2']?.leadIds.length || 0 },
    { stage: 'Interesse', count: columns['col-3']?.leadIds.length || 0 },
    { stage: 'Visita', count: columns['col-4']?.leadIds.length || 0 },
    { stage: 'Negociação', count: columns['col-6']?.leadIds.length || 0 },
    { stage: 'Fechado', count: columns['col-7']?.leadIds.length || 0 },
  ];

  // Placeholder time series (since we don't have historical data yet)
  const monthlyVisits = [
    { month: 'Jan', visitas: 0, propostas: 0 },
    { month: 'Fev', visitas: 0, propostas: 0 },
    { month: 'Mar', visitas: 0, propostas: 0 },
    { month: 'Abr', visitas: 0, propostas: 0 },
    { month: 'Mai', visitas: conversionFunnel[3].count, propostas: conversionFunnel[4].count },
    { month: 'Jun', visitas: 0, propostas: 0 },
    { month: 'Jul', visitas: 0, propostas: 0 },
  ];

  const closingRateValue = totalLeads > 0 ? Math.round((conversionFunnel[5].count / totalLeads) * 100) : 0;

  return (
    <div className="analytics-page">
      <div className="page-header-row">
        <div>
          <h1>Dashboard Analítico</h1>
          <p className="text-secondary">Métricas reais baseadas no seu uso atual</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel animate-fade-in">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}><Users size={22} style={{ color: 'var(--primary)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">{totalLeads}</span>
            <span className="kpi-label">Total de Leads</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}><Target size={22} style={{ color: 'var(--success)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">{closingRateValue}%</span>
            <span className="kpi-label">Taxa de Conversão</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}><Home size={22} style={{ color: 'var(--accent)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">{conversionFunnel[3].count}</span>
            <span className="kpi-label">Visitas Ativas</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}><Award size={22} style={{ color: 'var(--warning)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">{conversionFunnel[5].count}</span>
            <span className="kpi-label">Vendas Fechadas</span>
          </div>
        </div>
      </div>

      {/* Row 1: Pie + Funnel */}
      <div className="charts-row">
        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3>Leads por Origem</h3>
          <div className="chart-area" style={{ height: 300 }}>
            {leadsByOrigin.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsByOrigin}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={110}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {leadsByOrigin.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted p-8 text-center">Sem dados de origem</p>}
          </div>
        </div>

        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h3>Funil de Conversão</h3>
          <div className="chart-area" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Leads" radius={[0, 6, 6, 0]}>
                  {conversionFunnel.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Visits + Closing Rate */}
      <div className="charts-row">
        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3>Visitas vs Negociações</h3>
          <div className="chart-area" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyVisits}>
                <defs>
                  <linearGradient id="gradVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPropostas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>} />
                <Area type="monotone" dataKey="visitas" name="Visitas" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#gradVisitas)" />
                <Area type="monotone" dataKey="propostas" name="Negociações" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#gradPropostas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h3>Desempenho Geral</h3>
          <div className="chart-area" style={{ height: 300 }}>
            <div className="stats-list">
              <div className="stat-row">
                <span>Imóveis no Portfólio</span>
                <strong>{properties.length}</strong>
              </div>
              <div className="stat-row">
                <span>Leads sem Contato</span>
                <strong>{columns['col-1']?.leadIds.length || 0}</strong>
              </div>
              <div className="stat-row">
                <span>Ticket Médio (Imóveis)</span>
                <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(properties.reduce((a, b) => a + b.price, 0) / (properties.length || 1))}</strong>
              </div>
              <div className="stat-row">
                <span>Leads em Follow-up</span>
                <strong>{allLeadsArr.filter(l => l.inFollowUp).length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
