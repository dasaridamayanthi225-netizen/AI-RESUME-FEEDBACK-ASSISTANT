# AI Resume Feedback Assistant

A beginner-friendly full-stack web application that reviews resume text, checks common resume sections, compares recognized skills with a target job description, and saves feedback to Supabase PostgreSQL.

> **Important:** The first version uses a transparent rule-based analyzer. It does not call an AI model or promise hiring outcomes. Users paste text; PDF/DOCX upload and true AI model integration are not included.

## 1. Problem and objectives

Students and entry-level job seekers may not know whether their resume includes useful sections or reflects the skills in a role description. This app provides a repeatable checklist and stores past reviews.

Objectives:
- Check contact, summary, education, skills, projects, and experience/activity sections.
- Give a transparent 0–100 checklist score.
- Detect a small built-in vocabulary of skills and compare it with a pasted job description.
- Give practical, honest suggestions.
- Allow each authenticated user to list, view, and delete only their own saved reviews.

## 2. Users and features

The only role in this MVP is an authenticated user. There is no admin dashboard.

- Supabase Auth registration and login.
- Resume text analysis and optional job-skill comparison.
- Saved review history (up to 50 latest records shown).
- View and delete previous results.
- Responsive interface with input validation and accessible status messages.

The score is a learning aid, not a hiring score. The vocabulary is limited and can miss synonyms. Never add a skill to a resume unless you actually have it.

## 3. Technology

- HTML5, CSS3, Vanilla JavaScript
- Node.js 20+ and Express.js
- Supabase Auth and Supabase PostgreSQL
- Git and GitHub
- npm packages: `express`, `@supabase/supabase-js`, `dotenv`, `helmet`, and `express-rate-limit`
- Tests use Node's built-in `node:test`; no testing library is needed.

## 4. Folder structure

```text
ai-resume-feedback-assistant/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── server.js
│   ├── supabase.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── reviews.js
│   ├── middleware/
│   │   └── auth.js
│   ├── utils/
│   │   ├── analyzer.js
│   │   └── analyzer.test.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`backend/package-lock.json` is created by `npm install`; commit it for reproducible installs. `backend/.env` is created locally and must never be committed.

## 5. Prerequisites

Install:
- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS (includes npm): https://nodejs.org/
- Git: https://git-scm.com/downloads
- Supabase account/project: https://supabase.com/

Verify in a new terminal:
```powershell
node --version
npm --version
git --version
```
Use Node.js 20 or newer.

## 6. Supabase setup

1. Sign in at https://supabase.com/ and create a new project.
2. Choose a project name, database password, and region. Keep the database password private; this project does not need it directly.
3. Wait until the database is ready.
4. Open **SQL Editor** in the project dashboard.
5. Open `database/schema.sql` in VS Code, copy all of it into a new SQL query, and click **Run**.
6. Open **Table Editor** and confirm that `resume_reviews` exists.
7. In **Project Settings → API** (or the project's API keys page), copy the Project URL and the publishable/anon key. The anon/publishable key is designed for public clients, but access remains restricted by Auth and RLS. Never use a service-role/secret key in this app.
8. In **Authentication → Providers → Email**, check whether email confirmation is enabled. If it is enabled, registration may require confirming the email before login.

The SQL enables Row Level Security (RLS). Policies restrict reads, inserts, and deletes to rows where `user_id` equals the signed-in Supabase identity. The API forwards the user's access token to Supabase. Express also verifies that token. No service-role key is used.

## 7. Environment variables

Create `backend/.env` by copying `backend/.env.example`. Replace the placeholders with your own project settings:

```dotenv
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

- `PORT`: local Express port.
- `NODE_ENV`: `development` locally; set to `production` when deployed.
- `SUPABASE_URL`: your Supabase project URL.
- `SUPABASE_ANON_KEY`: the publishable/anon key, used by the server to call Supabase Auth and RLS-protected database APIs.

These values above are placeholders and will not connect until replaced. There is no custom JWT secret to generate because Supabase manages authentication. Do not create a service-role key for this project.

## 8. Install and run (Windows)

1. Open VS Code and choose **File → Open Folder**. Open the `ai-resume-feedback-assistant` root folder.
2. Open **Terminal → New Terminal**.
3. Move into the backend:
   ```powershell
   cd backend
   ```
4. Install packages:
   ```powershell
   npm install
   ```
   This installs dependencies and creates `package-lock.json`.
5. Create and fill `backend/.env` as explained above. Confirm the file is in `backend`, next to `server.js`.
6. Start the server:
   ```powershell
   npm run dev
   ```
   Expected output: `ResumeWise running at http://localhost:3000`
7. Open http://localhost:3000 in your browser. Do not open `index.html` as a `file://` URL; Express serves the frontend.
8. Check the health endpoint at http://localhost:3000/api/health. It should return JSON with `"status":"ok"`.

To stop the server, focus the terminal and press `Ctrl+C`. For normal startup use `npm start`.

## 9. How to use it

1. Create an account using an email and password of at least 8 characters.
2. If Supabase email confirmation is enabled, confirm your email, then log in.
3. Paste at least 80 characters of resume text. You can use a sample resume with fictional details for a demonstration.
4. Optionally paste the target job description.
5. Select **Analyze my resume**.
6. Review the score, section checklist, strengths, improvement suggestions, and skill comparison.
7. Find the saved review under Recent reviews. Select **View** to reopen it or **Delete** to remove it.

The app stores the resume text and job description in the database so it can save the analysis. Avoid including sensitive information you do not need to store.

## 10. API reference

All API responses use JSON. Authenticated endpoints require `Authorization: Bearer <Supabase access token>`.

