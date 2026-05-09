import { useState } from 'react';
import { 
  Users, Home, Calendar, TrendingUp, DollarSign, 
  ArrowUpRight, ArrowDownRight, MoreHorizontal 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './Dashboard.css';

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Fev', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Abr', value: 2780 },
  { name: 'Mai', value: 6890 },
  { name: 'Jun', value: 8390 },
  { name: 'Jul', value: 10490 },
];

const leadsData = [
  { name: 'Seg', leads: 12 },
  { name: 'Ter', leads: 19 },
  { name: 'Qua', leads: 15 },
  { name: 'Qui', leads: 22 },
  { name: 'Sex', leads: 28 },
  { name: 'Sáb', leads: 10 },
  { name: 'Dom', leads: 5 },
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
  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <StatCard 
          title="Novos Leads" 
          value="124" 
          icon={<Users size={20} className="text-primary-light" />} 
          trend="up" 
          trendValue="+14%" 
        />
        <StatCard 
          title="Visitas Agendadas" 
          value="32" 
          icon={<Calendar size={20} className="text-neon" />} 
          trend="up" 
          trendValue="+5%" 
        />
        <StatCard 
          title="Propostas Abertas" 
          value="18" 
          icon={<TrendingUp size={20} className="text-warning" />} 
          trend="down" 
          trendValue="-2%" 
        />
        <StatCard 
          title="Vendas Convertidas" 
          value="R$ 2.4M" 
          icon={<DollarSign size={20} className="text-success" />} 
          trend="up" 
          trendValue="+28%" 
        />
      </div>

      <div className="charts-grid mt-4">
        <div className="chart-card glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3>Receita Gerada</h3>
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
                <YAxis stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3>Leads da Semana</h3>
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="list-item">
                <div className="item-avatar">{`L${i}`}</div>
                <div className="item-details">
                  <h4>João Silva</h4>
                  <p>Interesse em Casa Alphaville</p>
                </div>
                <span className="badge badge-primary">Novo</span>
              </div>
            ))}
          </div>
        </div>

        <div className="list-card glass-panel animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3>Próximas Visitas</h3>
            <a href="/calendar" className="view-all">Agenda</a>
          </div>
          <div className="list-content">
            {[1, 2, 3].map((i) => (
              <div key={i} className="list-item">
                <div className="date-box">
                  <span className="date-month">MAI</span>
                  <span className="date-day">{10 + i}</span>
                </div>
                <div className="item-details">
                  <h4>Apt 302 - Edifício Lumiere</h4>
                  <p>Com Maria Oliveira às 14:30</p>
                </div>
                <button className="btn-icon-small"><ArrowUpRight size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
