#!/bin/bash

echo "🔧 Configuration Redis pour Action Cable"
echo "========================================="

# Vérifier si Redis est installé
if ! command -v redis-server &> /dev/null; then
    echo "📦 Installation de Redis..."
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y redis-server
    # macOS
    elif command -v brew &> /dev/null; then
        brew install redis
    else
        echo "❌ Impossible d'installer Redis automatiquement"
        echo "Veuillez installer Redis manuellement selon votre OS"
        exit 1
    fi
else
    echo "✅ Redis déjà installé"
fi

# Démarrer Redis
echo "🚀 Démarrage de Redis..."
if command -v systemctl &> /dev/null; then
    # Systemd
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
    echo "✅ Redis démarré avec systemctl"
elif command -v brew &> /dev/null; then
    # macOS avec Homebrew
    brew services start redis
    echo "✅ Redis démarré avec brew services"
else
    # Démarrage manuel
    redis-server --daemonize yes
    echo "✅ Redis démarré manuellement"
fi

# Vérifier que Redis fonctionne
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis fonctionne correctement"
else
    echo "❌ Problème avec Redis"
    exit 1
fi

echo ""
echo "🎉 Redis est prêt pour Action Cable!"
echo "🔌 Vous pouvez maintenant démarrer votre application Rails" 