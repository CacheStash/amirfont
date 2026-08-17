#!/bin/bash

set -e

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"
BACKUP_FILE="$TARGET_DIR/${PROJECT_NAME}_$TIMESTAMP.tar.gz"

# 1. Konfirmasi Backup
echo "❓ Buat backup baru? (y/n)"
read -r answer
if [[ "$answer" =~ ^[Yy]$ ]]; then
    mkdir -p "$TARGET_DIR"
    echo "📦 Memulai Backup ke $BACKUP_FILE..."
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf "$BACKUP_FILE" .
    
    echo "🧹 Rotasi: Menyimpan 5 backup terbaru..."
    ls -t "$TARGET_DIR/${PROJECT_NAME}"_*.tar.gz 2>/dev/null | tail -n +6 | xargs -r rm 2>/dev/null || true
else
    echo "⏭️  Skip backup..."
fi

# 2. Force Export Env & Bersihkan Cache Build
if [ ! -f .env ]; then
    echo "❌ ERROR: File .env tidak ditemukan di root folder!"
    exit 1
fi

echo "🧹 Membersihkan cache build lama..."
rm -rf dist node_modules/.vite

echo "✅ Memuat variabel lingkungan..."
export VITE_SUPABASE_URL="https://ekyggonipxdjbzgkmxwr.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVreWdnb25pcHhkamJ6Z2tteHdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzOTExMjUsImV4cCI6MjA4ODk2NzEyNX0.gdt9tT_ndtfUF38IY3FbkMsca4hpP4x0yv5uh1Ud2HY"

echo "🔨 Memulai Build..."
npm run build

echo "🚀 Deploy ke Cloudflare..."
echo "y" | npx wrangler deploy

# 3. Git Push
if [[ -n $(git status -s) ]]; then
    echo "📤 Push perubahan ke GitHub..."
    git add .
    commit_msg="update $TIMESTAMP: system auto-deploy & config sync"
    git commit -m "$commit_msg"
    git push origin main
else
    echo "✅ Kode sudah sinkron dengan GitHub."
fi

echo "✨ Selesai! Deploy dan sinkronisasi sukses."