#!/bin/bash

# --- KONFIGURASI ---
PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"

mkdir -p "$TARGET_DIR"

echo "📂 Project: $PROJECT_NAME"
echo "📦 Sedang mencadangkan (Backup)..."

# Compress (Backup Fisik)
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='.vscode' -czf "$TARGET_DIR/${PROJECT_NAME}_${TIMESTAMP}.tar.gz" .

# Build & Deploy
echo "🏗️ Membangun project..."
npm run build

echo "🚀 Mengunggah ke Cloudflare Workers..."
# Penting: Menggunakan index.ts sebagai otak dan ./dist sebagai aset statis
npx wrangler deploy index.ts --assets ./dist --compatibility-date=2026-02-02 --name=subqi-studio

# Git Push
echo "📤 Mengirim ke GitHub..."
git add .
git commit -m "update $TIMESTAMP: perbaikan integrasi R2"
git push origin main

echo "✅ Selesai! Cek di: https://subqi-studio.fontshop.workers.dev/api/check"