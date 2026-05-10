import { useState } from 'react';
import { Mail, Lock, ArrowRight, Settings } from 'lucide-react';
import { supabase } from '../supabaseClient';
import './Login.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const cleanEmail = email.trim().toLowerCase();
    const authorizedEmails = ['araujo@allproperty.com', 'andre@allproperty.com', 'jonata@allproperty.com'];
    
    try {
      // 1. Tenta validar no banco de dados DE FORMA DIRETA
      const { data: user } = await supabase
        .from('crm_users')
        .select('password')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (user) {
        if (user.password === password) {
          onLogin(cleanEmail);
          return;
        } else if (password !== '2026') {
          alert('Senha incorreta para este usuário.');
          setLoading(false);
          return;
        }
      }

      // 2. Se não achou no banco OU digitou a 2026, testa o fallback mestre
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        onLogin(cleanEmail);
      } else {
        alert('Usuário não encontrado ou senha incorreta.');
      }
    } catch (err) {
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        onLogin(cleanEmail);
      } else {
        alert('Erro ao conectar com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return alert('Digite seu e-mail antes de alterar a senha.');
    
    const newPass = prompt('Defina sua NOVA SENHA personalizada:');
    if (!newPass || newPass.length < 4) return alert('A senha precisa ter ao menos 4 caracteres.');
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('crm_users')
        .upsert({ email: cleanEmail, password: newPass }, { onConflict: 'email' });

      if (error) throw error;
      alert('SUCESSO! Senha alterada.\nUse esta nova senha no próximo login.');
      setPassword(newPass);
    } catch (err) {
      alert('Erro ao salvar no banco.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
      
      <div className="login-card glass-panel animate-fade-in">
        <div className="login-header">
          <div className="logo-image-wrapper">
            <img src="/images/logo.png" alt="All Property" className="logo-image-large" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label">E-mail Profissional</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={20} />
              <input 
                type="email" 
                className="input-field" 
                placeholder="corretor@allproperty.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-flex">
              <label className="label">Senha</label>
              <button type="button" onClick={handleChangePassword} className="forgot-password" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>Alterar senha?</button>
            </div>
            <div className="input-with-icon">
              <Lock className="input-icon" size={20} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading ? 'Autenticando...' : (
              <>
                Entrar no Workspace <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
