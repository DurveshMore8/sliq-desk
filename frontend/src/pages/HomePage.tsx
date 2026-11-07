import { useAuth } from "../auth/useAuth";

export default function HomePage() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <header className="topbar">
        <strong>SliqDesk</strong>
        <div className="topbar-right">
          <span className="muted">{user.organization.name}</span>
          <span className="badge">{user.role}</span>
          <button className="btn" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </header>
      <main className="container">
        <div className="card">
          <h1>Hello, {user.name}</h1>
          <p className="muted">
            You are logged in as {user.email}. Tickets and members will appear
            here.
          </p>
        </div>
      </main>
    </>
  );
}
