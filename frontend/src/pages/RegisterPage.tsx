import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { ApiError, fieldError } from "../lib/api";

export default function RegisterPage() {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [confirmError, setConfirmError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmError(undefined);

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await signup({ name, email, organizationName, password });
      // On success the route guard redirects to the home page
    } catch (err) {
      setError(
        err instanceof ApiError ? err : new ApiError("Something went wrong", 0),
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your organization"
      subtitle="You will be the owner (superadmin) of the new organization."
      footer={
        <>
          Already have an account? <Link to="/login">Log in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="alert">{error.message}</div>}
        <FormField
          label="Your name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldError(error, "name")}
          required
        />
        <FormField
          label="Organization name"
          name="organizationName"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          error={fieldError(error, "organizationName")}
          required
        />
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldError(error, "email")}
          required
        />
        <FormField
          label="Password (min. 8 characters)"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError(error, "password")}
          required
        />
        <FormField
          label="Confirm password"
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
          {submitting ? "Creating..." : "Create organization"}
        </button>
      </form>
    </AuthLayout>
  );
}
