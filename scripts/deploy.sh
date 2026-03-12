#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Web Starter Kit - Production Deploy"
echo "========================================="
echo ""

# ── Resolve wrangler binary ───────────────────
if [ -x "./node_modules/.bin/wrangler" ]; then
  WRANGLER="./node_modules/.bin/wrangler"
else
  WRANGLER="npx wrangler"
fi

# ── Helper ───────────────────────────────────
# Update or insert a key in wrangler.toml.
# Handles: commented-out lines, existing values, and missing keys.
# Usage: update_toml "database_id" "abc-123" "binding = \"DB\""
#   3rd arg (anchor) is used to insert after if key is missing entirely.
update_toml() {
  local key="$1" value="$2" anchor="${3:-}" file="wrangler.toml"
  # Replace commented-out line: # database_id ... -> database_id = "value"
  if grep -qE "^#[[:space:]]*$key" "$file" 2>/dev/null; then
    sed -i.bak "s|^#.*$key.*|$key = \"$value\"|" "$file" && rm -f "$file.bak"
  # Replace existing uncommented line
  elif grep -qE "^$key[[:space:]]*=" "$file" 2>/dev/null; then
    sed -i.bak "s|^$key[[:space:]]*=.*|$key = \"$value\"|" "$file" && rm -f "$file.bak"
  # Insert after anchor line if provided
  elif [ -n "$anchor" ] && grep -qF "$anchor" "$file" 2>/dev/null; then
    sed -i.bak "/$anchor/a\\
$key = \"$value\"" "$file" && rm -f "$file.bak"
  fi
}

# ── 1. Check wrangler login ─────────────────
echo "[1/8] Checking Cloudflare login..."
if ! $WRANGLER whoami > /dev/null 2>&1; then
  echo "  Not logged in. Opening browser..."
  $WRANGLER login
fi
echo "[OK]  Logged in to Cloudflare"
echo ""

# ── 2. Create D1 database ───────────────────
DB_NAME="web-starter-kit-db"
echo "[2/8] Setting up D1 database..."

DB_JSON=$($WRANGLER d1 list --json 2>/dev/null || echo "[]")
if echo "$DB_JSON" | grep -q "\"name\":[[:space:]]*\"$DB_NAME\""; then
  DB_ID=$(echo "$DB_JSON" | python3 -c "
import sys, json
for db in json.load(sys.stdin):
    if db['name'] == '$DB_NAME':
        print(db['uuid'])
        break
" 2>/dev/null || true)
  echo "[OK]  D1 '$DB_NAME' already exists ($DB_ID)"
else
  DB_OUTPUT=$($WRANGLER d1 create "$DB_NAME" 2>&1)
  DB_ID=$(echo "$DB_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  echo "[OK]  Created D1 '$DB_NAME' ($DB_ID)"
fi

if [ -n "$DB_ID" ]; then
  update_toml "database_id" "$DB_ID" 'binding = "DB"'
fi
echo ""

# ── 3. Create R2 bucket ─────────────────────
R2_NAME="web-starter-kit-uploads"
echo "[3/8] Setting up R2 bucket..."
if $WRANGLER r2 bucket list 2>/dev/null | grep -q "$R2_NAME"; then
  echo "[OK]  R2 '$R2_NAME' already exists"
else
  $WRANGLER r2 bucket create "$R2_NAME" > /dev/null 2>&1
  echo "[OK]  Created R2 '$R2_NAME'"
fi

if ! grep -q "bucket_name" wrangler.toml; then
  sed -i.bak '/binding = "R2"/a\
bucket_name = "'"$R2_NAME"'"' wrangler.toml && rm -f wrangler.toml.bak
fi
echo ""

# ── 4. Create KV namespace ──────────────────
KV_TITLE="KV"
echo "[4/8] Setting up KV namespace..."

KV_JSON=$($WRANGLER kv namespace list 2>/dev/null || echo "[]")
EXISTING_KV=$(echo "$KV_JSON" | python3 -c "
import sys, json
for ns in json.load(sys.stdin):
    if ns['title'] == '$KV_TITLE':
        print(ns['id'])
        break
" 2>/dev/null || true)

if [ -n "$EXISTING_KV" ]; then
  KV_ID="$EXISTING_KV"
  echo "[OK]  KV '$KV_TITLE' already exists ($KV_ID)"
else
  KV_OUTPUT=$($WRANGLER kv namespace create KV 2>&1)
  KV_ID=$(echo "$KV_OUTPUT" | grep -oE '[0-9a-f]{32}' | head -1)
  echo "[OK]  Created KV namespace ($KV_ID)"
fi

if [ -n "$KV_ID" ]; then
  update_toml "id" "$KV_ID" 'binding = "KV"'
fi
echo ""

# ── 5. Set secrets from .dev.vars ─────────────
echo "[5/8] Configuring secrets..."
echo ""

DEV_VARS_FILE=".dev.vars"
if [ ! -f "$DEV_VARS_FILE" ]; then
  echo "  [SKIP] No .dev.vars file found — skipping secrets."
  echo "         Set secrets manually later with: $WRANGLER secret put SECRET_NAME"
  echo ""
else
  SET_COUNT=0
  SKIP_COUNT=0

  while IFS= read -r line || [ -n "$line" ]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "$line" ]] && continue
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*) ]]; then
      KEY="${BASH_REMATCH[1]}"
      VALUE="${BASH_REMATCH[2]}"
      if [ -n "$VALUE" ]; then
        echo "$VALUE" | $WRANGLER secret put "$KEY" > /dev/null 2>&1
        SET_COUNT=$((SET_COUNT + 1))
        echo "  $KEY -> set"
      else
        SKIP_COUNT=$((SKIP_COUNT + 1))
        echo "  $KEY -> skipped (empty)"
      fi
    fi
  done < "$DEV_VARS_FILE"

  echo ""
  echo "[OK]  $SET_COUNT secrets set, $SKIP_COUNT skipped (empty values)"
  echo ""
fi

# ── 6. Generate migrations (if schema changed) ──
echo "[6/8] Checking for schema changes..."
npm run db:generate 2>/dev/null || true
echo ""

# ── 7. Build ──────────────────────────────────
echo "[7/8] Building project..."
npm run build
echo ""

# ── 8. Migrate + Deploy ──────────────────────
echo "[8/8] Migrating database & deploying..."
$WRANGLER d1 migrations apply DB --remote
echo ""
$WRANGLER deploy
echo ""

# ── Done ─────────────────────────────────────
echo "========================================="
echo "  Deploy complete!"
echo "========================================="
echo ""
echo "  Your app is live. Next steps:"
echo ""
echo "  1. Add a custom domain:"
echo "     Cloudflare Dashboard > Workers & Pages > web-starter-kit > Settings > Domains"
echo ""
echo "  2. Update Google OAuth redirect URI to your production URL:"
echo "     https://your-domain.com/login/google/callback"
echo ""
echo "  3. Set up CI/CD (optional):"
echo "     Add CLOUDFLARE_API_TOKEN to GitHub repo secrets"
echo "     Push to main -> auto-deploys"
echo ""
