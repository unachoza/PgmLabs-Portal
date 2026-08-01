#!/bin/sh
set -e

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

if [ ! -f "db/app.db" ]; then
  echo "Initializing database..."
  npm run db:init
  echo "Seeding demo data..."
  npm run db:seed
fi

echo "Starting app at http://localhost:3000"
npm run dev
