import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LeadsProvider } from './context/LeadsContext';
import { PropertiesProvider } from './context/PropertiesContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LeadsKanban from './pages/LeadsKanban';
import FollowUp from './pages/FollowUp';
import Properties from './pages/Properties';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import Prospects from './pages/Prospects';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('userEmail') || '');

  useEffect(() => {
    const auth = localStorage.getItem('allPropertyAuth');
    if (auth) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (email) => {
    localStorage.setItem('allPropertyAuth', 'true');
    localStorage.setItem('userEmail', email);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('allPropertyAuth');
    localStorage.removeItem('userEmail');
    setUserEmail('');
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <PropertiesProvider>
        <LeadsProvider userEmail={userEmail}>
          <Routes>
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : <Login onLogin={(email) => handleLogin(email)} />
            } />
            
            <Route path="/*" element={
              isAuthenticated ? (
                <Layout onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/leads" element={<LeadsKanban />} />
                    <Route path="/prospects" element={<Prospects userEmail={userEmail} />} />
                    <Route path="/follow-up" element={<FollowUp />} />
                    <Route path="/properties" element={<Properties />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            } />
          </Routes>
        </LeadsProvider>
      </PropertiesProvider>
    </Router>
  );
}

export default App;
