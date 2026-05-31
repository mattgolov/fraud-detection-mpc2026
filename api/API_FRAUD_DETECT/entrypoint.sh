#!/bin/bash
# entrypoint.sh: Django application startup script
# Handles database readiness check, migrations, and server startup

set -e

# Configuration
DB_HOST=${DB_HOST:-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-frauduser}
MAX_RETRIES=30
RETRY_COUNT=0

echo "=========================================="
echo "MCPHACKS - Django API Startup"
echo "=========================================="
echo "Environment: DEBUG=${DEBUG}"
echo "Database: $DB_HOST:$DB_PORT"
echo ""

# Wait for database to be ready
echo "Waiting for PostgreSQL database at $DB_HOST:$DB_PORT..."
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; then
        echo "✓ Database is ready!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        echo "✗ Database failed to become ready after $MAX_RETRIES attempts"
        exit 1
    fi

    echo "  Attempt $RETRY_COUNT/$MAX_RETRIES - Waiting 1 second..."
    sleep 1
done

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
