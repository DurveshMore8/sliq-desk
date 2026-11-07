const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/sliqdesk",
  isProduction: process.env.NODE_ENV === "production",
  cookieName: "sid",
  sessionDays: 7,
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  mailFrom: process.env.MAIL_FROM ?? "SliqDesk <no-reply@sliqdesk.local>",
  smtp: {
    host: process.env.SMTP_HOST ?? "localhost",
    port: num(process.env.SMTP_PORT, 1025),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  },
  slaMinutes: Math.max(0.1, num(process.env.SLA_MINUTES, 2)),
  slaCheckIntervalSeconds: Math.max(1, num(process.env.SLA_CHECK_INTERVAL_SECONDS, 10)),
};
