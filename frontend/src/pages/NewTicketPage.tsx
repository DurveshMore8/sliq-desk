import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";
import { FormField } from "../components/FormField";
import { ApiError, api, fieldError, toApiError } from "../lib/api";
import {
  PRIORITY_LABELS,
  TICKET_PRIORITIES,
  canCreateTicket,
} from "../lib/tickets";
import type { Ticket, TicketPriority } from "../types";

export default function NewTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [error, setError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;
  // Viewers cannot create tickets (the server enforces this too)
  if (!canCreateTicket(user)) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api<{ ticket: Ticket }>("/tickets", {
        method: "POST",
        body: { title, description, priority },
      });
      navigate(`/tickets/${data.ticket.id}`);
    } catch (err) {
      setError(toApiError(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1>New ticket</h1>
      <p className="muted">
        <Link to="/">Back to tickets</Link>
      </p>
      <section className="card section narrow">
        <form onSubmit={handleSubmit} noValidate>
          {error && <div className="alert">{error.message}</div>}
          <FormField
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            error={fieldError(error, "title")}
            maxLength={200}
            required
          />
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={fieldError(error, "description") ? true : undefined}
              maxLength={5000}
              required
            />
            {fieldError(error, "description") && (
              <span className="field-error">
                {fieldError(error, "description")}
              </span>
            )}
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create ticket"}
          </button>
        </form>
      </section>
    </>
  );
}
