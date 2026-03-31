import { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { useAuth } from '../../hooks/useAuth';
import { changePassword, updateMe } from '../../services/auth';
import './Profile.css';

export function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    if (!name.trim()) {
      setProfileError('Informe seu nome.');
      return;
    }
    if (!email.trim()) {
      setProfileError('Informe um e-mail válido.');
      return;
    }

    try {
      setProfileLoading(true);
      const updated = await updateMe({
        name: name.trim(),
        email: email.trim(),
      });
      updateUser(updated);
      setProfileMessage('Perfil atualizado com sucesso.');
    } catch (err: any) {
      setProfileError(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha todos os campos de senha.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('A nova senha e a confirmação não coincidem.');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordMessage('Senha atualizada com sucesso.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Erro ao atualizar senha.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div>
          <h1 className="profile-title">Perfil</h1>
          <p className="profile-subtitle">Gerencie seus dados e preferências básicas.</p>
        </div>
      </header>

      <div className="profile-grid">
        <Card className="profile-card" padding="lg">
          <h3>Dados da conta</h3>
          <form className="profile-form" onSubmit={handleProfileSave}>
            <label>
              Nome
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            {profileError && <div className="profile-feedback error">{profileError}</div>}
            {profileMessage && <div className="profile-feedback success">{profileMessage}</div>}

            <button className="btn btn-primary" type="submit" disabled={profileLoading}>
              {profileLoading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </form>
        </Card>

        <Card className="profile-card" padding="lg">
          <h3>Segurança</h3>
          <form className="profile-form" onSubmit={handlePasswordSave}>
            <label>
              Senha atual
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label>
              Nova senha
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label>
              Confirmar nova senha
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {passwordError && <div className="profile-feedback error">{passwordError}</div>}
            {passwordMessage && <div className="profile-feedback success">{passwordMessage}</div>}

            <button className="btn btn-primary" type="submit" disabled={passwordLoading}>
              {passwordLoading ? 'Atualizando...' : 'Atualizar senha'}
            </button>
          </form>
        </Card>
      </div>

      <Card className="profile-card" padding="lg">
        <h3>Saída rápida</h3>
        <p className="profile-muted">
          Encerrar sua sessão atual neste dispositivo.
        </p>
        <button className="profile-logout" onClick={logout}>
          Sair da conta
        </button>
      </Card>
    </div>
  );
}
