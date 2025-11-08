#!/bin/bash
set -euo pipefail

if [ ! -f package-lock.json ]; then
  echo "package-lock.json が見つかりません" >&2
  exit 1
fi

npm ci
npm run lint
npm run type-check
npm run build
