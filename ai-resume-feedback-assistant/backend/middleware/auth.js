const { createPublicClient, createUserClient } = require("../supabase");

async function requireAuth(req, res, next) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return res.status(401).json({ error: "Please log in to continue." });

  try {
    const accessToken = match[1];
    const supabase = createPublicClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) return res.status(401).json({ error: "Your session is invalid or expired. Please log in again." });
    req.user = { id: data.user.id, email: data.user.email };
    req.accessToken = accessToken;
    req.supabase = createUserClient(accessToken);
    return next();
  } catch {
    return res.status(500).json({ error: "Could not verify your session. Check server configuration." });
  }
}

module.exports = { requireAuth };
