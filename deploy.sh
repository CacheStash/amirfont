#!/bin/bash

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"
mkdir -p "$TARGET_DIR"

echo "📦 Memulai Backup & Build..."
npm run build

echo "🚀 Deploy ke Cloudflare Workers..."
# Cukup jalankan ini, Wrangler akan membaca wrangler.toml secara otomatis
npx wrangler deploy

echo "📤 Git Push..."
git add .
git commit -m "update $TIMESTAMP: fixed R2 with wrangler.toml"
git push origin main

echo "✅ Selesai! Cek di: https://subqi-studio.fontshop.workers.dev/api/check"