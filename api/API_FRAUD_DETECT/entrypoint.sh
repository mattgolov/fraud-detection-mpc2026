#!/bin/bash
# entrypoint.sh: Django application startup script
# Handles migrations and server startup

set -e

echo "=========================================="
echo "MCPHACKS - Django API Startup"
echo "=========================================="
echo "Environment: DEBUG=${DEBUG}"
echo ""

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo ""
echo "=========================================="
echo "Starting Django development server..."
echo "=========================================="
echo "Server will be available at http://0.0.0.0:8000"
echo ""

# Start Django development server
python manage.py runserver 0.0.0.0:8000
