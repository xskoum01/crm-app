# Getting Started

## 1. Installation Process

### Backend Setup (`/backend`)

#### Create and Activate Virtual Environment

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Run the API (port 8001)

```bash
uvicorn app:app --reload --port 8001
```

A local SQLite database `crm.db` will be created automatically on startup.

#### Check the API

* Swagger UI: [http://localhost:8001/docs](http://localhost:8001/docs)

---

### Frontend Setup (`/frontend`)

#### Install Node Dependencies

```bash
cd ../frontend
npm install
# or: pnpm install
```

#### Configure API URL

Create a `.env.local` file in `/frontend`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
```

#### Run the Dev Server

```bash
npm run dev
```

Open the UI at: [http://localhost:3000](http://localhost:3000)

---

## 2. Software Dependencies

### Backend

* Python 3.11+
* FastAPI
* SQLModel / SQLAlchemy
* Uvicorn
* SQLite (no external server required)

### Frontend

* Node.js 18+ (LTS recommended)
* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

---

## 3. Latest Releases

The project currently uses a single main development branch.

You can tag releases using standard Git tags:

```bash
git tag v0.1.0
git push origin v0.1.0
```

*(Update this section once real releases start.)*

---

## 4. API References

The backend exposes a simple REST API:

* `/customers` – customers CRUD
* `/leads` – leads CRUD
* `/tasks` – tasks CRUD
* `/meetings` – meetings CRUD (including assigned users)
* `/users` – internal users CRUD

You can explore all endpoints and payloads via Swagger UI:
[http://localhost:8001/docs](http://localhost:8001/docs)

---

# Build and Test

The project is currently focused on local development.

## Backend

### Run Development Server

```bash
cd backend
uvicorn app:app --reload --port 8001
```

### (Optional) Type Checking / Linting

You can add tools such as `mypy` or `ruff` to `requirements-dev.txt` and run:

```bash
mypy .
ruff check .
```

## Frontend

### Dev Build

```bash
cd frontend
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### (Optional) Tests / Linting

```bash
npm run lint
npm test
```

*(Update this section once automated tests are added.)*

---

# Contribute

This is a small internal project, but you can still follow a simple contribution flow.

## 1. Create a Branch

```bash
git checkout -b feature/something
```

## 2. Make Your Changes

* Keep backend changes in `backend/` (models, endpoints).
* Keep frontend changes in `frontend/` (pages, components, types).

Run both backend and frontend locally to ensure everything works.

## 3. Run Basic Checks

* Backend: server starts without errors, major endpoints work through Swagger.
* Frontend: `npm run dev` runs successfully and key pages load.

## 4. Create a Pull Request

* Write a short, clear title (e.g., "Add status label for leads").
* In the description, include:

  * what was changed,
  * how to test it,
  * any impact on the database (e.g., need to remove `crm.db`).

## 5. Code Style

* **Python**: follow the existing structure (`models.py`, `db.py`, `app.py`).
* **TypeScript/React**: use functional components, define types in `src/lib/types.ts`, avoid hard‑coded URLs — use the API helper.

*(If the project grows, this section can be expanded with branching strategy, code owners, CI pipeline, etc.)*
