# Eventory multisite – FastAPI backend

An **optional** FastAPI backend that adds server-side user management and
credential storage on top of the Eventory multisite frontend.

When the backend is not configured the frontend continues to work exactly as
before, storing Eventory login credentials in browser `localStorage`.

---

## Features

| Feature | Description |
|---------|-------------|
| **User management** | Register and log in with a username/password. Credentials are stored securely (bcrypt). |
| **Server-side login storage** | Eventory organisation credentials are stored per-user in a SQLite database instead of browser `localStorage`. |
| **Eventory proxy** | A transparent proxy endpoint (`/eventory/*`) forwards requests to `https://api.eventory.se` so that CORS is handled server-side. |
| **JWT authentication** | All protected endpoints require a Bearer token obtained from `/auth/login`. |

---

## Quick start

### 1. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure (optional)

Copy `.env.example` to `.env` and change `BACKEND_SECRET_KEY` to a long
random string before going to production.

```bash
cp .env.example .env
```

### 3. Run the server

```bash
uvicorn main:app --reload --port 8000
```

The interactive API docs are available at <http://localhost:8000/docs>.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_SECRET_KEY` | `change-me-in-production-…` | Secret used to sign JWT tokens. **Must be changed** before deploying. |
| `BACKEND_ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 h) | JWT lifetime in minutes. |

---

## API overview

### Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Create a new user account |
| `POST` | `/auth/login` | Obtain a JWT access token (OAuth2 password flow) |
| `GET`  | `/auth/me` | Return the currently authenticated user |

### Eventory logins

All endpoints below require `Authorization: Bearer <token>`.

| Method | Path | Description |
|--------|------|-------------|
| `GET`    | `/logins`           | List all saved Eventory logins for the current user |
| `POST`   | `/logins`           | Save a new Eventory login |
| `PUT`    | `/logins/{id}`      | Update an existing Eventory login |
| `DELETE` | `/logins/{id}`      | Remove an Eventory login |

### Eventory proxy

| Method | Path | Description |
|--------|------|-------------|
| `*` | `/eventory/{path}` | Forward any request to `https://api.eventory.se/{path}` |

---

## Connecting the frontend

In the frontend, open **Login Manager → Backend Settings** and enter the URL
of your running backend (e.g. `http://localhost:8000`).  After registering
and logging in, your Eventory credentials will be stored on the server
instead of in the browser.

Leave the backend URL blank to revert to the default localStorage-only mode.

---

## Database

A SQLite file `eventory_backend.db` is created automatically in the `backend/`
directory on first run.  To use a different database (PostgreSQL, MySQL, …)
change `DATABASE_URL` in `models.py` and install the appropriate driver.

---

## Production checklist

- [ ] Set `BACKEND_SECRET_KEY` to a strong random value.
- [ ] Run behind a reverse proxy (nginx, Caddy, …) with TLS.
- [ ] Restrict `allow_origins` in the CORS middleware to your frontend domain.
- [ ] Consider switching from SQLite to PostgreSQL for concurrent workloads.
