# Référence rapide des pages

## 🏠 Landing Page (`landing`)
**Fichiers** : `landing.js`, `landing-page.html`, `landing.css`

### Boutons :
- `#google-login-btn` → Navigate to `google-login`
- `#email-login-btn` → Navigate to `email-login`
- `#signup-btn` → Navigate to `signup`

---

## 🔐 Google Login (`google-login`)
**Fichiers** : `googleLogin.js`, `google-login.html`, `auth.css`

### Boutons :
- `#google-auth-btn` → console.log (TODO: OAuth Google)
- `#back-to-landing` → Router.goBack()

---

## 📧 Email Login (`email-login`)
**Fichiers** : `emailLogin.js`, `email-login.html`, `auth.css`

### Formulaire :
- `#email-login-form`
  - `email` (input email)
  - `password` (input password)
  - Submit → console.log (TODO: Auth.loginWithEmail)

### Boutons :
- `#back-to-landing` → Router.goBack()

---

## ✍️ Signup (`signup`)
**Fichiers** : `signup.js`, `signup.html`, `auth.css`

### Formulaire :
- `#signup-form`
  - `email` (input email)
  - `password` (input password)
  - `password_confirm` (input password)
  - Submit → Vérifie correspondance puis console.log (TODO: Auth.signup)

### Boutons :
- `#back-to-landing` → Router.goBack()

---

## 🎮 Game Menu (`game-menu`)
**Fichiers** : `gameMenu.js`, `game-menu.html`, `lobby.css`

### Éléments dynamiques :
- `#username` → Affiche Auth.currentUser.name
- `#connection-status` → État WebSocket

### Boutons :
- `#quick-game-btn` → console.log (TODO: Partie rapide)
- `#join-custom-game-btn` → Navigate to `join-quick-game`
- `#create-custom-game-btn` → Navigate to `create-quick-game`
- `#options-btn` → Navigate to `options`

---

## 🎯 Join Quick Game (`join-quick-game`)
**Fichiers** : `joinQuickGame.js`, `join-quick-game.html`, `game.css`

### Formulaire :
- `#join-game-form`
  - `code` (input text)
  - Submit → console.log (TODO: Rejoindre la partie)

### Boutons :
- `#back-to-game-menu` → Router.goBack()

---

## 🎲 Create Quick Game (`create-quick-game`)
**Fichiers** : `createQuickGame.js`, `create-quick-game.html`, `game.css`

### Éléments dynamiques :
- `#game-code-display` → Code de la partie
- `#players-count` → Nombre de joueurs (ex: "2/4")

### Boutons :
- `#start-game-btn` → console.log (TODO: Lancer la partie)
- `#delete-game-btn` → console.log (TODO: Supprimer + notify) puis Navigate to `game-menu`
- `#back-to-game-menu` → Router.goBack()

---

## ⚙️ Options (`options`)
**Fichiers** : `options.js`, `options.html`, `options.css`

### Contrôles :
- `#language-select` (select) → console.log (TODO: Changer langue)
  - Options : fr, en, es, de
- `#graphics-quality` (select) → console.log (TODO: Qualité graphique)
  - Options : low, medium, high, ultra
- `#enable-shadows` (checkbox) → console.log (TODO: Activer ombres)

### Boutons :
- `#change-name-btn` → Navigate to `change-name`
- `#logout-btn` → Confirm puis Auth.logout()
- `#delete-account-btn` → Navigate to `delete-account`
- `#back-to-game-menu` → Router.goBack()

---

## ✏️ Change Name (`change-name`)
**Fichiers** : `changeName.js`, `change-name.html`, `options.css`

### Formulaire :
- `#change-name-form`
  - `current_name` (readonly) → Pré-rempli avec Auth.currentUser.name
  - `new_name` (input text)
  - `password` (input password)
  - Submit → console.log (TODO: Changer nom)

### Boutons :
- `#back-to-options` → Router.goBack()

---

## 🗑️ Delete Account (`delete-account`)
**Fichiers** : `deleteAccount.js`, `delete-account.html`, `options.css`

### Avertissement :
- Message d'avertissement visible : "⚠️ Cette action est irréversible !"

### Formulaire :
- `#delete-account-form`
  - `password` (input password)
  - Submit → Double confirm puis console.log (TODO: Supprimer compte)

### Boutons :
- `#back-to-options` → Router.goBack()

---

## 📊 Résumé des IDs

### IDs uniques par page :

**Landing Page :**
- `google-login-btn`, `email-login-btn`, `signup-btn`

**Auth Pages :**
- `google-auth-btn` (google-login)
- `email-login-form` (email-login)
- `signup-form` (signup)
- `back-to-landing` (tous)

**Game Menu :**
- `username`, `connection-status`
- `quick-game-btn`, `join-custom-game-btn`, `create-custom-game-btn`, `options-btn`

**Game Pages :**
- `join-game-form`, `game-code` (join)
- `game-code-display`, `players-count`, `start-game-btn`, `delete-game-btn` (create)
- `back-to-game-menu` (tous)

**Options Pages :**
- `language-select`, `graphics-quality`, `enable-shadows` (options)
- `change-name-btn`, `logout-btn`, `delete-account-btn` (options)
- `change-name-form`, `current-name`, `new-name`, `confirm-password` (change-name)
- `delete-account-form`, `delete-password` (delete-account)
- `back-to-options` (change-name, delete-account)
- `back-to-game-menu` (options)

---

## 🔄 Flux de retour

```
landing
  ↓
[google-login / email-login / signup]
  ↓ (goBack revient à landing)
  ↓ (après auth: navigate to game-menu)
  ↓
game-menu
  ↓
[join-quick-game / create-quick-game / options]
  ↓ (goBack revient à game-menu)
  ↓
options
  ↓
[change-name / delete-account]
  ↓ (goBack revient à options)
```

---

## 💡 Notes importantes

1. **Tous les boutons "Retour"** appellent `Router.goBack()` qui utilise l'historique du navigateur
2. **Les console.log** sont temporaires - à remplacer par les vraies implémentations
3. **Les formulaires** utilisent `preventDefault()` pour éviter le rechargement de page
4. **Les IDs** doivent être uniques et correspondent exactement au HTML
5. **Le CSS** est chargé dynamiquement avec `loadCSS()` à chaque page

