# Rink Schedule

A friendlier, shared version of the club's schedule spreadsheet. Anyone with
the link can view the calendar and add or edit games/practices — no login
required.

- **Frontend:** React + Vite
- **Database:** Supabase (Postgres) — free tier is plenty for this
- **Hosting:** Vercel, deployed from GitHub

## 1. Create the database (Supabase) — ~5 minutes

1. Go to [supabase.com](https://supabase.com) and sign up (free), then **New project**.
   - Pick any name/region, set a database password (you won't need it day-to-day).
2. Once the project finishes provisioning, open **SQL Editor** in the left sidebar.
3. Click **New query**, paste in everything from [`supabase/schema.sql`](./supabase/schema.sql), and click **Run**.
   This creates the `events` table and sets permissions so any visitor to the
   site can read and write schedule entries.
4. Go to **Project Settings -> API**. You'll need two values in a minute:
   - **Project URL**
   - **anon public** key

## 2. Run it locally

```bash
npm install
cp .env.example .env
# edit .env and paste in your Project URL + anon key from step 1.4
npm run dev
```

Open the local URL it prints (usually `http://localhost:5173`).

## 3. Put it on GitHub

```bash
git init
git add .
git commit -m "Initial version of the rink schedule site"
```

Create a new empty repo on [github.com/new](https://github.com/new) (don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git branch -M main
git push -u origin main
```

Your `.env` file is git-ignored on purpose — it never gets pushed, so your
Supabase key isn't sitting in the public repo (it goes into Vercel instead,
in step 4).

## 4. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com), sign up/log in with GitHub.
2. **Add New -> Project**, and import the repo you just pushed.
3. Vercel will auto-detect Vite. Before clicking Deploy, open **Environment
   Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Click **Deploy**. In about a minute you'll get a live `*.vercel.app` link
   you can share with the team.

Any time you push new commits to `main`, Vercel redeploys automatically.

## Notes on the "open editing" setup

Because the site has no login, the database is configured so anyone who has
the site's Supabase anon key (which ships in the public site code — that's
normal for this kind of key) can add, edit, or delete schedule entries. That
matches "anyone visiting can edit," but it also means someone could
accidentally (or deliberately) delete an entry. If that becomes a problem
later, you can add a simple shared PIN or move to team-admin logins without
changing the rest of the app — just ask and it can be layered in.

## Project structure

```
src/
  App.jsx              main app: month state, data fetching, layout
  components/
    CalendarView.jsx   month grid + event chips
    EventModal.jsx     add / edit / delete form
  constants.js          team list & event types — edit these to rename teams
  dateUtils.js          calendar math helpers
  supabaseClient.js     Supabase connection (reads .env)
supabase/schema.sql      run once in Supabase's SQL editor
```

To change the team names (e.g. add or rename a division), edit the `TEAMS`
array in `src/constants.js` — no database changes needed, since team is
stored as plain text.
