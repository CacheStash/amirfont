#!/bin/bash

PROJECT_NAME=$(basename "$PWD")
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
TARGET_DIR="../backups/$PROJECT_NAME"
BACKUP_FILE="$TARGET_DIR/${PROJECT_NAME}_$TIMESTAMP.tar.gz"

# 1. Konfirmasi Backup (Mencegah backup lama tersingkir)
echo "❓ Apakah kamu ingin membuat backup baru sebelum deploy? (y/n)"
read -r answer
if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    mkdir -p "$TARGET_DIR"
    echo "📦 Memulai Backup ke $BACKUP_FILE..."
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf "$BACKUP_FILE" .
    
    # Rotasi Otomatis: Hanya hapus kalau user setuju backup
    echo "🧹 Membersihkan backup lama (Menyimpan 5 terbaru)..."
    ls -t "$TARGET_DIR/${PROJECT_NAME}"_*.tar.gz | tail -n +6 | xargs -r rm
else
    echo "⏭️  Melewati proses backup..."
fi

# 2. Build Project
echo "🔨 Memulai Build..."
npm run build

# 3. Deploy ke Cloudflare (Simple mode sesuai wrangler.toml)
echo "🚀 Deploy ke Cloudflare Workers..."
npx wrangler deploy

# 4. Git Push Otomatis (Hanya jika ada perubahan)
echo "📤 Mengecek perubahan untuk Git..."
if [[ -n $(git status -s) ]]; then
    git add .
    git commit -m "update $TIMESTAMP: manual deploy and build"
    git push origin main
    echo "✅ Berhasil Push ke GitHub."
else
    echo "ℹ️  Tidak ada perubahan kode untuk di-push."
fi

echo "✅ SELESAI! Cek webmu sekarang."