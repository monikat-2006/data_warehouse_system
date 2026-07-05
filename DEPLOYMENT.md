# Deployment Guide

## GitHub Setup

### 1. Create a GitHub Repository
1. Go to https://github.com and sign in
2. Click the "+" icon → "New repository"
3. Name it: `dark-warehouse-system`
4. Choose "Public" or "Private"
5. Click "Create repository"

### 2. Push Your Code to GitHub

```bash
# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Dark Warehouse Management System"

# Add remote repository (replace YOUR_USERNAME)
git remote set-url origin https://github.com/YOUR_USERNAME/dark-warehouse-system.git

# Push to GitHub
git push -u origin main
```

## Deployment Options

### Option 1: Heroku (Easiest)

#### Prerequisites
- Heroku account (free tier available)
- Heroku CLI installed

#### Steps
1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

2. Login to Heroku:
```bash
heroku login
```

3. Create a new Heroku app:
```bash
heroku create dark-warehouse-system
```

4. Set environment variables:
```bash
heroku config:set SECRET_KEY=your-secure-secret-key-here
heroku config:set DB_HOST=your-database-host
heroku config:set DB_NAME=your-database-name
heroku config:set DB_USER=your-database-user
heroku config:set DB_PASSWORD=your-database-password
heroku config:set DB_PORT=5432
```

5. Add PostgreSQL addon:
```bash
heroku addons:create heroku-postgresql:mini
```

6. Deploy:
```bash
git push heroku main
```

7. Open your app:
```bash
heroku open
```

### Option 2: Railway (Simple & Modern)

#### Steps
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect your Python app
5. Add PostgreSQL database from the "New" button
6. Set environment variables in the "Variables" tab:
   - `SECRET_KEY`: your secret key
   - `DB_HOST`: (use Railway's database URL)
   - `DB_NAME`: (from Railway database)
   - `DB_USER`: (from Railway database)
   - `DB_PASSWORD`: (from Railway database)
   - `DB_PORT`: 5432

### Option 3: Docker (Self-hosted)

#### Prerequisites
- Docker installed
- A server (VPS) or local machine

#### Steps
1. Build the Docker image:
```bash
docker build -t dark-warehouse-system .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

3. Access at http://localhost:5000

#### For Production Server
1. Update `docker-compose.yml` with your production database credentials
2. Add nginx reverse proxy for SSL/HTTPS
3. Use environment variables for sensitive data

### Option 4: VPS (DigitalOcean, AWS, etc.)

#### Prerequisites
- Ubuntu server
- Domain name (optional)

#### Steps
1. SSH into your server
2. Install dependencies:
```bash
sudo apt update
sudo apt install python3-pip python3-venv postgresql nginx
```

3. Clone your repository:
```bash
git clone https://github.com/YOUR_USERNAME/dark-warehouse-system.git
cd dark-warehouse-system
```

4. Setup Python environment:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn
```

5. Setup database:
```bash
sudo -u postgres psql
CREATE DATABASE dark_warehouse_db;
CREATE USER warehouse_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE dark_warehouse_db TO warehouse_user;
\q
```

6. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

7. Setup systemd service:
```bash
sudo nano /etc/systemd/system/warehouse.service
```

Add:
```ini
[Unit]
Description=Dark Warehouse System
After=network.target

[Service]
User=www-data
WorkingDirectory=/path/to/dark-warehouse-system/backend
Environment="PATH=/path/to/dark-warehouse-system/backend/venv/bin"
ExecStart=/path/to/dark-warehouse-system/backend/venv/bin/gunicorn --workers 3 --bind unix:warehouse.sock app:app

[Install]
WantedBy=multi-user.target
```

8. Start service:
```bash
sudo systemctl start warehouse
sudo systemctl enable warehouse
```

9. Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/warehouse
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://unix:/path/to/dark-warehouse-system/backend/warehouse.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

10. Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/warehouse /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

## Environment Variables

Always set these in production:
- `SECRET_KEY`: Random secure string (use: `python -c "import secrets; print(secrets.token_hex(32))"`)
- `DB_HOST`: Database host
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `DB_PORT`: Database port (usually 5432)

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong SECRET_KEY
- [ ] Enable HTTPS (SSL certificate)
- [ ] Use environment variables for sensitive data
- [ ] Restrict database access
- [ ] Enable firewall rules
- [ ] Regular backups
- [ ] Monitor logs

## Troubleshooting

### Database Connection Issues
- Check database credentials in environment variables
- Ensure PostgreSQL is running
- Verify network connectivity

### Build Failures
- Check Python version compatibility (requires 3.11+)
- Verify all dependencies in requirements.txt
- Check for missing environment variables

### Frontend Not Loading
- Ensure frontend build completed successfully
- Check API proxy configuration
- Verify CORS settings in backend
