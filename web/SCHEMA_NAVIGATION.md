# Schéma de navigation de l'application

## 🗺️ Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                          │
│                       (Page d'accueil)                       │
│                                                              │
│  [Connexion avec Google] [Connexion] [Inscription]          │
└────────┬──────────────────┬────────────────┬────────────────┘
         │                  │                │
         ▼                  ▼                ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ GOOGLE LOGIN   │ │  EMAIL LOGIN   │ │    SIGNUP      │
│                │ │                │ │                │
│ [Google Auth]  │ │ Email/Pass     │ │ Email/Pass/    │
│ [Retour]       │ │ [Submit]       │ │ Confirm        │
│                │ │ [Retour]       │ │ [Submit]       │
│                │ │                │ │ [Retour]       │
└────────┬───────┘ └────────┬───────┘ └────────┬───────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                            │
                    (Authentification)
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │          GAME MENU                    │
         │      (Menu principal du jeu)          │
         │                                       │
         │  [Partie Rapide]                     │
         │  [Rejoindre partie personnalisée]    │
         │  [Créer partie personnalisée]        │
         │  [Options]                           │
         └─────┬──────────────┬─────────┬───────┘
               │              │         │
       ┌───────┘              │         └─────────┐
       │                      │                   │
       ▼                      ▼                   ▼
┌──────────────┐     ┌──────────────┐    ┌──────────────┐
│ JOIN QUICK   │     │ CREATE QUICK │    │   OPTIONS    │
│    GAME      │     │     GAME     │    │              │
│              │     │              │    │ [Langue]     │
│ Code: ____   │     │ Code: ABCD   │    │ [Qualité]    │
│ [Rejoindre]  │     │ Players: 2/4 │    │ [Ombres]     │
│ [Retour]     │     │ [Lancer]     │    │ [Chg nom]    │
│              │     │ [Supprimer]  │    │ [Déco]       │
│              │     │ [Retour]     │    │ [Supp cpt]   │
│              │     │              │    │ [Précédent]  │
└──────────────┘     └──────────────┘    └───┬────┬─────┘
                                             │    │
                              ┌──────────────┘    └──────────┐
                              │                              │
                              ▼                              ▼
                    ┌──────────────┐              ┌──────────────┐
                    │ CHANGE NAME  │              │DELETE ACCOUNT│
                    │              │              │              │
                    │ Actuel: __   │              │ ⚠️ Warning   │
                    │ Nouveau: __  │              │              │
                    │ Pass: ____   │              │ Pass: ____   │
                    │ [Confirmer]  │              │ [Supprimer]  │
                    │ [Précédent]  │              │ [Précédent]  │
                    └──────────────┘              └──────────────┘
```

## 🎯 Chemins de navigation

### Authentification (Non connecté)
```
landing
├─→ google-login → (Auth Google) → game-menu
├─→ email-login → (Auth Email) → game-menu
└─→ signup → (Inscription) → game-menu
```

### Menu principal (Connecté)
```
game-menu
├─→ join-quick-game → (Rejoindre) → [En partie]
├─→ create-quick-game → (Créer) → [En partie]
└─→ options
    ├─→ change-name → (Modifier) → options
    ├─→ delete-account → (Supprimer) → landing
    └─→ logout → landing
```

## 🔄 Types de retour

### Retour par bouton "Retour" (Router.goBack())
- `google-login` → `landing`
- `email-login` → `landing`
- `signup` → `landing`
- `join-quick-game` → `game-menu`
- `create-quick-game` → `game-menu`
- `options` → `game-menu`
- `change-name` → `options`
- `delete-account` → `options`

### Retour par action
- `logout` (dans options) → `landing` (Router.navigateTo)
- `delete-game` (dans create) → `game-menu` (Router.navigateTo)
- Après auth réussie → `game-menu` (Router.navigateTo)

## 📱 États de l'application

### Non authentifié
```
[Landing] → [Auth Pages]
```
**Pages accessibles** : landing, google-login, email-login, signup

### Authentifié
```
[Game Menu] → [Game Pages] → [Options Pages]
```
**Pages accessibles** : game-menu, join-quick-game, create-quick-game, options, change-name, delete-account

### En partie (TODO)
```
[Game UI] → [Game Board]
```
**Pages accessibles** : game-ui (TODO)

## 🧭 Table de routage

| Route | Module | Partial | CSS | Parent |
|-------|--------|---------|-----|--------|
| `landing` | landing.js | landing-page.html | landing.css | - |
| `google-login` | googleLogin.js | google-login.html | auth.css | landing |
| `email-login` | emailLogin.js | email-login.html | auth.css | landing |
| `signup` | signup.js | signup.html | auth.css | landing |
| `game-menu` | gameMenu.js | game-menu.html | lobby.css | - |
| `join-quick-game` | joinQuickGame.js | join-quick-game.html | game.css | game-menu |
| `create-quick-game` | createQuickGame.js | create-quick-game.html | game.css | game-menu |
| `options` | options.js | options.html | options.css | game-menu |
| `change-name` | changeName.js | change-name.html | options.css | options |
| `delete-account` | deleteAccount.js | delete-account.html | options.css | options |

## 🎨 Groupes CSS

### auth.css (Pages d'authentification)
- google-login
- email-login
- signup

### game.css (Pages de jeu)
- join-quick-game
- create-quick-game

### options.css (Pages de paramètres)
- options
- change-name
- delete-account

## 🔗 Liens entre pages

### Navigation avant (Router.navigateTo)
```
landing → google-login
landing → email-login
landing → signup
game-menu → join-quick-game
game-menu → create-quick-game
game-menu → options
options → change-name
options → delete-account
```

### Navigation arrière (Router.goBack ou history.back)
Toutes les pages avec bouton "Retour" ou "Précédent"

### Navigation latérale (même niveau)
```
google-login ⟷ email-login ⟷ signup (via landing)
join-quick-game ⟷ create-quick-game ⟷ options (via game-menu)
change-name ⟷ delete-account (via options)
```

## 🏗️ Hiérarchie des pages

```
Niveau 0: landing
│
├─ Niveau 1: google-login, email-login, signup
│
└─ Niveau 0: game-menu (après auth)
   │
   ├─ Niveau 1: join-quick-game, create-quick-game, options
   │
   └─ Niveau 2: change-name, delete-account (depuis options)
```

## 🚦 Flux utilisateur typique

### Premier utilisateur (Inscription)
```
landing → signup → game-menu → create-quick-game → [Jeu]
```

### Utilisateur existant (Connexion)
```
landing → email-login → game-menu → join-quick-game → [Jeu]
```

### Utilisateur avec Google
```
landing → google-login → game-menu → options → [Paramètres]
```

### Modifier profil
```
game-menu → options → change-name → options → game-menu
```

### Déconnexion
```
game-menu → options → logout → landing
```

## 📊 Statistiques

- **Total pages** : 10
- **Pages publiques** : 4 (landing + 3 auth)
- **Pages privées** : 6 (game-menu + 2 game + 3 options)
- **Profondeur max** : 2 niveaux (depuis game-menu)
- **CSS distincts** : 5 (base + landing + auth + game + options)

## 💡 Notes importantes

1. **Toutes les pages** sont accessibles via `Router.navigateTo('page-name')`
2. **Historique complet** : le navigateur garde toutes les pages visitées
3. **Pas de rechargement** : navigation fluide en SPA
4. **URLs lisibles** : `#landing`, `#game-menu`, `#options`, etc.
5. **CSS optimisé** : chargement à la demande pour chaque groupe de pages

