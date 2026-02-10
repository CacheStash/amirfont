#!/bin/bash

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"
BACKUP_FILE="$TARGET_DIR/${PROJECT_NAME}_$TIMESTAMP.tar.gz"

# 1. Pastikan folder backup tersedia
mkdir -p "$TARGET_DIR"

echo "📦 Memulai Backup ke $BACKUP_FILE..."
tar --exclude='node_modules' --exclude='.git' -czf "$BACKUP_FILE" .

# 2. Rotasi Otomatis: Hanya simpan 5 file terbaru
echo "🧹 Membersihkan backup lama (Menyimpan 5 terbaru)..."
# Tambahkan 2>/dev/null agar tidak error jika folder masih kosong
ls -t "$TARGET_DIR/${PROJECT_NAME}"_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm

echo "🔨 Memulai Build..."
npm run build

echo "🚀 Deploy ke Cloudflare Workers..."
# PERBAIKAN: Tambahkan flag --assets agar env.ASSETS di index.js tidak undefined
npx wrangler deploy --assets ./dist

echo "📤 Git Push ke Origin Main..."
git add .
git commit -m "update $TIMESTAMP: fixed assets binding and deploy"
git push origin main

echo "✅ Selesai! Cek di: https://subqi-studio.fontshop.workers.dev/"