# MCPHACKS - Fraud Detection Platform

A full-stack fraud detection system built with Django REST API and React/Vite frontend, fully containerized with Docker.

**Valsoft Challenge - MPC Hacks 2026**

## Architecture

```
┌─────────────────────────────────────┐
│      MCPHACKS (Docker)              │
├─────────────────────────────────────┤
│                                     │
│  React Frontend ◄────► Django API   │
│  (port 5173)           (port 8000)  │
│                              │      │
│                       SQLite DB     │
│                       (local file)  │
│                                     │
└─────────────────────────────────────┘
```

## Ports

| Service  | Port | Access                |
|----------|------|------------------------|
| Frontend | 5173 | http://localhost:5173 |
| API      | 8000 | http://localhost:8000 |

## Why SQLite?

This app is designed to run **locally on a network administrator's machine**. SQLite eliminates the need for a separate database server and makes deployment simple: just pull the Docker image and run it. Perfect for local network deployment with easy reverse proxy setup.

## Quick Start

### Prerequisites
- **Docker** (version 20.10+)
- **Docker Compose** (version 1.29+)
- **Git**

1. Clone & Setup
```bash
# Clone the repository
git clone <repo-url>
cd MCPHACKS

# Copy environment template to .env
cp .env.template .env

# (Optional) Edit .env for custom configuration
# vim .env
```

2. Build Docker Images
```bash
# Build all Docker images
docker-compose build

# Or build specific service
docker-compose build api      # Django API
docker-compose build frontend # React frontend
docker-compose build db       # PostgreSQL
```

3. Start Services
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

4. Verify Services Are Running

```bash
# Check service status
docker-compose ps

# Expected output:
# NAME                 STATUS
# mcphacks_db          Up (healthy)
# mcphacks_api         Up
# mcphacks_frontend    Up
```

5. Access Services

**Frontend:** http://localhost:5173  
**API:** http://localhost:8000  
**Admin:** http://localhost:8000/admin

## Environment Variables

Create a `.env` file in the project root. Key settings:

```env
# Database (SQLite - no separate DB server needed)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Django
DEBUG=True
SECRET_KEY=your-secret-key-here

# Network access (update for your network)
ALLOWED_HOSTS=localhost,127.0.0.1,your-admin-machine.local

# Frontend
VITE_API_URL=http://localhost:8000
```

See `.env.template` for all options.

## Project Structure

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
