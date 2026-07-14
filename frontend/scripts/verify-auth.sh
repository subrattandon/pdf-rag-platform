#!/bin/bash
# PDF Sage — Auth Verification Script
# Checks if Clerk auth routes are accessible

echo "=== PDF Sage — Auth Verification ==="
echo ""

FRONTEND_URL="http://localhost:3000"

echo "Checking frontend at $FRONTEND_URL..."

# Check if frontend is running
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    echo "✓ Frontend is running"
else
    echo "✗ Frontend is not running. Start it with: cd frontend && npm run dev"
    exit 1
fi

# Check login route
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/login")
echo "GET /login → $HTTP_CODE"

# Check signup route
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/signup")
echo "GET /signup → $HTTP_CODE"

# Check dashboard (should redirect if not authenticated)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/dashboard")
echo "GET /dashboard → $HTTP_CODE"

# Check API health
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/v1/health")
echo "GET /api/v1/health → $HTTP_CODE"

echo ""
echo "=== Done ==="
