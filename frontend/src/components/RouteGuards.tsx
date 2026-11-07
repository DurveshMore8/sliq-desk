import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/useAuth";
import { canManageMembers } from "../lib/roles";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="center-note">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center-note">Loading...</p>;
  return user ? <Navigate to="/" replace /> : <Outlet />;
}

export function AdminRoute() {
  const { user } = useAuth();
  return user && canManageMembers(user.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
