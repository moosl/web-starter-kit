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

# ── Read APP_NAME from .dev.vars ─────────────
APP_NAME="web-starter-kit"
if [ -f ".dev.vars" ]; then
  _app_name=$(grep -E '^APP_NAME=' .dev.vars | head -1 | cut -d'=' -f2-)
  if [ -n "$_app_name" ]; then
    APP_NAME="$_app_name"
  fi
fi

WORKER_NAME="$APP_NAME"
DB_NAME="${APP_NAME}-db"
R2_NAME="${APP_NAME}-uploads"

echo "  App name:  $WORKER_NAME"
echo "  D1:        $DB_NAME"
echo "  R2:        $R2_NAME"
echo ""

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
echo "[1/9] Checking Cloudflare login..."
if ! $WRANGLER whoami > /dev/null 2>&1; then
  echo "  Not logged in. Opening browser..."
  $WRANGLER login
fi
echo "[OK]  Logged in to Cloudflare"
echo ""

# ── 2. Update wrangler.toml resource names ───
echo "[2/9] Updating wrangler.toml..."
sed -i.bak "s|^name = .*|name = \"$WORKER_NAME\"|" wrangler.toml && rm -f wrangler.toml.bak
sed -i.bak "s|^database_name = .*|database_name = \"$DB_NAME\"|" wrangler.toml && rm -f wrangler.toml.bak
sed -i.bak "s|^bucket_name = .*|bucket_name = \"$R2_NAME\"|" wrangler.toml && rm -f wrangler.toml.bak
echo "[OK]  wrangler.toml updated"
echo ""

# ── 3. Create D1 database ───────────────────
echo "[3/9] Setting up D1 database..."

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

# ── 4. Create R2 bucket ─────────────────────
echo "[4/9] Setting up R2 bucket..."
if $WRANGLER r2 bucket list 2>/dev/null | grep -q "$R2_NAME"; then
  echo "[OK]  R2 '$R2_NAME' already exists"
else
  $WRANGLER r2 bucket create "$R2_NAME" > /dev/null 2>&1
  echo "[OK]  Created R2 '$R2_NAME'"
fi
echo ""

# ── 5. Create KV namespace ──────────────────
KV_TITLE="KV"
echo "[5/9] Setting up KV namespace..."

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

# ── 6. Set secrets from .dev.vars ─────────────
echo "[6/9] Configuring secrets..."
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
      # Skip APP_NAME — it's config, not a runtime secret
      [[ "$KEY" == "APP_NAME" ]] && continue
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

# ── 7. Generate migrations (if schema changed) ──
echo "[7/9] Checking for schema changes..."
npm run db:generate 2>/dev/null || true
echo ""

# ── 8. Build ──────────────────────────────────
echo "[8/9] Building project..."
npm run build
echo ""

# ── 9. Migrate + Deploy ──────────────────────
echo "[9/9] Migrating database & deploying..."
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
echo "     Cloudflare Dashboard > Workers & Pages > $WORKER_NAME > Settings > Domains"
echo ""
echo "  2. Update Google OAuth redirect URI to your production URL:"
echo "     https://your-domain.com/login/google/callback"
echo ""
echo "  3. Set up CI/CD (optional):"
echo "     Add CLOUDFLARE_API_TOKEN to GitHub repo secrets"
echo "     Push to main -> auto-deploys"
echo ""
