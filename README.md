# Smart Inventory Management System

## Tech Stack
- **Frontend:** React + Vite, Recharts, Axios
- **Backend:** Python Flask, Flask-Login, Flask-SQLAlchemy
- **Database:** PostgreSQL (or SQLite for local dev)

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Optional: use PostgreSQL
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/warehouse_db

python app.py
```

Default admin: `admin` / `admin123`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## PostgreSQL Setup
```sql
CREATE DATABASE warehouse_db;
```
Then run `migrations/schema.sql` or let Flask-SQLAlchemy auto-create tables.

## API Routes
- `POST /api/auth/register` — Register user
- `POST /api/auth/login` — Login (session cookie)
- `POST /api/auth/logout` — Logout
- `GET /api/auth/verify` — Check session
- `GET/POST/PUT/DELETE /api/products` — Product CRUD (admin)
- `POST /api/stock/in|out` — Stock operations
- `GET /api/stock/transactions` — Transaction history
- `GET /api/activity/log|my-activities` — Activity logs
- `GET /api/reports/*` — Analytics & reports
