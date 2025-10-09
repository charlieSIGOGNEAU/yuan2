# Architecture du site Yuan - L'Art de la Guerre

## 📐 Structure générale

Ce site est une **Single Page Application (SPA)** mono-page où toute la navigation se fait dans la div `#app` sans rechargement de la page.

## 🗂️ Organisation des fichiers

```
web/
├── index.html                    # Point d'entrée HTML
├── js/
│   ├── app.js                    # Point d'entrée principal JS
│   └── app/
│       ├── router.js             # Système de navigation avec historique
│       ├── auth.js               # Gestion de l'authentification
│       ├── websocket.js          # Connexion WebSocket
│       │
│       ├── landing.js            # Page d'accueil
│       ├── googleLogin.js        # Connexion Google
│       ├── emailLogin.js         # Connexion par email
│       ├── signup.js             # Inscription
│       │
│       ├── gameMenu.js           # Menu principal du jeu
│       ├── joinQuickGame.js      # Rejoindre une partie
│       ├── createQuickGame.js    # Créer une partie
│       │
│       ├── options.js            # Menu des options
│       ├── changeName.js         # Changer de nom
│       └── deleteAccount.js      # Supprimer le compte
│
├── partials/
│   ├── landing-page.html         # HTML de la page d'accueil
│   ├── google-login.html         # HTML connexion Google
│   ├── email-login.html          # HTML connexion email
│   ├── signup.html               # HTML inscription
│   ├── game-menu.html            # HTML menu du jeu
│   ├── join-quick-game.html      # HTML rejoindre partie
│   ├── create-quick-game.html    # HTML créer partie
│   ├── options.html              # HTML options
│   ├── change-name.html          # HTML changer nom
│   └── delete-account.html       # HTML supprimer compte
│
└── css/
    ├── base.css                  # Styles de base (chargé par défaut)
    ├── landing.css               # Styles page d'accueil
    ├── auth.css                  # Styles pages d'authentification
    ├── lobby.css                 # Styles menu du jeu (réutilisé)
    ├── game.css                  # Styles gestion des parties
    └── options.css               # Styles pages d'options
```

## 🧭 Système de navigation (router.js)

Le router gère la navigation entre les pages et l'historique du navigateur.

### Fonctionnalités :
- ✅ Navigation sans rechargement de page
- ✅ Support du bouton "Précédent" du navigateur
- ✅ Gestion de l'historique avec `pushState`
- ✅ URLs avec ancres (`#page-name`)

### Utilisation :

```javascript
// Naviguer vers une page
Router.navigateTo('landing');
Router.navigateTo('game-menu', { userId: 123 });

// Retour en arrière
Router.goBack();

// Enregistrer une nouvelle page (fait dans app.js)
Router.registerPage('nom-page', PageModule);
```

## 📄 Structure d'une page

Chaque page suit le même pattern :

```javascript
import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';

export const MaPage = {
    // Afficher la page
    async show(data = {}) {
        // 1. Charger le HTML
        const html = await loadPartial('partials/ma-page.html');
        document.getElementById('app').innerHTML = html;
        
        // 2. Charger le CSS
        loadCSS('css/ma-page.css');
        
        // 3. Configurer les événements
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        document.getElementById('mon-btn')?.addEventListener('click', () => {
            // Action du bouton
        });
    }
};
```

## 🔐 Flux d'authentification

### 1. Landing Page
- **Fichiers** : `landing.js` + `landing-page.html` + `landing.css`
- **Options** :
  - Connexion Google → `google-login`
  - Connexion email → `email-login`
  - Inscription → `signup`

### 2. Connexion Google
- **Fichiers** : `googleLogin.js` + `google-login.html` + `auth.css`
- **TODO** : Implémenter l'authentification OAuth Google

### 3. Connexion Email
- **Fichiers** : `emailLogin.js` + `email-login.html` + `auth.css`
- **Champs** : Email + Mot de passe
- **TODO** : Appeler `Auth.loginWithEmail(email, password)`

### 4. Inscription
- **Fichiers** : `signup.js` + `signup.html` + `auth.css`
- **Champs** : Email + Mot de passe + Confirmation
- **Validation** : Les mots de passe doivent correspondre
- **TODO** : Appeler `Auth.signup(email, password)`

## 🎮 Flux de jeu

