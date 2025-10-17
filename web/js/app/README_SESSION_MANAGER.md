# 🔄 SessionManager - Reset complet de l'application

## 🎯 Fonction

`SessionManager.resetToGameMenu()` permet de **recharger complètement la page** tout en gardant l'utilisateur connecté.

### ✨ Ce qui est nettoyé :
- ✅ Canvas Three.js (complètement fermé)
- ✅ WebSocket (reconnexion automatique)
- ✅ Toutes les variables en mémoire
- ✅ Tous les event listeners
- ✅ Toutes les tâches en background

### 🔒 Ce qui est conservé :
- ✅ Token d'authentification
- ✅ Données utilisateur (nom, langue, etc.)
- ✅ L'utilisateur reste connecté

## 📖 Utilisation

### Exemple 1 : Depuis n'importe quel fichier

```javascript
import { SessionManager } from '../app/sessionManager.js';

// Quelque part dans ton code
SessionManager.resetToGameMenu();
```

### Exemple 2 : Import dynamique (éviter dépendances circulaires)

```javascript
// Utilisé dans OptionsMenu.js
const { SessionManager } = await import('../app/sessionManager.js');
SessionManager.resetToGameMenu();
```

### Exemple 3 : Après une victoire

```javascript
// Dans ta gestion de victoire
if (gameWon) {
    // Afficher message de victoire
    showVictoryMessage();
    
    // Attendre 5 secondes puis retour menu
    setTimeout(async () => {
        const { SessionManager } = await import('../app/sessionManager.js');
        SessionManager.resetToGameMenu();
    }, 5000);
}
```

## 🔄 Flow technique

1. **Sauvegarde** token + user dans `sessionStorage`
2. **Recharge** la page avec `window.location.href = '/'`
3. **Au démarrage** : `Auth.init()` détecte la session sauvegardée
4. **Restaure** le token, reconnecte le WebSocket
5. **Redirige** vers game-menu automatiquement

## 🎮 Cas d'usage

- ✅ Quitter une partie en cours (déjà implémenté dans OptionsMenu)
- ✅ Retour menu après victoire
- ✅ Retour menu après défaite
- ✅ Bouton "Nouvelle partie" après une partie
- ✅ Correction de bugs/fuites mémoire pendant une partie

## ⚡ Pourquoi pas juste un Router.navigateTo() ?

**Problème avec navigateTo :**
- ❌ Canvas Three.js reste en mémoire
- ❌ Event listeners s'accumulent
- ❌ WebSocket peut avoir des états incohérents
- ❌ Variables globales persistent
- ❌ Fuites mémoire potentielles

**Avec resetToGameMenu :**
- ✅ Reset COMPLET comme si on venait de se connecter
- ✅ Aucune fuite mémoire possible
- ✅ État de l'app garanti propre
- ✅ L'utilisateur reste connecté

## 🛠️ API complète

```javascript
// Fonction principale
SessionManager.resetToGameMenu()

// Vérifier si session sauvegardée (usage interne)
SessionManager.checkSavedSession()  // { token, user, redirectTo } ou null

// Nettoyer manuellement (rare)
SessionManager.clearSavedSession()
```

## 💡 Notes

- Utilise `sessionStorage` (pas `localStorage`) : données effacées à la fermeture du navigateur
- One-time use : la session sauvegardée est supprimée après restauration
- Compatible avec tous les navigateurs modernes
- Pas d'impact sur les performances (rechargement normal)

## 🐛 Debug

Si problème :

```javascript
// Dans la console navigateur
sessionStorage.getItem('yuan_auth_token')      // Voir le token sauvegardé
sessionStorage.getItem('yuan_user_data')       // Voir les données user
sessionStorage.getItem('yuan_redirect_to')     // Voir la redirection

// Forcer le nettoyage
sessionStorage.clear()
```



