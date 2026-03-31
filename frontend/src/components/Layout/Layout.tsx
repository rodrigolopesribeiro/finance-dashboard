import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout-wrapper">
      <Sidebar />
      <main className="main-content">
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
