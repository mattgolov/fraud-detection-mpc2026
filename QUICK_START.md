# 🚀 MCPHACKS Quick Start - 5 Minutes to Running

## Step 1: Verify Installation ✓
```bash
./verify-setup.sh
```
Expected: `✓ All files verified!`

---

## Step 2: Build Docker Images
```bash
docker-compose build
```
⏱️ ~2-3 minutes (first time only)

---

## Step 3: Start Services
```bash
docker-compose up -d
```

---

## Step 4: Check Status
```bash
docker-compose ps
```

Expected output:
```
NAME                 STATUS
mcphacks_db          Up (healthy)
mcphacks_api         Up
mcphacks_frontend    Up
```

---

## Step 5: Access Services

### 🌐 Frontend
```
http://localhost:5173
```

### 📡 API
```
http://localhost:8000
```

### 👨‍💼 Django Admin
```
http://localhost:8000/admin
```
(Create superuser: `docker-compose exec api python manage.py createsuperuser`)

### 🗄️ Database
```
Host: localhost
Port: 5432
User: frauduser
Password: fraudpass123
Database: fraud_detect
```

---

## 🛑 Stop Services
```bash
docker-compose down
```
(Data persists - it's stored in the postgres_data volume)

---

## 📝 Common Commands

### View Logs
```bash
docker-compose logs -f api         # API logs
docker-compose logs -f frontend    # Frontend logs
docker-compose logs -f db          # Database logs
```

### Run Django Commands
```bash
docker-compose exec api python manage.py migrate
docker-compose exec api python manage.py createsuperuser
docker-compose exec api python manage.py shell
```

### Access Database
```bash
docker-compose exec db psql -U frauduser -d fraud_detect
```

### Rebuild a Service
```bash
docker-compose build --no-cache api
```

---

## ⚙️ Configuration

Edit `.env` to change:
- Database credentials
- API/Frontend ports
- Debug mode
- CORS settings

Then restart: `docker-compose restart`

---

## 🆘 Need Help?

1. **Check logs**: `docker-compose logs [service]`
2. **Read README.md**: Comprehensive documentation
3. **See DEPLOYMENT_CHECKLIST.md**: For security & production setup
4. **Review SETUP_COMPLETE.md**: Detailed architecture overview

---

Generated: 2026-05-31 | Ready to Deploy! ✅
