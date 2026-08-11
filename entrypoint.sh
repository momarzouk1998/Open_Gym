#!/bin/sh
set -e

echo "==> Running Prisma DB Push to update live PostgreSQL schema..."
./node_modules/.bin/prisma db push --skip-generate --accept-data-loss || npx prisma db push --skip-generate --accept-data-loss || echo "==> DB Push Warning: continuing..."

echo "==> Starting Next.js Production Server..."
exec node server.js