| Method | Path | Purpose | Access / input | Success |
|---|---|---|---|---|
| GET | `/api/health` | Server health check | Public | `200 { status: "ok", service: "..." }` |
| POST | `/api/auth/register` | Create Supabase Auth user | Public; `{ email, password }` | `201 { accessToken, user, confirmationRequired }` |
| POST | `/api/auth/login` | Sign in | Public; `{ email, password }` | `200 { accessToken, user }` |
| GET | `/api/auth/me` | Verify current session | Bearer token | `200 { user }` |
| GET | `/api/reviews` | List latest saved reviews | Own rows only; no body | `200 { reviews: [...] }` |
| POST | `/api/reviews` | Analyze and save a review | Bearer token; `{ resumeText, jobDescription? }` | `201 { review: {...} }` |
| GET | `/api/reviews/:id` | Read one review | Bearer token; own row only | `200 { review }` |
| DELETE | `/api/reviews/:id` | Delete a review | Bearer token; own row only | `200 { message }` |

Common errors:
- `400`: invalid form data.
- `401`: missing/invalid token or sign-in failure.
- `404`: API path or review not found.
- `500`: server/database configuration or unexpected request failure.

A non-owner's row is not returned by RLS; the single-review route returns 404 when no accessible row is found.

## 11. Architecture and security

Browser → Express API → Supabase Auth/PostgreSQL. The browser stores the short-lived access token in `sessionStorage`, which is cleared when the browser tab session ends or the user logs out. Because browser JavaScript can access it, XSS prevention remains important. This is a student MVP; production deployment should consider a backend-managed secure, HttpOnly cookie session, CSRF protections, stricter content security policy, and a formal privacy review.

- `helmet` adds common HTTP security headers.
- `express-rate-limit` limits repeated API requests.
- Server-side validation checks text lengths and credentials.
- Supabase Auth manages passwords; this app never stores plaintext passwords.
- RLS policies enforce row ownership at the database layer.
- No service-role key or database password is required or sent to the browser.
- Resume text is rendered through DOM `textContent`, not inserted as HTML.

## 12. Testing

Run in `backend/`:
```powershell
npm test
npm run check
```
`npm test` runs unit tests for the rule-based analyzer. These tests do not require Supabase credentials. `npm run check` checks JavaScript syntax.

Manual checklist:
- [ ] `/api/health` returns status `ok`.
- [ ] Register a new account and complete email confirmation if enabled.
- [ ] Log in with the correct password; a wrong password should fail.
- [ ] Submit fewer than 80 resume characters; the form/API should reject it.
- [ ] Submit valid resume text and verify a score, sections, and suggestions appear.
- [ ] Add a job description with a skill such as Python and verify matching/missing skill output.
- [ ] Refresh the page and confirm saved reviews load after signing in again.
- [ ] View a saved review and delete it after confirmation.
- [ ] Try the API without a token; private endpoints should return 401.
- [ ] Create a second test account and confirm it cannot see the first account's reviews.
- [ ] Test the layout at desktop and mobile widths.
- [ ] Temporarily use an incorrect Supabase URL and confirm the app shows an error rather than a secret or stack trace; restore the correct value afterward.

Remote database behavior has not been verified by the unit tests; you must run the manual checks with your own Supabase project.

## 13. Troubleshooting

- **`node` or `npm` not recognized:** install Node.js LTS, close and reopen VS Code, then run `node --version`.
- **Port already in use:** set `PORT=3001` in `backend/.env`, restart the server, and open `http://localhost:3001`.
- **Missing Supabase settings:** confirm `backend/.env` exists and has real values, not the placeholders; restart the server after editing it.
- **Invalid API key / fetch failed:** verify the Project URL and publishable/anon key from the same Supabase project.
- **Email confirmation required:** confirm the registration email before login, or review Email provider settings in Supabase for your development project.
- **Table not found:** run `database/schema.sql` in the correct Supabase project's SQL Editor.
- **Permission denied / no reviews:** confirm you are logged in and the SQL RLS policies were created.
- **Frontend does not load:** start Express from the `backend` directory with `npm run dev`; browse to the HTTP URL, not a local file.
- **CSS or JavaScript changes do not appear:** hard-refresh with `Ctrl+F5`.
- **Dependency errors:** use Node.js 20+ and run `npm install` from `backend/`.

## 14. Git and GitHub

1. Create an empty repository at https://github.com/new. Do not add a README there if this folder already has one.
2. Open a terminal at the project root, not inside `backend`.
3. Check that `.env` and `node_modules` are ignored:
   ```powershell
   git status --ignored
   ```
4. Initialize and commit:
   ```powershell
   git init
   git status
   git add .
   git status
   git commit -m "Build AI Resume Feedback Assistant"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```
5. Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL, for example the HTTPS URL copied from your GitHub repository.
6. Refresh the repository page and verify that source files, `database/schema.sql`, and `.env.example` are present. Verify `backend/.env` and `node_modules` are absent.

`.gitignore` does not remove a secret that has already been committed. If you accidentally commit credentials, rotate/revoke them immediately, then remove them from repository history as appropriate. Never commit resume samples containing real personal information.

## 15. Limitations and future improvements

Not included in this MVP: real generative AI, PDF/DOCX parsing, resume file uploads, editing saved reviews, password-reset UI, admin roles, and deployment configuration. Future improvements could add file parsing, a broader configurable skills dictionary, downloadable feedback reports, and an optional AI provider with explicit consent and cost/privacy controls.

## License and educational use

Use this project for learning and college demonstration. Review the security and privacy requirements before deploying it for real users.
