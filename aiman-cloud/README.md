# Aiman Cloud — Your Private Digital Space

A private, single-user personal cloud storage platform: upload, organize, and view your
files, photos, and notes from any device. Built with Next.js 14 (App Router), Postgres +
Prisma, and JWT auth in httpOnly cookies.

---

## What's implemented

This is real, working code — not mockups. It covers the full core product:

- **Auth**: register, login, logout, remember-me, JWT access + refresh tokens, bcrypt
  password hashing, httpOnly secure cookies, route-protecting middleware, change
  password/email from Settings.
- **File manager**: drag-and-drop upload with progress bars, folders (create, rename,
  color, nested), rename, favorite, move to trash, restore, permanent delete, grid/list
  views, duplicate detection (SHA-256 checksum).
- **Notes**: Markdown notes with autosave, pin, archive, trash, live preview.
- **Dashboard**: storage used/remaining, file-type counts, 7-day upload graph, recent
  uploads, favorites, activity feed.
- **Search**: instant search across files, folders, and notes.
- **Settings**: profile, dark/light mode, password change.
- **UI**: custom "midnight glass" design system, responsive down to mobile, custom logo,
  toasts, loading skeletons, PWA manifest.
- **Infra**: Prisma schema with proper indexes/relations, Docker + docker-compose (app +
  Postgres + Nginx), seed script.

## What's intentionally out of scope for this pass

These are real, non-trivial subsystems that deserve their own build rather than a stub
that *looks* done but isn't. The architecture below leaves room for each:

| Feature | Why it's not here yet | Where it plugs in |
|---|---|---|
| Two-factor auth | Needs a TOTP library + verified enrollment flow | `Setting.twoFactorEnabled/Secret` already in schema |
| Admin panel | Separate auth surface + its own UI | New `(admin)` route group + `role` field on `User` |
| S3 / R2 / Supabase storage | Needs your bucket credentials | `src/lib/storage.ts` — swap the `local` branch |
| Virus scanning | Needs an external scanner (e.g. ClamAV) | Hook into the upload handler in `src/app/api/files/route.ts` |
| Automated tests | Needs a running Postgres + test harness decision (Vitest/Jest + Supertest) | `package.json` scripts |
| PWA offline mode | Needs a service worker + cache strategy | `public/manifest.json` is already in place |
| Video transcoding/streaming, EXIF extraction, thumbnail generation | Needs `ffmpeg`/`sharp` on the server | New workers alongside `src/lib/storage.ts` |

Ask me to build out any of these next and I'll do it properly rather than fake it.

---

## Quick start

### 1. Requirements
- Node.js 20+
- Docker (recommended) or a local PostgreSQL 16 instance

### 2. Clone & configure
```bash
cp .env.example .env
# edit .env — set JWT secrets, OWNER_EMAIL, OWNER_PASSWORD
```

### 3. Run with Docker (app + Postgres + Nginx)
```bash
docker compose up --build
```
The app is served through Nginx on **http://localhost** (port 80), and directly on
**http://localhost:3000** from the app container.

### 4. Or run locally without Docker
```bash
npm install
# start a local Postgres and point DATABASE_URL at it in .env, then:
npx prisma migrate dev --name init
npm run seed        # creates your OWNER_EMAIL / OWNER_PASSWORD account
npm run dev
```
Visit http://localhost:3000 and sign in with the credentials from `.env`.

---

## Environment variables

See `.env.example` for the full list. The essentials:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Sign the auth tokens — generate with `openssl rand -base64 48` |
| `STORAGE_DRIVER` | `local` today; see the table above to add `s3` |
| `OWNER_EMAIL` / `OWNER_PASSWORD` / `OWNER_NAME` | Used by `npm run seed` to create your account |
| `TOTAL_STORAGE_BYTES` | Your storage quota (bytes) |

---

## Project structure

```
prisma/
  schema.prisma       # User, File, Folder, Note, Tag, Session, ActivityLog, Notification, Setting
  seed.ts              # creates the owner account + starter folders
src/
  lib/
    prisma.ts          # Prisma client singleton
    auth.ts             # bcrypt + JWT helpers
    session.ts          # cookie + "current user" helpers
    storage.ts          # local disk driver (S3-ready abstraction)
    utils.ts             # formatBytes, cn, etc.
  middleware.ts         # protects app routes, redirects signed-in users away from /login
  app/
    (auth)/login, register        # split-screen auth pages
    (app)/dashboard, files,
          favorites, trash,
          notes, settings          # the authenticated app shell + pages
    api/
      auth/{register,login,logout,me}
      files/ , files/[id]/ , files/[id]/download , files/[id]/restore
      folders/ , folders/[id]/
      notes/ , notes/[id]/
      search/
      dashboard/stats/
      user/profile/
  components/           # Sidebar, Topbar, FileCard, FolderCard, UploadDropzone, Modal, …
public/
  logo.svg, favicon.svg, manifest.json, uploads/   # local file storage root
```

## API reference (summary)

All routes are under `/api` and require the `aiman_access` cookie except `auth/*`.

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, sets auth cookies |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/files?folderId=&view=&category=` | List files (trash/favorites via `view`) |
| POST | `/api/files` | Upload (multipart `file`, optional `folderId`) |
| PATCH | `/api/files/:id` | Rename / move / favorite |
| DELETE | `/api/files/:id?permanent=true` | Trash or permanently delete |
| GET | `/api/files/:id/download` | Stream file |
| POST | `/api/files/:id/restore` | Restore from trash |
| GET/POST | `/api/folders` | List / create folders |
| PATCH/DELETE | `/api/folders/:id` | Rename/move or trash a folder |
| GET/POST | `/api/notes` | List / create notes |
| PATCH/DELETE | `/api/notes/:id` | Autosave or trash a note |
| GET | `/api/search?q=` | Search files, folders, notes |
| GET | `/api/dashboard/stats` | Dashboard aggregates |
| PATCH | `/api/user/profile` | Update profile / change password |

## Security notes

- Passwords hashed with bcrypt (cost 12).
- Access tokens are short-lived (15 min) and refresh tokens are stored server-side in
  `Session`, so you can revoke a session by deleting its row.
- Cookies are `httpOnly`, `sameSite=lax`, and `secure` in production.
- All file/folder/note queries are scoped by `ownerId`, so one authenticated user can
  only ever see their own data — future-proofed for multi-user, but currently
  single-owner by design.
- Put this behind the provided Nginx + your own TLS certs (or a service like Caddy /
  Cloudflare Tunnel) before exposing it to the internet.

## License

Private project — use and modify as you like for your own deployment.
