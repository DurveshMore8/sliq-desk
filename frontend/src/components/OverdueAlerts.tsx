import { useState } from "react";
import { Link } from "react-router";
import { useRealtime } from "../lib/useRealtime";

interface OverdueAlert {
  id: string;
  title: string;
}

export default function OverdueAlerts() {
  const [alerts, setAlerts] = useState<OverdueAlert[]>([]);

  useRealtime(
    (event) => {
      if (event.type === "sla.overdue") {
        const { id, title } = event.ticket;
        setAlerts((prev) =>
          [{ id, title }, ...prev.filter((a) => a.id !== id)].slice(0, 5),
        );
      }
      if (event.type === "ticket.updated" && !event.ticket.overdue) {
        const { id } = event.ticket;
        setAlerts((prev) => prev.filter((a) => a.id !== id));
      }
    },
    () => undefined,
  );

  function dismiss(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  if (alerts.length === 0) return null;

  return (
    <div className="alerts" role="region" aria-label="SLA alerts">
      {alerts.map((a) => (
        <div key={a.id} className="alert-toast" role="alert">
          <div>
            <strong>Overdue ticket</strong>
            <p>
              No staff reply yet:{" "}
              <Link to={`/tickets/${a.id}`} onClick={() => dismiss(a.id)}>
                {a.title}
              </Link>
            </p>
          </div>
          <button
            className="toast-close"
            aria-label="Dismiss"
            onClick={() => dismiss(a.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
