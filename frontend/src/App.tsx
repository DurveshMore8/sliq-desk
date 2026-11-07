import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type ApiResponse<T> = { success: boolean; message: string; data: T };
type Health = { status: string; database: string; timestamp: string };

export default function App() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(async (res) => {
        const body = (await res.json()) as ApiResponse<Health>;
        if (!res.ok || !body.success)
          throw new Error(body.message ?? `HTTP ${res.status}`);
        return body.data;
      })
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1>Helpdesk</h1>
      <p>
        Backend status:{" "}
        {error
          ? `unreachable (${error})`
          : health
            ? health.status
            : "checking..."}
      </p>
    </main>
  );
}
