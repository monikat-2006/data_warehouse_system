# Dark Warehouse Management System

A complete warehouse management system where Admins and Staff can work together to manage inventory, track stock movements, and generate reports.

## What is this project?

This is a role-based warehouse management platform. **Admin** can monitor everything, manage users, and see analytics. **Staff** can handle day-to-day inventory operations like adding products, updating stock, and viewing transaction history.

## Technologies Used

| Part | Technologies |
|------|--------------|
| Frontend | React.js, Vite, Recharts, Axios |
| Backend | Flask, Flask-Login, Flask-SQLAlchemy |
| Database | PostgreSQL (or SQLite for local dev) |
| Security | Session-based auth, Password Hashing |

## Key Features

### For Staff Users
- Add, edit, and delete products
- Stock-in and stock-out operations
- View transaction history
- Low stock alerts
- Update profile information
- Dashboard with charts

### For Admin Users
- See all products from all branches
- Manage users (add, edit, delete)
- Track every activity in the system
- Generate CSV reports
- View real-time analytics with graphs
- Filter by branch

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
