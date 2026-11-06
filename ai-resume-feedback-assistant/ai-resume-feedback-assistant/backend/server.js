require("dotenv").config();
const path = require("node:path");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/reviews");

const app = express();
const port = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "150kb" }));
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: "draft-8", legacyHeaders: false }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "AI Resume Feedback Assistant API" }));
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.use("/api", (_req, res) => res.status(404).json({ error: "API endpoint not found." }));
app.use((err, _req, res, _next) => {
  console.error("Request failed:", process.env.NODE_ENV === "production" ? err?.message : err);
  if (res.headersSent) return;
  const message = err?.message === "Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env"
    ? "Server configuration is incomplete. Add Supabase settings to backend/.env and restart the server."
    : "The request could not be completed. Check your input and database configuration.";
  res.status(500).json({ error: message });
});

if (require.main === module) {
  app.listen(port, () => console.log(`ResumeWise running at http://localhost:${port}`));
}
module.exports = app;
