# Guide de test de l'application

## 🚀 Lancer l'application

1. Assurez-vous que votre serveur backend est lancé sur `http://localhost:3000`
2. Ouvrez `index.html` dans votre navigateur (ou via un serveur web local)
3. Ouvrez la console du navigateur (F12) pour voir les logs

## 🧪 Tests à effectuer

### ✅ Test 1 : Navigation de base

**Objectif** : Vérifier que toutes les pages se chargent et que la navigation fonctionne

1. **Page d'accueil** devrait apparaître avec 3 boutons :
   - "Connexion avec Google"
   - "Connexion"
   - "Inscription"

2. Cliquez sur **"Connexion avec Google"** :
   - ✅ La page Google Login s'affiche
   - ✅ L'URL change vers `#google-login`
   - ✅ Console : log de navigation

3. Cliquez sur **"Retour"** :
   - ✅ Retour à la landing page
   - ✅ L'URL revient à `#landing`

4. Testez le **bouton précédent du navigateur** :
   - ✅ Doit revenir à la page Google Login

5. Testez le **bouton suivant du navigateur** :
   - ✅ Doit revenir à la landing page

### ✅ Test 2 : Authentification (structure)

**Objectif** : Tester toutes les pages d'authentification

1. **Connexion Email** :
   - Cliquez sur "Connexion"
   - ✅ Formulaire avec email + mot de passe
   - Remplissez et soumettez
   - ✅ Console : affiche les valeurs

2. **Inscription** :
   - Depuis la landing, cliquez sur "Inscription"
   - ✅ Formulaire avec email + password + confirmation
   - Testez avec mots de passe différents
   - ✅ Message d'erreur
   - Testez avec mots de passe identiques
   - ✅ Console : affiche les valeurs

### ✅ Test 3 : Menu du jeu

**Objectif** : Accéder au menu du jeu (nécessite authentification)

> ⚠️ Pour accéder au menu, vous devez soit :
> - Implémenter une des méthodes d'auth
> - OU temporairement simuler dans le code : `Auth.currentUser = { name: 'Test' }; Router.navigateTo('game-menu');`

Une fois dans le menu :

1. **4 boutons** devraient être visibles :
   - Partie Rapide
   - Rejoindre une partie personnalisée
   - Créer une partie personnalisée
   - Options

2. Cliquez sur **"Rejoindre une partie"** :
   - ✅ Formulaire avec champ "Code"
   - Entrez un code et soumettez
   - ✅ Console : affiche le code

3. Cliquez sur **"Créer une partie"** :
   - ✅ Affiche code de partie + nombre de joueurs
   - ✅ 2 boutons : "Lancer" et "Supprimer"
   - Testez chaque bouton
   - ✅ Console : logs correspondants

### ✅ Test 4 : Options

**Objectif** : Tester tous les paramètres

1. Depuis le menu, cliquez sur **"Options"** :
   - ✅ Page avec plusieurs contrôles

2. Testez **la sélection de langue** :
   - Changez la langue
   - ✅ Console : affiche la nouvelle langue

3. Testez **la qualité graphique** :
   - Changez la qualité
   - ✅ Console : affiche la nouvelle qualité

4. Testez **les ombres** :
   - Cochez/décochez
   - ✅ Console : affiche l'état

5. Cliquez sur **"Changer de nom"** :
   - ✅ Formulaire avec nom actuel (readonly)
   - Remplissez nouveau nom + password
   - ✅ Console : affiche les valeurs

6. Cliquez sur **"Supprimer le compte"** :
   - ✅ Message d'avertissement visible
   - Entrez un mot de passe et soumettez
   - ✅ Double confirmation demandée
   - ✅ Console : log de suppression

7. Testez **"Déconnexion"** :
   - ✅ Confirmation demandée
   - Confirmez
   - ✅ Retour à la landing page

### ✅ Test 5 : Historique du navigateur

**Objectif** : Vérifier que l'historique fonctionne parfaitement

1. Parcourez plusieurs pages :
   - landing → email-login → (back) → signup → (simulate auth) → game-menu → options → change-name

2. Utilisez le **bouton précédent du navigateur** plusieurs fois :
   - ✅ Chaque page précédente s'affiche correctement
   - ✅ Les URLs changent
   - ✅ Les styles sont corrects

3. Utilisez le **bouton suivant du navigateur** :
   - ✅ Avance dans l'historique

