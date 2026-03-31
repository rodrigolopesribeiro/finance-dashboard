import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Target,
  User
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: <LayoutDashboard size={20} />, label: 'Painel' },
  { path: '/transactions', icon: <ArrowRightLeft size={20} />, label: 'Transações' },
  { path: '/incomes', icon: <TrendingUp size={20} />, label: 'Receitas' },
  { path: '/expenses', icon: <TrendingDown size={20} />, label: 'Despesas' },
  { path: '/accounts', icon: <Wallet size={20} />, label: 'Contas' },
  { path: '/cards', icon: <CreditCard size={20} />, label: 'Cartões' },
  { path: '/goals', icon: <Target size={20} />, label: 'Metas' },
  { path: '/profile', icon: <User size={20} />, label: 'Perfil' },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-icon">
          <Wallet color="white" size={22} />
        </div>
        <h1 className="logo-text">FinancePro</h1>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <Link to="/profile" className="user-profile">
          <div className="avatar">{user?.name?.[0] || 'A'}</div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'Usuário Admin'}</span>
            <span className="user-plan">Ver perfil</span>
          </div>
        </Link>
        <button className="logout-button" onClick={logout}>Sair</button>
      </div>
    </aside>
  );
}
