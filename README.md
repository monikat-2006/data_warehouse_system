# Dark Warehouse Management System

A complete warehouse management system where Admins and Staff can work together to manage inventory, track stock movements, and generate reports.

## What is this project?

This is a role-based warehouse management platform. **Admin** can monitor everything, manage users, and see analytics. **Staff** can handle day-to-day inventory operations like adding products, updating stock, and viewing transaction history.

## Technologies Used

| Part | Technologies |
|------|--------------|
| Frontend | React.js, HTML, CSS, JavaScript, Recharts |
| Backend | Flask, Python, JWT |
| Database | PostgreSQL |
| Security | JWT Tokens, Password Hashing |

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

## How to Run This Project

### Step 1: Setup Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python app.py
