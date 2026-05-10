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
      // 1. Tenta buscar no banco de dados primeiro (para senhas personalizadas)
      const { data: user, error } = await supabase
        .from('crm_users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (user && user.password === password) {
        onLogin(cleanEmail);
        return;
      }

      // 2. Fallback: Se não encontrou no banco ou a senha não bate, testa a senha padrão '2026'
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        // Opcional: Se logou com a padrão, podemos sugerir a troca
        const newPass = prompt('Você entrou com a senha padrão. Deseja criar uma senha personalizada agora?\n(Cancele para entrar direto)');
        
        if (newPass && newPass !== '2026') {
          // Tenta salvar a nova senha no banco (silenciosamente)
          await supabase.from('crm_users').upsert({ email: cleanEmail, password: newPass }, { onConflict: 'email' });
          alert('Senha personalizada salva! Use-a no próximo login.');
        }
        
        onLogin(cleanEmail);
      } else {
        alert('Dados incorretos. Verifique o e-mail e a senha.');
      }
    } catch (err) {
      // 3. Emergência: Se até o Supabase der erro crítico, o código fixo garante a entrada
      if (password === '2026' && authorizedEmails.includes(cleanEmail)) {
        onLogin(cleanEmail);
      } else {
        alert('Erro de conexão. Tente novamente mais tarde.');
      }
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
