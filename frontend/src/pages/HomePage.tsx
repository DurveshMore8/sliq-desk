import { useAuth } from "../auth/useAuth";

export default function HomePage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="card">
      <h1>Hello, {user.name}</h1>
      <p className="muted">
        You are logged in as {user.email}. Tickets will appear here.
      </p>
    </div>
  );
}
