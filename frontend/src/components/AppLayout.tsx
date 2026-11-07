import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";
import { ROLE_LABELS, canManageMembers } from "../lib/roles";
import { RealtimeProvider } from "../realtime/RealtimeProvider";
import OverdueAlerts from "./OverdueAlerts";

export default function AppLayout() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <RealtimeProvider>
      <header className="topbar">
        <div className="topbar-left">
          <strong>SliqDesk</strong>
          <nav className="nav">
            <NavLink to="/" end>
              Tickets
            </NavLink>
            {canManageMembers(user.role) && (
              <NavLink to="/members">Members</NavLink>
            )}
          </nav>
        </div>
        <div className="topbar-right">
          <span className="muted">{user.organization.name}</span>
          <span className="badge">{ROLE_LABELS[user.role]}</span>
          <Link to="/change-password">Change password</Link>
          <button className="btn" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <OverdueAlerts />
    </RealtimeProvider>
  );
}
