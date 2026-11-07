import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading...</p>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading...</p>;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}
