import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { ApiError, fieldError, toApiError } from "../lib/api";

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const forced = user?.mustChangePassword ?? false;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmError(undefined);

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/", { replace: true });
    } catch (err) {
      setError(toApiError(err));
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Change your password"
      subtitle={
        forced
          ? "You are using a temporary password. Choose a new one to continue."
          : "Choose a new password for your account."
      }
      footer={
        forced ? (
          <button
            type="button"
            className="link-button"
            onClick={() => void logout()}
          >
            Log out
          </button>
        ) : (
          <Link to="/">Back to home</Link>
        )
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="alert">{error.message}</div>}
        <FormField
          label={forced ? "Temporary password" : "Current password"}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          error={fieldError(error, "currentPassword")}
          required
        />
        <FormField
          label="New password (min. 8 characters)"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={fieldError(error, "newPassword")}
          required
        />
        <FormField
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmError}
          required
        />
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Change password"}
        </button>
      </form>
    </AuthLayout>
  );
}
