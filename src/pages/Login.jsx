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
      // 1. Tenta buscar no banco de dados
      const { data: user, error } = await supabase
        .from('crm_users')
        .select('password')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (error) {
        console.error('Erro ao ler banco de dados:', error);
      }

      // Se encontrou o usuário no banco e a senha bate
      if (user && user.password === password) {
        onLogin(cleanEmail);
        return;
      }

      // 2. Se não bateu no banco, tenta a senha mestre '2026'
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        onLogin(cleanEmail);
        return;
      }

      // 3. Se chegou aqui, os dados estão realmente errados
      alert('E-mail ou senha incorretos.');

    } catch (err) {
      // Emergência total
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        onLogin(cleanEmail);
      } else {
        alert('Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const newPass = prompt('Digite sua NOVA senha personalizada:');
    if (!newPass || newPass.length < 4) return alert('A senha deve ter pelo menos 4 caracteres.');
    
    setLoading(true);
    try {
      // Usa UPSERT para garantir que o registro exista ou seja atualizado
      const { error } = await supabase
        .from('crm_users')
        .upsert({ email: cleanEmail, password: newPass }, { onConflict: 'email' });

      if (error) {
        console.error('Erro ao salvar senha:', error);
        alert('Não foi possível salvar a nova senha no banco de dados.');
      } else {
        alert('Senha alterada com sucesso! Use-a no seu próximo acesso.');
        setPassword(newPass);
      }
    } catch (err) {
      alert('Erro de conexão ao tentar alterar a senha.');
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
