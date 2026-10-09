# Mini E-commerce Platform

Monorepo: Next.js frontend · Express/TypeScript API · BullMQ worker · PostgreSQL · Redis.

## Quick start (local dev, hot reload)

```bash
cp .env.example .env        # then change the secrets
docker compose up --build   # auto-merges docker-compose.override.yml
```

| Service        | URL / Port                          |
|----------------|-------------------------------------|
| Frontend       | http://localhost:3000               |
| API            | http://localhost:4000/health/ready  |
| Products API   | http://localhost:4000/api/v1/products |
| PostgreSQL     | localhost:5432                      |
| Redis          | localhost:6379                      |

## Production-like run (no bind mounts, multi-stage prod images)

```bash
docker compose -f docker-compose.yml up --build -d
```

## Useful commands

```bash
docker compose logs -f backend-api
docker compose exec postgres psql -U ecom -d ecommerce
docker compose down            # stop
docker compose down -v         # stop AND wipe DB/Redis volumes (re-runs init.sql)
```

## Notes
- `docker/postgres/init.sql` only runs on the **first** start of an empty `pgdata` volume. Use `down -v` to re-seed.
- Prices are stored in minor units (paise/cents) as integers.
- Phase 2 will add auth, cart/orders and Razorpay/Stripe payments + webhooks (worker-service).
- Phase 4: CI/CD workflows go in `.github/workflows/`.

---

# Phase 2: Auth, Cart, Orders & Payment Webhooks

> **Upgrading from Phase 1?** The schema changed (order statuses, `refresh_tokens`, `payments` columns).
> Run `docker compose down -v` once so `init.sql` re-runs, and re-copy `.env.example` (new vars).

## Flow
```
Browser ─checkout─▶ API: BEGIN; decrement stock; INSERT order(PENDING_PAYMENT); create Razorpay order; COMMIT
Razorpay ─webhook─▶ API: verify HMAC → INSERT webhook_events (idempotent) → enqueue → 200 OK
                    Worker: payment.captured → order PAID + clear Redis cart
                            payment.failed   → order FAILED + restore stock
Browser polls GET /orders/:id until status leaves PENDING_PAYMENT
Worker reaper: unpaid orders older than ORDER_EXPIRY_MINUTES → CANCELLED + stock restored
```

## Test the full cycle (no Razorpay account needed: `PAYMENT_MODE=mock`)

```bash
docker compose up --build -d && docker compose logs -f worker-service   # keep this visible
API=http://localhost:4000/api/v1
```

**1. Register + login (admin and customer)**
```bash
curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"password123","fullName":"Admin","role":"admin","adminCode":"dev_admin_code"}'
curl -s -X POST $API/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"jane@test.com","password":"password123","fullName":"Jane"}'

ADMIN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"password123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["accessToken"])')
# -c saves the HTTP-only refresh cookie
TOKEN=$(curl -s -c jar.txt -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"jane@test.com","password":"password123"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["accessToken"])')
```

**2. Refresh rotation** (cookie jar is read AND rewritten; replaying an old cookie revokes the session family)
```bash
curl -s -b jar.txt -c jar.txt -X POST $API/auth/refresh
```

**3. Admin creates a product (customer gets 403)**
```bash
curl -s -X POST $API/products -H "Authorization: Bearer $ADMIN" -H 'Content-Type: application/json' \
  -d '{"slug":"test-mug","name":"Test Mug","price_cents":29900,"stock":3}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/products -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"slug":"x","name":"x","price_cents":1,"stock":1}'   # 403
```

**4. Cart (Redis)**
```bash
PID=$(curl -s $API/products/test-mug | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["id"])')
curl -s -X POST $API/cart/items -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"productId\":\"$PID\",\"quantity\":2}"
curl -s $API/cart -H "Authorization: Bearer $TOKEN"
docker compose exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning keys "cart:*"'
```

**5. Checkout (idempotent)**
```bash
KEY=$(uuidgen)
curl -s -X POST $API/orders/checkout -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $KEY" | tee co.json
curl -s -X POST $API/orders/checkout -H "Authorization: Bearer $TOKEN" -H "Idempotency-Key: $KEY"   # same order, "replayed":true
ORDER=$(python3 -c 'import json;print(json.load(open("co.json"))["data"]["orderId"])')
GW=$(python3 -c 'import json;print(json.load(open("co.json"))["data"]["gateway"]["orderId"])')
curl -s $API/products/test-mug   # stock 3 → 1 (deducted once, not twice)
```

**6a. Success path: signed webhook**
```bash
./scripts/simulate-webhook.sh $GW captured evt_001
./scripts/simulate-webhook.sh $GW captured evt_001   # duplicate event → still 200, worker ignores it
curl -s $API/orders/$ORDER -H "Authorization: Bearer $TOKEN"   # status PAID
curl -s $API/cart -H "Authorization: Bearer $TOKEN"            # empty
```

**6b. Failure path**: repeat steps 4–5 with a new cart, then
```bash
./scripts/simulate-webhook.sh <new_gw_order_id> failed
curl -s $API/products/test-mug   # stock restored
```

**6c. Security checks**
```bash
curl -s -X POST $API/webhooks/razorpay -H 'Content-Type: application/json' -H 'X-Razorpay-Signature: bad' -d '{}'   # 400 INVALID_SIGNATURE
```

**7. Via the UI**: open http://localhost:3000 → Register → Add to cart → Checkout → on the order page click *Simulate success/failure* → status flips automatically.

## Using real Razorpay (test mode)
1. Dashboard → Settings → API Keys (Test Mode) → set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `PAYMENT_MODE=razorpay`.
2. Expose the API: `ngrok http 4000`. Dashboard → Webhooks → URL `https://<id>.ngrok.app/api/v1/webhooks/razorpay`, events `payment.captured`, `payment.failed`, `order.paid`; set a secret and put it in `RAZORPAY_WEBHOOK_SECRET`.
3. `docker compose up -d --force-recreate backend-api`, then pay with Razorpay test cards (e.g. 4111 1111 1111 1111).
