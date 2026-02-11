#!/bin/bash

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"
BACKUP_FILE="$TARGET_DIR/${PROJECT_NAME}_$TIMESTAMP.tar.gz"

# 1. Konfirmasi Backup (Agar 5 slot backup tidak cepat habis)
echo "❓ Buat backup baru? (y/n)"
read -r answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    mkdir -p "$TARGET_DIR"
    echo "📦 Memulai Backup ke $BACKUP_FILE..."
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf "$BACKUP_FILE" .
    
    echo "🧹 Rotasi: Menyimpan 5 backup terbaru..."
    ls -t "$TARGET_DIR/${PROJECT_NAME}"_*.tar.gz | tail -n +6 | xargs -r rm 2>/dev/null
else
    echo "⏭️  Skip backup..."
fi

# 2. Build & Deploy
echo "🔨 Memulai Build..."
npm run build

echo "🚀 Deploy ke Cloudflare..."
npx wrangler deploy

# 3. Git Push (Hanya jika ada file yang berubah)
if [[ -n $(git status -s) ]]; then
    echo "📤 Push perubahan ke GitHub..."
    git add .
    git commit -m "update $TIMESTAMP: fix spa routing and add image caching"
    git push origin main
else
    echo "✅ Kode sudah sinkron dengan GitHub."
fi

echo "✨ SELESAI! Cek /admin sekarang, harusnya sudah normal."