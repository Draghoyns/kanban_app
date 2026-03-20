#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"

# ── colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

info()  { echo -e "${CYAN}▶ $*${NC}"; }
ok()    { echo -e "${GREEN}✔ $*${NC}"; }
error() { echo -e "${RED}✖ $*${NC}"; exit 1; }

# ── Python dependencies (uv) ─────────────────────────────────────────────────
info "Setting up Python environment with uv…"
cd "$BACKEND"
uv sync --quiet
ok "Python deps ready"

# ── Node / npm dependencies ───────────────────────────────────────────────────
info "Installing frontend dependencies…"
cd "$FRONTEND"
npm install --silent
ok "Node deps ready"

# ── Start both servers ────────────────────────────────────────────────────────
info "Starting backend on http://localhost:8000  …"
cd "$BACKEND"
uv run python run.py &
BACKEND_PID=$!

sleep 1

info "Starting frontend on http://localhost:5173 …"
cd "$FRONTEND"
npm run dev &
FRONTEND_PID=$!

ok "Both servers running. Press Ctrl+C to stop."

cleanup() {
  info "Stopping servers…"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup INT TERM

wait "$BACKEND_PID" "$FRONTEND_PID"
