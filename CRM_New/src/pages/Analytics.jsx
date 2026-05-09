import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { TrendingUp, Users, Home, Target, Award } from 'lucide-react';
import './Analytics.css';

const leadsByOrigin = [
  { name: 'WhatsApp', value: 35 },
  { name: 'Meta Ads', value: 28 },
  { name: 'Site', value: 18 },
  { name: 'Indicação', value: 12 },
  { name: 'Portal', value: 7 },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

const conversionFunnel = [
  { stage: 'Leads', count: 124 },
  { stage: 'Contato', count: 98 },
  { stage: 'Interesse', count: 72 },
  { stage: 'Visita', count: 45 },
  { stage: 'Proposta', count: 28 },
  { stage: 'Fechado', count: 12 },
];

const brokerPerformance = [
  { name: 'Admin', leads: 45, fechados: 8, visitas: 22 },
  { name: 'João', leads: 38, fechados: 5, visitas: 18 },
  { name: 'Maria', leads: 32, fechados: 6, visitas: 15 },
  { name: 'Pedro', leads: 28, fechados: 3, visitas: 12 },
];

const monthlyVisits = [
  { month: 'Jan', visitas: 18, propostas: 5 },
  { month: 'Fev', visitas: 22, propostas: 7 },
  { month: 'Mar', visitas: 28, propostas: 9 },
  { month: 'Abr', visitas: 24, propostas: 8 },
  { month: 'Mai', visitas: 35, propostas: 12 },
  { month: 'Jun', visitas: 42, propostas: 15 },
  { month: 'Jul', visitas: 48, propostas: 18 },
];

const closingRate = [
  { month: 'Jan', taxa: 12 },
  { month: 'Fev', taxa: 15 },
  { month: 'Mar', taxa: 18 },
  { month: 'Abr', taxa: 14 },
  { month: 'Mai', taxa: 22 },
  { month: 'Jun', taxa: 25 },
  { month: 'Jul', taxa: 28 },
];

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
  return (
    <div className="analytics-page">
      <div className="page-header-row">
        <div>
          <h1>Dashboard Analítico</h1>
          <p className="text-secondary">Métricas de desempenho e conversão</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card glass-panel animate-fade-in">
          <div className="kpi-icon" style={{ background: 'rgba(59, 130, 246, 0.15)' }}><Users size={22} style={{ color: 'var(--primary)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">124</span>
            <span className="kpi-label">Total de Leads</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}><Target size={22} style={{ color: 'var(--success)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">28%</span>
            <span className="kpi-label">Taxa de Fechamento</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}><Home size={22} style={{ color: 'var(--accent)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">48</span>
            <span className="kpi-label">Visitas no Mês</span>
          </div>
        </div>
        <div className="kpi-card glass-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}><Award size={22} style={{ color: 'var(--warning)' }} /></div>
          <div className="kpi-data">
            <span className="kpi-value">12</span>
            <span className="kpi-label">Vendas Fechadas</span>
          </div>
        </div>
      </div>

      {/* Row 1: Pie + Funnel */}
      <div className="charts-row">
        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3>Leads por Origem</h3>
          <div className="chart-area" style={{ height: 300 }}>
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
          </div>
        </div>

        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <h3>Funil de Conversão</h3>
          <div className="chart-area" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionFunnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'var(--text-secondary)', fontSize: 13 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
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
          <h3>Visitas vs Propostas</h3>
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
                <Area type="monotone" dataKey="propostas" name="Propostas" stroke="var(--accent)" strokeWidth={2} fillOpacity={1} fill="url(#gradPropostas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel glass-panel animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <h3>Taxa de Fechamento (%)</h3>
          <div className="chart-area" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={closingRate}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="taxa" name="Taxa" stroke="var(--neon)" strokeWidth={3} dot={{ fill: 'var(--neon)', r: 5, strokeWidth: 0 }} activeDot={{ r: 7, stroke: 'var(--neon)', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Broker Performance */}
      <div className="chart-panel full-width glass-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <h3>Desempenho de Corretores</h3>
        <div className="chart-area" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={brokerPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{value}</span>} />
              <Bar dataKey="leads" name="Leads" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="visitas" name="Visitas" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fechados" name="Fechados" fill="var(--success)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
