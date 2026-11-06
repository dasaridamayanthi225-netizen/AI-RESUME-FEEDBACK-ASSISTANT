const { createClient } = require("@supabase/supabase-js");

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env");
  return { url, key };
}

function createPublicClient() {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

function createUserClient(accessToken) {
  const { url, key } = getSupabaseConfig();
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });
}

module.exports = { createPublicClient, createUserClient };
