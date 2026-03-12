#!/usr/bin/env bash
set -e

echo "========================================="
echo "  Web Starter Kit - Production Deploy"
echo "========================================="
echo ""

# ── Helper ───────────────────────────────────
update_toml() {
  local key="$1" value="$2" file="wrangler.toml"
  if grep -q "$key" "$file" 2>/dev/null; then
    sed -i.bak "s|$key.*|$key = \"$value\"|" "$file" && rm -f "$file.bak"
  fi
}

# ── 1. Check wrangler login ─────────────────
echo "[1/6] Checking Cloudflare login..."
if ! npx wrangler whoami > /dev/null 2>&1; then
  echo "  Not logged in. Opening browser..."
  npx wrangler login
fi
echo "[OK]  Logged in to Cloudflare"
echo ""

# ── 2. Create D1 database ───────────────────
DB_NAME="web-starter-kit-db"
echo "[2/6] Setting up D1 database..."
EXISTING_DB=$(npx wrangler d1 list --json 2>/dev/null | grep -o "\"uuid\":\"[^\"]*\"" | head -1 | cut -d'"' -f4 || true)

if npx wrangler d1 list --json 2>/dev/null | grep -q "\"name\":\"$DB_NAME\""; then
  DB_ID=$(npx wrangler d1 list --json 2>/dev/null | python3 -c "
import sys, json
for db in json.load(sys.stdin):
    if db['name'] == '$DB_NAME':
        print(db['uuid'])
        break
" 2>/dev/null || true)
  echo "[OK]  D1 '$DB_NAME' already exists ($DB_ID)"
else
  DB_OUTPUT=$(npx wrangler d1 create "$DB_NAME" 2>&1)
  DB_ID=$(echo "$DB_OUTPUT" | python3 -c "
import sys, json
lines = sys.stdin.read()
# Find JSON block in output
start = lines.index('{')
end = lines.rindex('}') + 1
data = json.loads(lines[start:end])
print(data.get('uuid', data.get('database_id', '')))
" 2>/dev/null || echo "$DB_OUTPUT" | grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | head -1)
  echo "[OK]  Created D1 '$DB_NAME' ($DB_ID)"
fi

if [ -n "$DB_ID" ]; then
  update_toml "database_id" "$DB_ID"
  # Also add database_name if missing
  if ! grep -q "database_name" wrangler.toml; then
    sed -i.bak "/database_id/a\\
database_name = \"$DB_NAME\"" wrangler.toml && rm -f wrangler.toml.bak
  fi
fi
echo ""

# ── 3. Create R2 bucket ─────────────────────
R2_NAME="web-starter-kit-uploads"
echo "[3/6] Setting up R2 bucket..."
if npx wrangler r2 bucket list 2>/dev/null | grep -q "$R2_NAME"; then
  echo "[OK]  R2 '$R2_NAME' already exists"
else
  npx wrangler r2 bucket create "$R2_NAME" > /dev/null 2>&1
  echo "[OK]  Created R2 '$R2_NAME'"
fi

if ! grep -q "bucket_name" wrangler.toml; then
  sed -i.bak "/binding = \"R2\"/a\\
bucket_name = \"$R2_NAME\"" wrangler.toml && rm -f wrangler.toml.bak
fi
echo ""

# ── 4. Create KV namespace ──────────────────
KV_NAME="web-starter-kit-KV"
echo "[4/6] Setting up KV namespace..."
EXISTING_KV=$(npx wrangler kv namespace list --json 2>/dev/null | python3 -c "
import sys, json
for ns in json.load(sys.stdin):
    if ns['title'] == '$KV_NAME':
        print(ns['id'])
        break
" 2>/dev/null || true)

if [ -n "$EXISTING_KV" ]; then
  KV_ID="$EXISTING_KV"
  echo "[OK]  KV '$KV_NAME' already exists ($KV_ID)"
else
  KV_OUTPUT=$(npx wrangler kv namespace create KV 2>&1)
  KV_ID=$(echo "$KV_OUTPUT" | grep -oE '[0-9a-f]{32}' | head -1)
  echo "[OK]  Created KV namespace ($KV_ID)"
fi

if [ -n "$KV_ID" ]; then
  update_toml "id" "$KV_ID"
fi
echo ""

# ── 5. Set secrets ───────────────────────────
echo "[5/6] Configuring secrets..."
echo ""
echo "  For each secret, paste the value and press Enter."
echo "  Press Enter with no value to skip."
echo ""

SECRETS=(
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "REPLICATE_API_TOKEN"
  "CREEM_API_KEY"
  "CREEM_WEBHOOK_SECRET"
  "RESEND_API_KEY"
  "TURNSTILE_SECRET_KEY"
  "R2_ACCESS_KEY_ID"
  "R2_SECRET_ACCESS_KEY"
  "R2_ENDPOINT"
)

SKIPPED=0
SET_COUNT=0

for SECRET in "${SECRETS[@]}"; do
  printf "  %s: " "$SECRET"
  read -r VALUE
  if [ -n "$VALUE" ]; then
    echo "$VALUE" | npx wrangler secret put "$SECRET" > /dev/null 2>&1
    SET_COUNT=$((SET_COUNT + 1))
    echo "    -> set"
  else
    SKIPPED=$((SKIPPED + 1))
    echo "    -> skipped"
  fi
done

echo ""
echo "[OK]  $SET_COUNT secrets set, $SKIPPED skipped"
echo "      (you can set skipped ones later with: npx wrangler secret put SECRET_NAME)"
echo ""

# ── 6. Migrate + Deploy ─────────────────────
echo "[6/6] Migrating database & deploying..."
npx wrangler d1 migrations apply DB --remote
echo ""
npx wrangler deploy
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
