import { io } from "socket.io-client";

const [email, password] = process.argv.slice(2);
const api = process.env.API_URL ?? "http://localhost:4000";

if (!email || !password) {
  console.error("Usage: node scripts/listen.js <email> <password>");
  process.exit(1);
}

const res = await fetch(`${api}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!res.ok) {
  console.error("Login failed:", res.status, await res.text());
  process.exit(1);
}
const cookie = res.headers
  .getSetCookie()
  .map((c) => c.split(";")[0])
  .join("; ");

const socket = io(api, { extraHeaders: { cookie }, transports: ["websocket"] });

socket.on("connect", () => console.log(`[${email}] connected`));
socket.on("connect_error", (err) => console.log(`[${email}] rejected: ${err.message}`));
socket.on("disconnect", (reason) => console.log(`[${email}] disconnected: ${reason}`));
socket.onAny((event, payload) => {
  const t = payload?.ticket;
  const c = payload?.comment;
  const detail = t
    ? `"${t.title}" status=${t.status} priority=${t.priority}`
    : c
      ? `by ${c.author.name}: "${c.body}"`
      : "";
  console.log(`[${email}] ${event}`, detail);
});
