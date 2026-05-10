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
    
    try {
      const { data: user, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error || !user) {
        alert('E-mail não autorizado ou não encontrado!');
      } else if (user.password === password) {
        // Se a senha for a padrão, obriga a troca antes de entrar
        if (password === '2026') {
          const newPass = prompt('Você ainda está usando a senha padrão (2026).\nPor favor, digite uma NOVA senha personalizada para sua segurança:');
          
          if (!newPass || newPass === '2026') {
            alert('Você precisa definir uma nova senha diferente de 2026 para continuar.');
            setLoading(false);
            return;
          }

          // Atualiza a senha no banco antes de logar
          const { error: updateError } = await supabase
            .from('crm_users')
            .update({ password: newPass })
            .eq('email', email.toLowerCase());

          if (updateError) {
            alert('Erro ao atualizar sua senha. Tente novamente.');
            setLoading(false);
            return;
          }
          
          alert('Senha personalizada salva com sucesso! Bem-vindo.');
        }
        
        onLogin(email.toLowerCase());
      } else {
        alert('Senha incorreta!');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      alert('Erro ao conectar com o servidor. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newPass = prompt('Digite sua NOVA senha:');
    if (!newPass) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('crm_users')
        .update({ password: newPass })
        .eq('email', email.toLowerCase())
        .eq('password', password); // Só altera se a senha atual estiver correta

      if (error) {
        alert('Não foi possível alterar a senha. Verifique se o e-mail e a senha atual estão corretos.');
      } else {
        alert('Senha alterada com sucesso!');
        setPassword(newPass);
      }
    } catch (err) {
      alert('Erro ao alterar senha.');
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
