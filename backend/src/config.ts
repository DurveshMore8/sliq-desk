const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return value !== undefined && value !== "" && Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  port: num(process.env.PORT, 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  mongoUrl: process.env.MONGO_URL ?? "mongodb://localhost:27017/helpdesk",
  isProduction: process.env.NODE_ENV === "production",
  cookieName: "sid",
  sessionDays: 7,
};
