import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderSync, Clock, Home, Calendar as CalendarIcon, BarChart3, LogOut, Menu, X, Key } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Layout.css';

const Layout = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/leads', name: 'Funil de Leads', icon: <FolderSync size={20} /> },
    { path: '/follow-up', name: 'Follow-Up', icon: <Clock size={20} /> },
    { path: '/properties', name: 'Imóveis', icon: <Home size={20} /> },
    { path: '/calendar', name: 'Agenda', icon: <CalendarIcon size={20} /> },
    { path: '/analytics', name: 'Analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="layout-container">
      {/* Mobile Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      {/* Sidebar */}
      <aside className={`sidebar glass-panel ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src="/images/logo.png" alt="All Property" className="logo-icon-img" />
            <span className="text-gradient">All Property</span>
          </div>
          <button className="close-btn d-md-none" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path} 
              className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={async () => {
            let email = localStorage.getItem('userEmail');
            if (!email) {
              email = prompt('Confirme seu E-MAIL profissional:');
              if (email) localStorage.setItem('userEmail', email.trim().toLowerCase());
            }
            if (!email) return;

            const currentPass = prompt('Digite sua SENHA ATUAL (ou a padrão 2026):');
            if (!currentPass) return;
            
            const newPass = prompt('Digite sua NOVA SENHA:');
            if (!newPass || newPass.length < 4) return alert('Senha muito curta.');

            try {
              const { data: user } = await supabase.from('crm_users').select('password').eq('email', email.trim().toLowerCase()).maybeSingle();
              const isValid = (currentPass === '2026') || (user && user.password === currentPass);

              if (isValid) {
                await supabase.from('crm_users').upsert({ email: email.trim().toLowerCase(), password: newPass }, { onConflict: 'email' });
                alert('SENHA ALTERADA COM SUCESSO!');
              } else {
                alert('A senha atual está incorreta.');
              }
            } catch (err) {
              alert('Erro ao conectar com o banco.');
            }
          }}>
            <span className="nav-icon"><Key size={20} /></span>
            <span className="nav-text">Alterar Senha</span>
          </button>
          
          <button className="nav-item text-danger" onClick={handleLogout}>
            <span className="nav-icon"><LogOut size={20} /></span>
            <span className="nav-text">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header glass-panel">
          <div className="header-left">
            <button className="menu-btn d-md-none" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h2>{navItems.find(item => item.path === window.location.pathname)?.name || 'Dashboard'}</h2>
          </div>
          <div className="header-right">
            <div className="user-profile">
              <img src="/images/admin-avatar.png" alt="Admin" className="avatar-img" />
              <div className="user-info">
                <span className="user-name">Admin</span>
                <span className="user-role">Corretor</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-area animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
