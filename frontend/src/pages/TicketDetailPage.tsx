import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "../auth/useAuth";
import CommentThread from "../components/CommentThread";
import { PriorityBadge, StatusBadge } from "../components/TicketBadges";
import { api, toApiError } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  getTicketControls,
} from "../lib/tickets";
import { useRealtime } from "../lib/useRealtime";
import type {
  Assignee,
  Ticket,
  TicketComment,
  TicketPriority,
  TicketStatus,
  UserRef,
} from "../types";

interface Changes {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: string | null;
}

// The author's own post and the socket event both deliver the same comment
function appendComment(
  list: TicketComment[],
  comment: TicketComment,
): TicketComment[] {
  return list.some((c) => c.id === comment.id) ? list : [...list, comment];
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [staff, setStaff] = useState<Assignee[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    api<{ ticket: Ticket }>(`/tickets/${id}`)
      .then((data) => {
        if (cancelled) return;
        setTicket(data.ticket);
        setLoadError(null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    api<{ comments: TicketComment[] }>(`/tickets/${id}/comments`)
      .then((data) => {
        if (cancelled) return;
        setComments(data.comments);
        setCommentsError(null);
      })
      .catch((err) => {
        if (!cancelled) setCommentsError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  useEffect(() => {
    api<{ assignees: Assignee[] }>("/tickets/assignees")
      .then((data) => setStaff(data.assignees))
      .catch(() => setStaff([]));
  }, []);

  useRealtime((event) => {
    if (event.type === "ticket.updated" && event.ticket.id === id)
      setTicket(event.ticket);
    if (event.type === "comment.created" && event.comment.ticketId === id) {
      setComments((prev) => appendComment(prev, event.comment));
    }
    if (event.type === "tickets.refresh") refresh();
  }, refresh);

  if (!user) return null;

  async function update(changes: Changes) {
    setSaving(true);
    setActionError(null);
    try {
      const data = await api<{ ticket: Ticket }>(`/tickets/${id}`, {
        method: "PATCH",
        body: changes,
      });
      setTicket(data.ticket);
    } catch (err) {
      const apiError = toApiError(err);
      setActionError(apiError.message);
      // The ticket probably changed under us: show the current state
      if (apiError.status === 403 || apiError.status === 409) refresh();
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="center-note">Loading...</p>;
  if (loadError || !ticket) {
    return (
      <>
        <div className="alert">{loadError ?? "Ticket not found"}</div>
        <p>
          <Link to="/">Back to tickets</Link>
        </p>
      </>
    );
  }

  const controls = getTicketControls(user, ticket);
  const statusOptions = [ticket.status, ...controls.statuses];

  // Who can be chosen as assignee depends on the role
  let assigneeOptions: UserRef[] = [];
  if (controls.assignee === "any") assigneeOptions = staff;
  else if (controls.assignee === "self")
    assigneeOptions = [{ id: user.id, name: user.name }];
  if (
    ticket.assignee &&
    !assigneeOptions.some((o) => o.id === ticket.assignee?.id)
  ) {
    assigneeOptions = [ticket.assignee, ...assigneeOptions];
  }

  let hint: string | null = null;
  if (ticket.status === "closed")
    hint = "This ticket is closed and can no longer be changed.";
  else if (user.role === "viewer") hint = "You have read-only access.";

  return (
    <>
      <p className="muted">
        <Link to="/">Back to tickets</Link>
      </p>

      <section className="card section">
        <div className="detail-header">
          <h1>{ticket.title}</h1>
          <div className="detail-badges">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {ticket.overdue && (
              <span className="pill pill-overdue">Overdue</span>
            )}
          </div>
        </div>
        <p className="description">{ticket.description}</p>
        <p className="muted small">
          Created by {ticket.createdBy.name} on {formatDate(ticket.createdAt)} ·
          Last updated {formatDate(ticket.updatedAt)}
        </p>
      </section>

      <section className="card section">
        <h2>Manage</h2>
        {hint && <p className="muted">{hint}</p>}
        {actionError && <div className="alert">{actionError}</div>}
        <div className="manage-grid">
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={ticket.status}
              disabled={controls.statuses.length === 0 || saving}
              onChange={(e) =>
                void update({ status: e.target.value as TicketStatus })
              }
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="priority">Priority</label>
            <select
              id="priority"
              value={ticket.priority}
              disabled={!controls.priority || saving}
              onChange={(e) =>
                void update({ priority: e.target.value as TicketPriority })
              }
            >
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="assignee">Assignee</label>
            <select
              id="assignee"
              value={ticket.assignee?.id ?? ""}
              disabled={controls.assignee === "none" || saving}
              onChange={(e) =>
                void update({ assigneeId: e.target.value || null })
              }
            >
              <option value="">Unassigned</option>
              {assigneeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <CommentThread
        ticket={ticket}
        comments={comments}
        loading={commentsLoading}
        error={commentsError}
        onAdded={(c) => setComments((prev) => appendComment(prev, c))}
      />
    </>
  );
}
