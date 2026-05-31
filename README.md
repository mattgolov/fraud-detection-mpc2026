# MCPHACKS - Fraud Detection Platform

A full-stack fraud detection system built with Django REST API and React/Vite frontend, fully containerized with Docker.

**Valsoft Challenge - MPC Hacks 2026**

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MCPHACKS Stack                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                 │
│  │  React/Vite      │      │  Django REST API │                 │
│  │  Frontend        │◄────►│  Backend         │                 │
│  │  :5173           │      │  :8000           │                 │
│  └──────────────────┘      └──────────────────┘                 │
│                                     │                            │
│                                     │                            │
│                            ┌────────▼─────────┐                 │
│                            │  PostgreSQL DB   │                 │
│                            │  :5432           │                 │
│                            │  fraud_detect    │                 │
│                            └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 Service Ports & Configuration

| Service    | Port | URL                    | Purpose              |
|-----------|------|------------------------|----------------------|
| Frontend  | 5173 | http://localhost:5173  | React/Vite app       |
| API       | 8000 | http://localhost:8000  | Django REST API      |
| Database  | 5432 | localhost:5432         | PostgreSQL           |

## 🚀 Quick Start

### Prerequisites

- **Docker** (version 20.10+)
- **Docker Compose** (version 1.29+)
- **Git**

### 1. Clone & Setup

```bash
# Clone the repository
git clone <repo-url>
cd MCPHACKS

# Copy environment template to .env
cp .env.template .env

# (Optional) Edit .env for custom configuration
# vim .env
```

### 2. Build Docker Images

```bash
# Build all Docker images
docker-compose build

# Or build specific service
docker-compose build api      # Django API
docker-compose build frontend # React frontend
docker-compose build db       # PostgreSQL
```

### 3. Start Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or start with logs visible
docker-compose up

# View logs from specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f db
```

### 4. Verify Services Are Running

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME                 STATUS
# mcphacks_db          Up (healthy)
# mcphacks_api         Up
# mcphacks_frontend    Up
```

### 5. Access Services

**Frontend:**
- URL: http://localhost:5173
- Browser-based React application

**API:**
- Base URL: http://localhost:8000
- Admin: http://localhost:8000/admin
- API docs: http://localhost:8000/api/ (if DRF configured)

**Database:**
- Host: localhost
- Port: 5432
- Username: frauduser (default)
- Password: fraudpass123 (default)
- Database: fraud_detect

## 📝 Environment Variables

Create a `.env` file in the project root. See `.env.template` for all available options.

### Key Variables

```env
# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=fraud_detect
DB_USER=frauduser
DB_PASSWORD=fraudpass123
DB_HOST=db              # Use 'db' when in Docker, 'localhost' for local dev
DB_PORT=5432

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True              # Set to False in production
ALLOWED_HOSTS=localhost,127.0.0.1,api

# CORS (for frontend-backend communication)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://frontend:5173

# Ports
API_PORT=8000
FRONTEND_PORT=5173
DB_PORT=5432

# Frontend
VITE_API_URL=http://localhost:8000
```

## 🔧 Common Commands

### Docker Compose

```bash
# Start services
docker-compose up -d

# Stop services (keeps data)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Execute command in container
docker-compose exec api python manage.py shell

# Rebuild specific service
docker-compose build --no-cache api
```

### Django Management

```bash
# Access Django shell
docker-compose exec api python manage.py shell

# Create superuser
docker-compose exec api python manage.py createsuperuser

# Apply migrations
docker-compose exec api python manage.py migrate

# Create migrations
docker-compose exec api python manage.py makemigrations

# Load fixtures
docker-compose exec api python manage.py loaddata fixture.json

# Export data
docker-compose exec api python manage.py dumpdata > data.json
```

### Database

```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U frauduser -d fraud_detect

# Backup database
docker-compose exec db pg_dump -U frauduser fraud_detect > backup.sql

# Restore database
docker-compose exec db psql -U frauduser fraud_detect < backup.sql
```