### 1. Menu du Jeu (game-menu)
- **Fichiers** : `gameMenu.js` + `game-menu.html` + `lobby.css`
- **Options** :
  - Partie rapide → TODO
  - Rejoindre partie → `join-quick-game`
  - Créer partie → `create-quick-game`
  - Options → `options`

### 2. Rejoindre une partie
- **Fichiers** : `joinQuickGame.js` + `join-quick-game.html` + `game.css`
- **Champ** : Code de la partie
- **TODO** : Implémenter la logique de rejoindre

### 3. Créer une partie
- **Fichiers** : `createQuickGame.js` + `create-quick-game.html` + `game.css`
- **Affichage** :
  - Code de la partie
  - Nombre de joueurs connectés
- **Actions** :
  - Lancer la partie → TODO
  - Supprimer la partie → TODO (+ notification aux autres joueurs)

## ⚙️ Flux d'options

### 1. Menu Options
- **Fichiers** : `options.js` + `options.html` + `options.css`
- **Paramètres** :
  - Langue (select) → console.log
  - Qualité graphique (select) → console.log
  - Ombres (checkbox) → console.log
- **Actions** :
  - Changer de nom → `change-name`
  - Déconnexion → `Auth.logout()`
  - Supprimer compte → `delete-account`

### 2. Changer de nom
- **Fichiers** : `changeName.js` + `change-name.html` + `options.css`
- **Champs** :
  - Nom actuel (readonly)
  - Nouveau nom
  - Mot de passe
- **TODO** : Implémenter le changement de nom

### 3. Supprimer le compte
- **Fichiers** : `deleteAccount.js` + `delete-account.html` + `options.css`
- **Champ** : Mot de passe
- **Sécurité** : Double confirmation
- **TODO** : Implémenter la suppression

## 🔄 Navigation entre les pages

### Schéma de navigation :

```
landing
├── google-login ──→ (auth) ──→ game-menu
├── email-login ──→ (auth) ──→ game-menu
└── signup ──→ (auth) ──→ game-menu

game-menu
├── join-quick-game
├── create-quick-game
└── options
    ├── change-name
    └── delete-account
```

### Boutons "Retour" :
- Toutes les pages ont un bouton "Retour" qui appelle `Router.goBack()`
- Le navigateur garde l'historique complet de navigation
- Le bouton précédent du navigateur fonctionne nativement

## 🎨 Styles CSS

### base.css (toujours chargé)
- Styles globaux
- Layout principal (#app, #wrapper, .background)
- Image titre

### Styles spécifiques (chargés dynamiquement)
- **landing.css** : Page d'accueil
- **auth.css** : Toutes les pages d'authentification
- **lobby.css** : Menu du jeu (réutilisé de l'ancien lobby)
- **game.css** : Pages de gestion des parties
- **options.css** : Toutes les pages d'options

## 🚀 Initialisation de l'application

Dans `app.js` :

1. Import du router et de toutes les pages
2. Enregistrement de toutes les pages dans le router
3. Initialisation du router (écoute l'historique)
4. Démarrage de l'application → `Auth.init()` → affiche `landing`

## ✅ État actuel (console.log)

Les actions suivantes affichent uniquement des `console.log` pour le moment :

- ✅ Connexion Google
- ✅ Connexion email
- ✅ Inscription
- ✅ Partie rapide
- ✅ Rejoindre partie
- ✅ Créer partie
- ✅ Lancer partie
- ✅ Supprimer partie
- ✅ Changement de langue
- ✅ Qualité graphique
- ✅ Ombres
- ✅ Changer de nom
- ✅ Supprimer compte

### Actions fonctionnelles :

- ✅ Navigation entre toutes les pages
- ✅ Bouton précédent du navigateur
- ✅ Déconnexion (retour à landing)

## 📝 Prochaines étapes

1. Implémenter les appels API pour l'authentification
2. Implémenter la logique de création/rejoindre des parties
3. Implémenter les paramètres utilisateur
4. Connecter avec le backend WebSocket pour les parties
5. Ajouter les traductions i18n sur toutes les pages

## 🐛 Débogage

Pour tester la navigation :
1. Ouvrir la console du navigateur
2. Observer les logs de navigation et d'actions
3. Tester le bouton précédent du navigateur
4. Vérifier que l'URL change avec les ancres

