import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { ApiError, api, fieldError, toApiError } from "../lib/api";
import { formatDate } from "../lib/format";
import { ROLE_LABELS } from "../lib/roles";
import { canComment } from "../lib/tickets";
import type { Ticket, TicketComment } from "../types";

interface CommentThreadProps {
  ticket: Ticket;
  comments: TicketComment[];
  loading: boolean;
  error: string | null;
  onAdded: (comment: TicketComment) => void;
}

export default function CommentThread({
  ticket,
  comments,
  loading,
  error,
  onAdded,
}: CommentThreadProps) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [posting, setPosting] = useState(false);

  if (!user) return null;
  const allowed = canComment(user, ticket);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setPosting(true);
    try {
      const data = await api<{ comment: TicketComment }>(
        `/tickets/${ticket.id}/comments`,
        {
          method: "POST",
          body: { body },
        },
      );
      onAdded(data.comment);
      setBody("");
    } catch (err) {
      setFormError(toApiError(err));
    } finally {
      setPosting(false);
    }
  }

  let note: string | null = null;
  if (ticket.status === "closed")
    note = "This ticket is closed. No new comments can be added.";
  else if (user.role === "viewer") note = "Viewers cannot add comments.";
  else if (!allowed) note = "You can only comment on tickets you created.";

  return (
    <section className="card section">
      <h2>Comments ({comments.length})</h2>

      {loading ? (
        <p className="muted">Loading comments...</p>
      ) : error ? (
        <div className="alert">{error}</div>
      ) : comments.length === 0 ? (
        <p className="muted">No comments yet.</p>
      ) : (
        <div>
          {comments.map((c) => (
            <article key={c.id} className="comment">
              <div className="comment-meta">
                <strong>{c.author.name}</strong>
                {c.author.role && (
                  <span className="badge">{ROLE_LABELS[c.author.role]}</span>
                )}
                <span className="muted">{formatDate(c.createdAt)}</span>
              </div>
              <p className="comment-body">{c.body}</p>
            </article>
          ))}
        </div>
      )}

      {allowed ? (
        <form onSubmit={handleSubmit} noValidate className="comment-form">
          {formError && <div className="alert">{formError.message}</div>}
          <div className="field">
            <label htmlFor="commentBody">Add a comment</label>
            <textarea
              id="commentBody"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              aria-invalid={fieldError(formError, "body") ? true : undefined}
              maxLength={2000}
            />
            {fieldError(formError, "body") && (
              <span className="field-error">
                {fieldError(formError, "body")}
              </span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={posting || body.trim() === ""}
          >
            {posting ? "Posting..." : "Post comment"}
          </button>
        </form>
      ) : (
        note && <p className="muted comment-form">{note}</p>
      )}
    </section>
  );
}
