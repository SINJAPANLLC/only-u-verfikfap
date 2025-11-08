#!/bin/bash
set -euo pipefail

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI が見つかりません。先に 'npm install -g firebase-tools' を実行してください。" >&2
  exit 1
fi

if [ -z "${FIREBASE_PROJECT_ID:-}" ]; then
  echo "FIREBASE_PROJECT_ID を環境変数で指定してください。" >&2
  exit 1
fi

firebase use "$FIREBASE_PROJECT_ID" --add
firebase deploy --only firestore:indexes,firestore:rules,storage
