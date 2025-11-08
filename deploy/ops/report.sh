#!/bin/bash
set -euo pipefail

if [ -z "${STRIPE_SECRET_KEY:-}" ]; then
  echo "STRIPE_SECRET_KEY を環境変数に設定してください" >&2
  exit 1
fi

if [ -z "${FIREBASE_SERVICE_ACCOUNT:-}" ]; then
  echo "FIREBASE_SERVICE_ACCOUNT(JSON) を環境変数に設定してください" >&2
  exit 1
fi

WORKDIR=$(dirname "$0")
SCRIPT_DIR=$(cd "$WORKDIR" && pwd)

node <<'NODE'
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
(async () => {
  const balance = await stripe.balance.retrieve();
  console.log('--- Stripe Balance Snapshot ---');
  console.log(JSON.stringify(balance, null, 2));
})();
NODE

node <<'NODE'
const { Firestore } = require('@google-cloud/firestore');
const creds = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const db = new Firestore({ projectId: creds.project_id, credentials: creds });
(async () => {
  const liveSnap = await db.collection('liveSessions').get();
  const totalMinutes = liveSnap.docs.reduce((acc, doc) => acc + (doc.data().billing?.totalMinutes || 0), 0);
  console.log('--- Live Usage Summary ---');
  console.log('Live Sessions:', liveSnap.size);
  console.log('Total Minutes Streamed:', totalMinutes);
})();
NODE

