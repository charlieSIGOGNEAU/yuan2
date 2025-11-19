#!/bin/bash
# Script de déploiement rapide pour Yuan Game
# Usage: ./QUICK_DEPLOY.sh [skip-test]

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement Yuan Game Frontend"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration (à adapter)
SERVER_USER="user"
SERVER_HOST="votre-serveur.com"
SERVER_PATH="/var/www/yuan-game"

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ Erreur: $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les warnings
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Arrêter tous les serveurs Vite
echo "🛑 Arrêt des serveurs Vite..."
pkill -f "vite" 2>/dev/null || true
sleep 1
success "Serveurs arrêtés"

# 2. Nettoyer le dossier dist
echo "🧹 Nettoyage du dossier dist..."
rm -rf dist/
success "Nettoyage terminé"

# 3. Build
echo "🏗️  Construction du build de production..."
npm run build || error "Échec du build"
success "Build créé avec succès"

# 4. Test du build (sauf si skip-test)
if [ "$1" != "skip-test" ]; then
    echo ""
    echo "🧪 Lancement du serveur preview pour tests..."
    echo "   → Ouvrez http://localhost:4173 dans votre navigateur"
    echo "   → Testez l'application"
    echo "   → Appuyez sur Ctrl+C quand vous avez terminé les tests"
    echo ""
    warning "IMPORTANT: Si les tests échouent, n'appuyez PAS sur Ctrl+C mais fermez simplement le terminal"
    echo ""
    
    npm run preview || {
        error "Le serveur preview a échoué"
    }
    
    echo ""
    echo "📝 Les tests sont-ils OK ?"
    read -p "   Voulez-vous continuer le déploiement ? (o/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Oo]$ ]]; then
        warning "Déploiement annulé"
        exit 0
    fi
else
    warning "Tests ignorés (skip-test)"
fi

# 5. Déploiement (à personnaliser)
echo ""
echo "📦 Déploiement sur le serveur..."
echo "   Serveur: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# Option 1: Déploiement avec rsync (décommentez si vous avez accès SSH)
# rsync -avz --delete dist/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/ || error "Échec du déploiement"
# success "Fichiers copiés sur le serveur"

# Option 2: Déploiement manuel (par défaut)
warning "Déploiement manuel requis:"
echo "   1. Copiez le contenu de dist/ vers votre serveur"
echo "   2. Commande suggérée:"
echo "      rsync -avz --delete dist/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/"
echo ""
read -p "   Appuyez sur Entrée quand le déploiement manuel est terminé..."

# 6. Redémarrage du serveur web (décommentez si vous avez accès SSH)
# echo "🔄 Rechargement du serveur web..."
# ssh $SERVER_USER@$SERVER_HOST "sudo systemctl reload nginx" || warning "Impossible de recharger nginx"

echo ""
success "Déploiement terminé !"
echo ""
echo "🎉 Prochaines étapes:"
echo "   1. Testez sur votre URL de production"
echo "   2. Videz le cache du navigateur (Ctrl+Shift+R)"
echo "   3. Vérifiez la console (F12) pour les erreurs"
echo ""

