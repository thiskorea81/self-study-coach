#!/bin/bash
# 문항 배치 작업을 검증→빌드→커밋→푸시까지 한 번에 실행한다.
# 사용: scripts/ship.sh "커밋 메시지"
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${1:-}" ]; then
  echo "사용법: scripts/ship.sh \"커밋 메시지\""
  exit 1
fi

echo "1) 문항 구조 검증..."
node scripts/verify-questions.js

echo "2) 빌드..."
npm run build

echo "3) 커밋..."
git add -A
git commit -m "$1

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"

echo "4) 푸시..."
git push

echo "완료."
