const $ = (selector) => document.querySelector(selector);
const state = { token: sessionStorage.getItem("resume_token"), user: null, mode: "login", reviews: [], currentReview: null };
const skillVocabulary = ["javascript","python","java","c programming","c++","sql","html","css","node.js","express.js","git","github","excel","power bi","tableau","machine learning","data analysis","data visualization","statistics","pandas","numpy","scikit-learn","communication","teamwork","problem solving","leadership","rest api","postgresql","supabase","linux","cloud computing"];

function safeText(value) { return String(value ?? ""); }
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers });
  let payload = {};
  try { payload = await response.json(); } catch { payload = {}; }
  if (!response.ok) {
    if (response.status === 401 && state.token) logout(false);
    throw new Error(payload.error || "Something went wrong. Please try again.");
  }
  return payload;
}
function setMessage(selector, message, kind = "") {
  const node = $(selector); node.textContent = message; node.className = `message ${kind}`.trim();
}
function toast(message, kind = "") {
  const node = $("#toast"); node.textContent = message; node.className = `toast ${kind}`.trim();
  node.classList.remove("hidden"); window.clearTimeout(toast.timer); toast.timer = window.setTimeout(() => node.classList.add("hidden"), 3500);
}
function switchMode(mode) {
  state.mode = mode;
  $("#login-tab").classList.toggle("active", mode === "login");
  $("#register-tab").classList.toggle("active", mode === "register");
  $("#login-tab").setAttribute("aria-selected", String(mode === "login"));
  $("#register-tab").setAttribute("aria-selected", String(mode === "register"));
  $("#auth-heading").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("#auth-description").textContent = mode === "login" ? "Log in to continue to your dashboard." : "Create an account to save your resume reviews.";
  $("#auth-submit").textContent = mode === "login" ? "Log in" : "Create account";
  $("#password").autocomplete = mode === "login" ? "current-password" : "new-password";
  setMessage("#auth-message", "");
}
function showApp(user) {
  state.user = user;
  $("#auth-view").classList.add("hidden"); $("#app-view").classList.remove("hidden"); $("#logout-btn").classList.remove("hidden");
  $("#account-label").textContent = user?.email || "Signed in";
  loadHistory();
}
function logout(showToast = true) {
  state.token = null; state.user = null; state.reviews = []; state.currentReview = null;
  sessionStorage.removeItem("resume_token");
  $("#auth-view").classList.remove("hidden"); $("#app-view").classList.add("hidden"); $("#logout-btn").classList.add("hidden");
  $("#account-label").textContent = ""; $("#results-panel").classList.add("hidden");
  if (showToast) toast("You have logged out.");
}
function renderHistory() {
  const host = $("#history-list"); host.replaceChildren();
  $("#review-count").textContent = String(state.reviews.length);
  if (!state.reviews.length) {
    const p = document.createElement("p"); p.className = "muted"; p.textContent = "No reviews yet. Your first analysis will appear here."; host.append(p); return;
  }
  state.reviews.forEach((review) => {
    const item = document.createElement("div"); item.className = "history-item";
    const score = document.createElement("div"); score.className = "history-score"; score.textContent = `${review.score}`;
    const details = document.createElement("div"); details.className = "history-details";
    const title = document.createElement("strong"); title.textContent = review.title || "Resume review";
    const date = document.createElement("small"); date.textContent = new Date(review.created_at).toLocaleDateString();
    details.append(title, date);
    const actions = document.createElement("div"); actions.className = "history-actions";
    const view = document.createElement("button"); view.className = "small-action"; view.type = "button"; view.textContent = "View"; view.addEventListener("click", () => showResults(review));
    const del = document.createElement("button"); del.className = "small-action delete"; del.type = "button"; del.textContent = "Delete"; del.setAttribute("aria-label", `Delete ${review.title || "resume review"}`); del.addEventListener("click", () => deleteReview(review.id));
    actions.append(view, del); item.append(score, details, actions); host.append(item);
  });
}
async function loadHistory() {
  $("#history-list").textContent = "Loading saved reviews…";
  try { const data = await api("/api/reviews"); state.reviews = data.reviews || []; renderHistory(); }
  catch (error) { $("#history-list").textContent = error.message; }
}
function addListItems(selector, items, emptyMessage) {
  const list = $(selector); list.replaceChildren();
  (items || []).forEach((item) => { const li = document.createElement("li"); li.textContent = item; list.append(li); });
  if (!(items || []).length) { const li = document.createElement("li"); li.textContent = emptyMessage; list.append(li); }
}
function renderChips(selector, items, className = "") {
  const host = $(selector); host.replaceChildren();
  if (!items || !items.length) { const span = document.createElement("span"); span.className = "chip neutral"; span.textContent = "None detected"; host.append(span); return; }
  items.forEach((item) => { const span = document.createElement("span"); span.className = `chip ${className}`.trim(); span.textContent = item; host.append(span); });
}
function showResults(review) {
  state.currentReview = review;
  const result = review.result || {};
  $("#results-panel").classList.remove("hidden");
  $("#score-value").textContent = String(review.score ?? result.score ?? 0);
  $("#score-ring").style.setProperty("--score", `${review.score ?? result.score ?? 0}%`);
  $("#score-summary").textContent = result.summary || "Review checklist results.";
  $("#result-date").textContent = review.created_at ? `Saved ${new Date(review.created_at).toLocaleString()}` : "Just analyzed";
  const sections = $("#section-results"); sections.replaceChildren();
  (result.sections || []).forEach((section) => {
    const row = document.createElement("div"); row.className = "check-item";
    const dot = document.createElement("span"); dot.className = `check-dot ${section.present ? "pass" : "fail"}`; dot.textContent = section.present ? "✓" : "×";
    const label = document.createElement("span"); label.textContent = section.label; row.append(dot, label); sections.append(row);
  });
  addListItems("#strengths-list", result.strengths, "Add more detail to highlight your strengths.");
  addListItems("#suggestions-list", result.suggestions, "No major checklist suggestions.");
  renderChips("#resume-skills", result.resumeSkills);
  $("#match-summary").textContent = result.jobDescriptionProvided ? `Detected ${result.matchedSkills.length} of ${result.jobSkills.length} recognized skills from the job description.` : "Add a target job description during analysis to compare skills.";
  renderChips("#matched-skills", result.matchedSkills);
  renderChips("#missing-skills", result.missingSkills, "missing");
  $("#results-panel").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function deleteReview(id) {
  if (!window.confirm("Delete this saved review? This cannot be undone.")) return;
  try {
    await api(`/api/reviews/${encodeURIComponent(id)}`, { method: "DELETE" });
    state.reviews = state.reviews.filter((review) => review.id !== id);
    renderHistory();
    if (state.currentReview?.id === id) $("#results-panel").classList.add("hidden");
    toast("Review deleted.");
  } catch (error) { toast(error.message, "error"); }
}
$("#login-tab").addEventListener("click", () => switchMode("login"));
$("#register-tab").addEventListener("click", () => switchMode("register"));
$("#logout-btn").addEventListener("click", () => logout());
$("#refresh-history").addEventListener("click", loadHistory);
$("#clear-results").addEventListener("click", () => $("#results-panel").classList.add("hidden"));
$("#resume-text").addEventListener("input", (event) => { $("#resume-length").textContent = `${event.target.value.length} / 12000`; });
$("#job-description").addEventListener("input", (event) => { $("#job-length").textContent = `${event.target.value.length} / 8000`; });

$("#auth-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = $("#auth-submit"); button.disabled = true;
  setMessage("#auth-message", state.mode === "login" ? "Signing in…" : "Creating account…");
  try {
    const payload = { email: $("#email").value.trim(), password: $("#password").value };
    const data = await api(`/api/auth/${state.mode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(payload) });
    if (!data.accessToken) {
      setMessage("#auth-message", "Account created. If email confirmation is enabled in Supabase, confirm your email, then log in.", "success");
      switchMode("login"); return;
    }
    state.token = data.accessToken; sessionStorage.setItem("resume_token", state.token);
    showApp(data.user); $("#password").value = ""; setMessage("#auth-message", "");
  } catch (error) { setMessage("#auth-message", error.message, "error"); }
  finally { button.disabled = false; }
});

$("#review-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const button = $("#analyze-btn"); button.disabled = true;
  setMessage("#review-message", "Analyzing resume and saving feedback…");
  try {
    const data = await api("/api/reviews", { method: "POST", body: JSON.stringify({ resumeText: $("#resume-text").value, jobDescription: $("#job-description").value }) });
    setMessage("#review-message", "Analysis saved successfully.", "success");
    showResults(data.review); await loadHistory(); toast("Resume review saved.");
  } catch (error) { setMessage("#review-message", error.message, "error"); }
  finally { button.disabled = false; }
});

(async function initialize() {
  if (!state.token) return;
  try { const data = await api("/api/auth/me"); showApp(data.user); }
  catch { logout(false); }
})();