### ✅ Test 6 : Styles CSS

**Objectif** : Vérifier que les styles se chargent correctement

1. **Vérifications visuelles** pour chaque page :
   - ✅ Les boutons ont des couleurs appropriées
   - ✅ Les formulaires sont bien formatés
   - ✅ Le hover fonctionne sur les boutons
   - ✅ Les espacements sont cohérents
   - ✅ Le background est visible

2. **Vérifier dans l'inspecteur** :
   - Ouvrez les DevTools → Network
   - Naviguez entre les pages
   - ✅ Les fichiers CSS se chargent à la demande

### ✅ Test 7 : Console logs

**Objectif** : Vérifier que tous les console.log fonctionnent

**Pour chaque action ci-dessous, un message devrait apparaître dans la console :**

- [ ] Connexion Google → "🔑 Connexion Google initiée"
- [ ] Connexion Email → "🔑 Tentative de connexion: [email]"
- [ ] Inscription → "📝 Tentative d'inscription: [email]"
- [ ] Partie rapide → "🎮 Partie rapide sélectionnée"
- [ ] Rejoindre partie → "🎮 Rejoindre la partie avec le code: [code]"
- [ ] Lancer partie → "🚀 Lancement de la partie"
- [ ] Supprimer partie → "🗑️ Suppression de la partie"
- [ ] Changement langue → "🌍 Changement de langue: [langue]"
- [ ] Qualité graphique → "🎨 Qualité graphique: [qualité]"
- [ ] Ombres → "💡 Ombres: activées/désactivées"
- [ ] Changer nom → "✏️ Changement de nom vers: [nom]"
- [ ] Supprimer compte → "🗑️ Suppression du compte demandée"

## 🐛 Problèmes connus à résoudre

### Si la page est blanche :
1. Vérifiez la console pour les erreurs
2. Vérifiez que tous les fichiers sont bien dans les bons dossiers
3. Vérifiez que `app.js` est bien chargé comme module (`type="module"`)

### Si les styles ne s'appliquent pas :
1. Vérifiez que `base.css` est chargé dans `index.html`
2. Vérifiez que `loadCSS()` fonctionne (regardez l'onglet Network)
3. Vérifiez les chemins des fichiers CSS

### Si le bouton précédent ne fonctionne pas :
1. Vérifiez que `Router.init()` est appelé dans `app.js`
2. Vérifiez la console pour les erreurs JavaScript
3. Vérifiez que `popstate` est bien écouté

### Si les formulaires rechargent la page :
1. Vérifiez que `preventDefault()` est appelé dans le handler
2. Vérifiez que le handler est bien attaché au formulaire

## ✨ Checklist complète

- [ ] Landing page s'affiche correctement
- [ ] Les 3 pages d'auth sont accessibles
- [ ] Le bouton retour fonctionne partout
- [ ] Le bouton précédent du navigateur fonctionne
- [ ] Les formulaires valident correctement
- [ ] Le menu du jeu affiche le nom d'utilisateur
- [ ] Les pages de jeu sont accessibles
- [ ] Les options affichent tous les contrôles
- [ ] La déconnexion retourne à la landing
- [ ] Tous les console.log apparaissent au bon moment
- [ ] Les styles sont appliqués correctement
- [ ] L'URL change avec les ancres

## 🎯 Test rapide (2 minutes)

Si vous voulez tester rapidement que tout fonctionne :

```javascript
// Dans la console du navigateur, après le chargement :

// Simuler une authentification
Auth.currentUser = { name: 'Testeur' };

// Tester la navigation
Router.navigateTo('game-menu');        // ✅ Menu visible
Router.navigateTo('options');          // ✅ Options visible
Router.navigateTo('change-name');      // ✅ Formulaire visible
history.back();                         // ✅ Retour aux options
history.back();                         // ✅ Retour au menu
Router.navigateTo('create-quick-game'); // ✅ Page création visible
```

## 📝 Notes

- Tous les `console.log` sont temporaires et seront remplacés par les vraies implémentations
- Les appels API ne fonctionneront que lorsque le backend sera implémenté
- Le WebSocket nécessite une connexion active au serveur

## ✅ Validation finale

Quand vous aurez testé toutes les fonctionnalités ci-dessus et que tout fonctionne, l'architecture de base est complète et prête pour l'implémentation des fonctionnalités réelles !