## 📂 Project Structure

```
MCPHACKS/
├── api/
│   ├── API_FRAUD_DETECT/          # Django project root
│   │   ├── API_FRAUD_DETECT/      # Settings module
│   │   │   ├── settings.py        # Django configuration (environment-aware)
│   │   │   ├── urls.py
│   │   │   ├── asgi.py
│   │   │   └── wsgi.py
│   │   ├── manage.py
│   │   ├── Dockerfile            # Django Docker image
│   │   ├── entrypoint.sh          # Container startup script
│   │   └── requirements.txt       # Python dependencies
│   └── requirements.txt           # Root API requirements
│
├── frontend/
│   └── frontend_fraud_detect/     # React/Vite project root
│       ├── src/
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── Dockerfile            # React Docker image
│
├── docker-compose.yml             # Docker Compose orchestration
├── .env.template                  # Environment variables template
├── .gitignore
└── README.md                      # This file
```

## 🐛 Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

```bash
# Find process using port (e.g., 5173)
lsof -i :5173

# Kill process
kill -9 <PID>

# Or change port in .env
FRONTEND_PORT=5174
```

### Database Connection Failed

```bash
# Check if database container is healthy
docker-compose ps

# View database logs
docker-compose logs db

# Restart database
docker-compose restart db

# Wait a few seconds and check again
docker-compose ps
```

### Frontend Can't Reach API

1. Verify API container is running:
   ```bash
   docker-compose logs api
   ```

2. Check CORS configuration in `api/API_FRAUD_DETECT/API_FRAUD_DETECT/settings.py`:
   ```python
   CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://frontend:5173']
   ```

3. Ensure frontend is using correct API URL in `.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

### Container Exit Code 1

Check logs for detailed error:

```bash
docker-compose logs [service-name]
```

Common causes:
- Database connection timeout → Check DB_HOST, DB_PORT
- Missing migrations → Run `docker-compose exec api python manage.py migrate`
- Syntax errors → Check code changes

### Rebuild Everything from Scratch

```bash
# Remove all containers, volumes, and images
docker-compose down -v
docker system prune -a

# Rebuild and start
docker-compose build --no-cache
docker-compose up -d
```

## 🛠️ Development Workflow

### Local Development (No Docker)

For faster local development without containers:

1. Create Python virtual environment:
   ```bash
   cd api/API_FRAUD_DETECT
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r ../../requirements.txt
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend/frontend_fraud_detect
   npm install
   ```

3. Run services individually:
   ```bash
   # Terminal 1: Database (using Docker)
   docker run -d -p 5432:5432 --name fraud_db \
     -e POSTGRES_USER=frauduser \
     -e POSTGRES_PASSWORD=fraudpass123 \
     -e POSTGRES_DB=fraud_detect \
     postgres:16-alpine

   # Terminal 2: Django API
   cd api/API_FRAUD_DETECT
   python manage.py runserver

   # Terminal 3: React Frontend
   cd frontend/frontend_fraud_detect
   npm run dev
   ```

### Docker Development Tips

1. **Hot Reload**: Both Django and Vite support hot reload in containers via volume mounts
2. **Persistent Data**: Database data is persisted in named volume `postgres_data`
3. **Logs**: Always check logs when things go wrong: `docker-compose logs [service]`

## 📦 Production Deployment

For production deployment:

1. Update `.env` with production values:
   ```env
   DEBUG=False
   SECRET_KEY=<generate-strong-secret>
   ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com
   ```

2. Use `gunicorn` instead of development server (update `entrypoint.sh`)

3. Configure reverse proxy (nginx) for static files and HTTPS

4. Use managed database service (AWS RDS, Google Cloud SQL)

5. Set up CI/CD pipeline for automated testing and deployment

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open Pull Request

## 📄 License

[Add your license here]

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Last Updated:** 2026-05-31
**Version:** 1.0.0
