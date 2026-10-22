#!/bin/bash

# ==============================================================================
# Drishti-AI: AICTE Agentic Decision-Support Platform Startup Script
# Starts AI Service (8000), Gateway (5001), and Next.js Frontend (3000)
# ==============================================================================

cleanup() {
    echo ""
    echo "Shutting down all Drishti-AI services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

PLATFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================================="
echo " Starting Drishti-AI (AICTE Agentic Platform)"
echo "=========================================================="

# 1. Start Python AI Service
echo "[1/3] Starting Python AI Service on http://localhost:8000 ..."
(cd "$PLATFORM_DIR/ai-service" && python3 main.py) &

sleep 2

# 2. Start Gateway
echo "[2/3] Starting Fastify API Gateway on http://localhost:5001 ..."
(cd "$PLATFORM_DIR/gateway" && npm run dev) &

sleep 2

# 3. Start Frontend
echo "[3/3] Starting Next.js Frontend on http://localhost:3000 ..."
(cd "$PLATFORM_DIR/frontend" && npm run dev) &

echo ""
echo "=========================================================="
echo " All services running!"
echo " Web Dashboard:  http://localhost:3000"
echo " API Gateway:    http://localhost:5001/health"
echo " AI Service:     http://localhost:8000/health"
echo " Press Ctrl+C at any time to stop all services."
echo "=========================================================="
echo ""

wait
