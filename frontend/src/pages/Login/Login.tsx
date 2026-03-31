import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

export function Login() {
  const { login, accessToken, initializing } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('lucas@email.com');
  const [password, setPassword] = useState('Juliana21!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && accessToken) {
      navigate('/', { replace: true });
    }
  }, [accessToken, initializing, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-badge">FinancePro</span>
          <h1>Entrar</h1>
          <p>Acesse seu painel financeiro com segurança.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <span>Não tem conta?</span>
          <Link to="/register">Criar conta</Link>
        </div>

        <div className="login-hint">
          <span>Use o seed padrão: lucas@email.com / Juliana21!</span>
        </div>
      </div>
    </div>
  );
}
