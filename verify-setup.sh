#!/bin/bash

echo "============================================"
echo "MCPHACKS - Setup Verification Script"
echo "============================================"
echo ""

FILES_OK=0
FILES_TOTAL=0

check_file() {
    FILES_TOTAL=$((FILES_TOTAL + 1))
    if [ -f "$1" ]; then
        echo "✓ $1"
        FILES_OK=$((FILES_OK + 1))
    else
        echo "✗ $1 (MISSING)"
    fi
}

check_dir() {
    FILES_TOTAL=$((FILES_TOTAL + 1))
    if [ -d "$1" ]; then
        echo "✓ $1/"
        FILES_OK=$((FILES_OK + 1))
    else
        echo "✗ $1/ (MISSING)"
    fi
}

echo "Checking Configuration Files..."
check_file "docker-compose.yml"
check_file ".env"
check_file ".env.template"
check_file "README.md"
check_file "DEPLOYMENT_CHECKLIST.md"

echo ""
echo "Checking API Configuration..."
check_file "api/requirements.txt"
check_file "api/API_FRAUD_DETECT/Dockerfile"
check_file "api/API_FRAUD_DETECT/entrypoint.sh"
check_file "api/API_FRAUD_DETECT/API_FRAUD_DETECT/settings.py"

echo ""
echo "Checking Frontend Configuration..."
check_file "frontend/frontend_fraud_detect/Dockerfile"

echo ""
echo "Checking Project Directories..."
check_dir "api"
check_dir "frontend"
check_dir "api/API_FRAUD_DETECT"
check_dir "frontend/frontend_fraud_detect"

echo ""
echo "============================================"
echo "Summary: $FILES_OK/$FILES_TOTAL files/dirs present"
echo "============================================"

if [ $FILES_OK -eq $FILES_TOTAL ]; then
    echo "✓ All files verified!"
    echo ""
    echo "Next steps:"
    echo "1. Review .env file for any custom configuration"
    echo "2. Run: docker-compose build"
    echo "3. Run: docker-compose up -d"
    echo "4. Access frontend at http://localhost:5173"
    exit 0
else
    echo "✗ Some files are missing. Please review the output above."
    exit 1
fi
