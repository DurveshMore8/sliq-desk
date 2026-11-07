import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../auth/useAuth";
import { PriorityBadge, StatusBadge } from "../components/TicketBadges";
import { api, toApiError } from "../lib/api";
import { formatDate } from "../lib/format";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  canCreateTicket,
} from "../lib/tickets";
import { useRealtime } from "../lib/useRealtime";
import type { Assignee, Pagination, Ticket } from "../types";

const PAGE_SIZE = 10;

export default function TicketsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const priority = params.get("priority") ?? "";
  const assignee = params.get("assigneeId") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [staff, setStaff] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const qs = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (status) qs.set("status", status);
    if (priority) qs.set("priority", priority);
    if (assignee) qs.set("assigneeId", assignee);

    api<{ tickets: Ticket[]; pagination: Pagination }>(`/tickets?${qs}`)
      .then((data) => {
        if (cancelled) return;
        setTickets(data.tickets);
        setPagination(data.pagination);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(toApiError(err).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, priority, assignee, page, refreshKey]);

  useEffect(() => {
    api<{ assignees: Assignee[] }>("/tickets/assignees")
      .then((data) => setStaff(data.assignees))
      .catch(() => setStaff([]));
  }, []);

  useRealtime((event) => {
    if (event.type !== "comment.created") refresh();
  }, refresh);

  if (!user) return null;

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  function goToPage(target: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(target));
    setParams(next);
  }

  const hasFilters = Boolean(status || priority || assignee);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="muted">
            Everything in {user.organization.name}, updated live.
          </p>
        </div>
        {canCreateTicket(user) && (
          <Link to="/tickets/new" className="btn btn-primary btn-link">
            New ticket
          </Link>
        )}
      </div>

      <section className="card section">
        <div className="filters">
          <div className="field">
            <label htmlFor="filterStatus">Status</label>
            <select
              id="filterStatus"
              value={status}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="">All</option>
              {TICKET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filterPriority">Priority</label>
            <select
              id="filterPriority"
              value={priority}
              onChange={(e) => setFilter("priority", e.target.value)}
            >
              <option value="">All</option>
              {TICKET_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="filterAssignee">Assignee</label>
            <select
              id="filterAssignee"
              value={assignee}
              onChange={(e) => setFilter("assigneeId", e.target.value)}
            >
              <option value="">Anyone</option>
              <option value="me">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {hasFilters && (
            <div className="field">
              <button
                className="btn"
                onClick={() => setParams(new URLSearchParams())}
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="muted">Loading tickets...</p>
        ) : error ? (
          <div className="alert">{error}</div>
        ) : tickets.length === 0 ? (
          <p className="muted">
            {hasFilters ? "No tickets match these filters." : "No tickets yet."}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Created by</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link to={`/tickets/${t.id}`} className="ticket-link">
                        {t.title}
                      </Link>
                      {t.overdueAt && (
                        <span className="pill pill-overdue">Overdue</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td>
                      {t.assignee ? (
                        t.assignee.name
                      ) : (
                        <span className="muted">Unassigned</span>
                      )}
                    </td>
                    <td>{t.createdBy.name}</td>
                    <td>{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.total > 0 && (
          <div className="pagination">
            <span className="muted">
              Page {pagination.page} of {Math.max(1, pagination.totalPages)} (
              {pagination.total} {pagination.total === 1 ? "ticket" : "tickets"}
              )
            </span>
            <div className="actions">
              <button
                className="btn btn-small"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-small"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
