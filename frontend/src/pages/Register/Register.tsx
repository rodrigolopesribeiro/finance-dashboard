import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Register.css';

export function Register() {
  const { register, accessToken, initializing } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && accessToken) {
      navigate('/', { replace: true });
    }
  }, [accessToken, initializing, navigate]);

  const validate = () => {
    if (!name.trim()) return 'Informe seu nome completo.';
    if (!email.trim()) return 'Informe um e-mail válido.';
    if (password.length < 6) return 'A senha deve ter ao menos 6 caracteres.';
    if (password !== confirmPassword) return 'As senhas não conferem.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      setSuccess('Cadastro realizado! Você já está logado.');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Falha ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-header">
          <span className="register-badge">FinancePro</span>
          <h1>Criar conta</h1>
          <p>Crie sua conta para começar a controlar suas finanças.</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <label>
            Nome completo
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </label>
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
          <label>
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••"
            />
          </label>

          {error && <div className="register-error">{error}</div>}
          {success && <div className="register-success">{success}</div>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>

        <div className="register-footer">
          <span>Já tem conta?</span>
          <Link to="/login">Fazer login</Link>
        </div>
      </div>
    </div>
  );
}
