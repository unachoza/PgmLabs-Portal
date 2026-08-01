import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AppShell.css';

const NAV_BY_ROLE = {
  participant: [
    { to: '/', label: 'My Profile', end: true },
    { to: '/checkins', label: 'Check-ins' },
    { to: '/surveys', label: 'Surveys' },
    { to: '/history', label: 'Communication History' },
  ],
  admin: [
    { to: '/', label: 'Participants', end: true },
    { to: '/checkins', label: 'Check-ins' },
    { to: '/surveys', label: 'Surveys' },
    { to: '/responses', label: 'Responses' },
    { to: '/funder-updates', label: 'Funder Comms' },
    { to: '/campaigns', label: 'Marketing' },
  ],
  funder: [
    { to: '/', label: 'Dashboard', end: true },
    { to: '/updates', label: 'Program Updates' },
  ],
} as const;

export function AppShell() {
  const { profile, signOut } = useAuth();
  if (!profile) return null;

  const links = NAV_BY_ROLE[profile.role];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">Accelerator Portal</div>
        <nav aria-label="Primary">
          <ul className="app-nav-list">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={'end' in link ? link.end : false}
                  className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="app-sidebar-footer">
          <div className="app-user-name">{profile.name}</div>
          <div className="app-user-role">{profile.role}</div>
          <button className="btn btn-secondary btn-sm" onClick={signOut}>
            Log out
          </button>
        </div>
      </aside>
      <main className="app-content" id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
