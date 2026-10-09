#!/usr/bin/env bash
# Sends a correctly SIGNED Razorpay-style webhook to the local API.
# Usage: ./scripts/simulate-webhook.sh <razorpay_order_id> [captured|failed] [event_id]
#   Re-run with the same event_id to prove idempotency (second call is a no-op in the worker).
set -euo pipefail
ORDER_ID="${1:?usage: $0 <razorpay_order_id> [captured|failed] [event_id]}"
OUTCOME="${2:-captured}"
EVENT_ID="${3:-evt_sim_$(date +%s%N)}"
SECRET="${RAZORPAY_WEBHOOK_SECRET:-dev_webhook_secret}"   # must equal the API's RAZORPAY_WEBHOOK_SECRET
API="${API_URL:-http://localhost:4000}"

EVENT="payment.captured"; [ "$OUTCOME" = "failed" ] && EVENT="payment.failed"
BODY=$(printf '{"event":"%s","payload":{"payment":{"entity":{"id":"pay_sim_%s","order_id":"%s","status":"%s","currency":"INR"}}}}' \
  "$EVENT" "$(date +%s)" "$ORDER_ID" "$OUTCOME")
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $NF}')

echo "event=$EVENT event_id=$EVENT_ID"
curl -sS -i -X POST "$API/api/v1/webhooks/razorpay" \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: $SIG" \
  -H "X-Razorpay-Event-Id: $EVENT_ID" \
  --data "$BODY"
echo
