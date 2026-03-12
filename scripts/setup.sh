#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Web Starter Kit - Local Setup"
echo "========================================="
echo ""

# 1. Copy config files if they don't exist
if [ ! -f .dev.vars ]; then
  cp .dev.vars.example .dev.vars
  echo "[OK] Created .dev.vars from .dev.vars.example"
  echo "     -> Fill in your secrets before running the app"
else
  echo "[OK] .dev.vars already exists, skipping"
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "[OK] Created .env from .env.example"
else
  echo "[OK] .env already exists, skipping"
fi

echo ""

# 2. Apply D1 migrations locally
echo "Applying database migrations (local D1)..."
npx wrangler d1 migrations apply DB --local
echo "[OK] Database ready"
echo ""

# 3. Done
echo "========================================="
echo "  Setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo ""
echo "  1. Edit .dev.vars and add your API keys"
echo "     (see README.md for where to get each key)"
echo ""
echo "  2. Or disable features you don't need yet"
echo "     in src/lib/config.ts"
echo ""
echo "  3. Start the dev server:"
echo "     npm run dev"
echo ""
echo "  Open http://localhost:8787"
echo ""
