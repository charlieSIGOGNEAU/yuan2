# Configuration de l'authentification Google

## ✅ Ce qui a été implémenté

### Backend (Rails)

1. **Endpoint d'authentification Google** (`/api/v1/auth/google_login`)
   - Vérifie le token Google avec la gem `google-id-token`
   - Crée un nouvel utilisateur si première connexion (provider='google')
   - Connecte l'utilisateur existant si déjà inscrit
   - Retourne un JWT token pour maintenir la session

2. **Endpoint de configuration** (`/api/v1/config/google_client_id`)
   - Retourne le GOOGLE_CLIENT_ID de manière sécurisée au frontend

3. **Fichiers modifiés :**
   - `api/app/controllers/api/v1/auth_controller.rb` : Ajout de la méthode `google_login`
   - `api/app/controllers/api/v1/config_controller.rb` : Nouveau controller pour la config
   - `api/config/routes.rb` : Ajout des routes nécessaires

### Frontend (JavaScript)

1. **Module GoogleAuth** (`web/js/app/googleAuth.js`)
   - Charge dynamiquement le SDK Google Identity Services
   - Gère le flow d'authentification OAuth2
   - Envoie le credential au backend
   - Stocke le JWT token et redirige vers game-menu

2. **Fichiers modifiés :**
   - `web/js/app/landing.js` : Le bouton Google lance maintenant `GoogleAuth.triggerLogin()`
   - `web/js/app/auth.js` : Utilise maintenant `ServerConfig.HTTP_BASE` pour toutes les URLs

## 🔧 Configuration requise

### 1. Variables d'environnement (`.env`)

Assurez-vous que votre fichier `api/.env` contient :

```env
GOOGLE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre_client_secret
```

### 2. Configuration Google Cloud Console

Si ce n'est pas déjà fait, vous devez :

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un projet ou sélectionner un projet existant
3. Activer l'API "Google Sign-In"
4. Créer des credentials OAuth 2.0 :
   - Type : Application Web
   - Origines JavaScript autorisées : 
     - `http://localhost:5173` (ou votre port de dev)
     - Votre domaine de production
   - URI de redirection autorisées : Pas nécessaire pour le flow que nous utilisons

5. Copier le Client ID et le Client Secret dans votre `.env`

### 3. Gemfile

Vérifiez que la gem est bien installée :

```ruby
gem 'google-id-token'
```

Puis exécutez si ce n'est pas déjà fait :
```bash
cd api
bundle install
```

## 🚀 Flow d'authentification

1. **L'utilisateur clique sur "Connexion avec Google"**
   - Le bouton déclenche `GoogleAuth.triggerLogin()`

2. **Popup Google s'ouvre**
   - L'utilisateur sélectionne son compte Google
   - Google génère un credential (JWT token)

3. **Credential envoyé au backend**
   - POST `/api/v1/auth/google_login` avec le credential

4. **Backend vérifie et crée/trouve l'utilisateur**
   - Vérifie le token avec `GoogleIDToken::Validator`
   - Cherche l'utilisateur par email
   - Si nouveau : crée un User avec `provider='google'`
   - Si existant : connecte l'utilisateur
   - Génère un JWT token custom

5. **Frontend stocke le token et redirige**
   - Stocke le JWT dans `Auth.authToken`
   - Initialise i18n avec la langue de l'utilisateur
   - Connecte le WebSocket
   - Redirige vers `game-menu`

## 🧪 Test

1. Démarrez le serveur Rails :
   ```bash
   cd api
   rails server
   ```

2. Démarrez le serveur frontend (probablement Vite) :
   ```bash
   cd web
   npm run dev
   ```

3. Ouvrez votre navigateur sur la landing page

4. Cliquez sur "Connexion avec Google"

5. Vérifiez dans la console du navigateur :
   - `✅ SDK Google chargé`
   - `🔐 Credential reçu de Google`
   - `✅ Connexion Google réussie: [nom]`

6. Vérifiez dans les logs Rails :
   - `🔐 Tentative de connexion Google`
   - `✅ Token Google vérifié pour: [email]`
   - `✅ Nouvel utilisateur Google créé` ou `✅ Utilisateur Google existant trouvé`

## 📝 Notes importantes

- Le champ `password_digest` n'est **pas requis** pour les utilisateurs Google (provider='google')
- Les utilisateurs Google et email partagent le même modèle User, différenciés par le champ `provider`
- Si un utilisateur s'inscrit par email puis tente de se connecter avec Google (même email), il utilisera le même compte
- Le JWT token custom est utilisé pour maintenir la session, pas le token Google

## 🔒 Sécurité

- Le GOOGLE_CLIENT_SECRET est stocké côté serveur uniquement
- Le GOOGLE_CLIENT_ID est public mais récupéré via l'API pour plus de flexibilité
- Le token Google est vérifié côté serveur avant toute action
- Le JWT custom expire selon votre configuration (vérifiez `JsonWebToken.encode`)

## 🐛 Debug

Si la connexion ne fonctionne pas :

1. Vérifiez que `GOOGLE_CLIENT_ID` est bien défini dans `.env`
2. Vérifiez que le domaine est autorisé dans Google Cloud Console
3. Vérifiez la console du navigateur pour les erreurs
4. Vérifiez les logs Rails pour les détails de l'erreur
5. Testez l'endpoint directement : `curl http://localhost:3000/api/v1/config/google_client_id`

