#!/bin/bash

# Script pour mettre à jour le GOOGLE_CLIENT_ID partout

if [ -z "$1" ]; then
    echo "❌ Usage: ./update_client_id.sh VOTRE_NOUVEAU_CLIENT_ID"
    echo "Exemple: ./update_client_id.sh 123456789-abcdefg.apps.googleusercontent.com"
    exit 1
fi

NEW_CLIENT_ID="$1"

echo "📝 Mise à jour du GOOGLE_CLIENT_ID vers: $NEW_CLIENT_ID"

# Mettre à jour config.js
sed -i "s/GOOGLE_CLIENT_ID : '.*'/GOOGLE_CLIENT_ID : '$NEW_CLIENT_ID'/" web/js/app/config.js
echo "✅ web/js/app/config.js mis à jour"

# Mettre à jour .env
sed -i "s/GOOGLE_CLIENT_ID=.*/GOOGLE_CLIENT_ID=$NEW_CLIENT_ID/" api/.env
echo "✅ api/.env mis à jour"

echo ""
echo "🔄 Redémarrez maintenant:"
echo "1. Le serveur Rails (Ctrl+C puis 'rails server')"
echo "2. Le serveur Python (Ctrl+C puis 'python3 -m http.server 8000')"
echo "3. Rechargez la page dans le navigateur (Ctrl+Shift+R)"














