import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { FormField } from "../components/FormField";
import { ApiError, api, fieldError, toApiError } from "../lib/api";
import {
  ASSIGNABLE_ROLES,
  ROLE_LABELS,
  type AssignableRole,
} from "../lib/roles";
import type { Member } from "../types";

interface Notice {
  type: "success" | "warning" | "error";
  text: string;
}

export default function MembersPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AssignableRole>("agent");
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ members: Member[] }>("/members")
      .then((data) => {
        if (!cancelled) setMembers(data.members);
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
  }, []);

  if (!user) return null;

  function replaceMember(updated: Member) {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function act(member: Member, action: () => Promise<void>) {
    setBusyId(member.id);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice({ type: "error", text: toApiError(err).message });
    } finally {
      setBusyId(null);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setNotice(null);
    setAdding(true);
    try {
      const data = await api<{ member: Member; emailSent: boolean }>(
        "/members",
        {
          method: "POST",
          body: { name, email, role },
        },
      );
      setMembers((prev) => [...prev, data.member]);
      setNotice(
        data.emailSent
          ? {
              type: "success",
              text: `${data.member.email} was added and a temporary password was emailed.`,
            }
          : {
              type: "warning",
              text: `${data.member.email} was added, but the email could not be sent. Use "Resend password" to try again.`,
            },
      );
      setName("");
      setEmail("");
      setRole("agent");
    } catch (err) {
      setFormError(toApiError(err));
    } finally {
      setAdding(false);
    }
  }

  function changeRole(member: Member, newRole: AssignableRole) {
    return act(member, async () => {
      const data = await api<{ member: Member }>(`/members/${member.id}/role`, {
        method: "PATCH",
        body: { role: newRole },
      });
      replaceMember(data.member);
      setNotice({
        type: "success",
        text: `${data.member.name} is now ${ROLE_LABELS[data.member.role]}.`,
      });
    });
  }

  async function resendPassword(member: Member) {
    const ok = window.confirm(
      `Send ${member.name} a new temporary password? Their current password will stop working and they will be signed out.`,
    );
    if (!ok) return;
    await act(member, async () => {
      const data = await api<{ member: Member; emailSent: boolean }>(
        `/members/${member.id}/resend-password`,
        { method: "POST" },
      );
      replaceMember(data.member);
      setNotice(
        data.emailSent
          ? {
              type: "success",
              text: `A new temporary password was emailed to ${member.email}.`,
            }
          : {
              type: "warning",
              text: "The password was reset, but the email could not be sent. Try again.",
            },
      );
    });
  }

  async function removeMember(member: Member) {
    const ok = window.confirm(
      `Remove ${member.name}? They will lose access immediately.`,
    );
    if (!ok) return;
    await act(member, async () => {
      await api(`/members/${member.id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      setNotice({ type: "success", text: `${member.name} was removed.` });
    });
  }

  return (
    <>
      <h1>Members</h1>
      <p className="muted">
        Add people to {user.organization.name} and manage their roles.
      </p>

      {notice && (
        <div className={`notice notice-${notice.type}`}>{notice.text}</div>
      )}

      <section className="card section">
        <h2>Add a member</h2>
        <p className="muted">
          They receive a temporary password by email and must change it when
          they first log in.
        </p>
        <form onSubmit={handleAdd} noValidate className="form-row">
          {formError && (
            <div className="alert form-row-full">{formError.message}</div>
          )}
          <FormField
            label="Name"
            name="memberName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldError(formError, "name")}
            required
          />
          <FormField
            label="Email"
            name="memberEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError(formError, "email")}
            required
          />
          <div className="field">
            <label htmlFor="memberRole">Role</label>
            <select
              id="memberRole"
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableRole)}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <button type="submit" className="btn btn-primary" disabled={adding}>
              {adding ? "Adding..." : "Add member"}
            </button>
          </div>
        </form>
      </section>

      <section className="card section">
        <h2>Team</h2>
        {loading ? (
          <p className="muted">Loading members...</p>
        ) : loadError ? (
          <div className="alert">{loadError}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const isSelf = m.id === user.id;
                  const isOwner = m.role === "superadmin";
                  const locked = isSelf || isOwner;
                  const busy = busyId === m.id;
                  return (
                    <tr key={m.id}>
                      <td>
                        {m.name}
                        {isSelf && <span className="muted"> (you)</span>}
                      </td>
                      <td>{m.email}</td>
                      <td>
                        {isOwner ? (
                          <span className="badge">
                            {ROLE_LABELS.superadmin}
                          </span>
                        ) : (
                          <select
                            className="select-inline"
                            value={m.role}
                            disabled={locked || busy}
                            onChange={(e) =>
                              void changeRole(
                                m,
                                e.target.value as AssignableRole,
                              )
                            }
                            aria-label={`Role for ${m.name}`}
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>
                        {m.mustChangePassword ? (
                          <span className="status status-pending">
                            Password pending
                          </span>
                        ) : (
                          <span className="status status-active">Active</span>
                        )}
                      </td>
                      <td>
                        {locked ? (
                          <span className="muted">-</span>
                        ) : (
                          <div className="actions">
                            <button
                              className="btn btn-small"
                              disabled={busy}
                              onClick={() => void resendPassword(m)}
                            >
                              Resend password
                            </button>
                            <button
                              className="btn btn-small btn-danger"
                              disabled={busy}
                              onClick={() => void removeMember(m)}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
