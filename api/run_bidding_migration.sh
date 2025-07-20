#!/bin/bash

echo "🔄 Exécution de la migration pour renommer la table 'encher' en 'bidding'..."

# Se placer dans le répertoire de l'API
cd "$(dirname "$0")"

# Exécuter la migration
bundle exec rails db:migrate

echo "✅ Migration terminée !"

# Optionnel : Afficher le statut des migrations
echo "📊 Statut des migrations :"
bundle exec rails db:migrate:status | tail -5 