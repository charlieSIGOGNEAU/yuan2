# Test de l'authentification Google

## Checklist de vérification

### ✅ Backend

1. **Vérifier que la gem est installée**
   ```bash
   cd api
   bundle show google-id-token
   ```
   Devrait afficher le chemin de la gem.

2. **Vérifier que les variables d'environnement sont chargées**
   ```bash
   cd api
   rails console
   ```
   Puis dans la console :
   ```ruby
   ENV['GOOGLE_CLIENT_ID']
   # Devrait afficher votre client ID
   ENV['GOOGLE_CLIENT_SECRET']
   # Devrait afficher votre client secret
   ```

3. **Vérifier les routes**
   ```bash
   cd api
   rails routes | grep auth
   ```
   Devrait afficher :
   - `POST /api/v1/auth/google_login`
   - `GET /api/v1/config/google_client_id`

4. **Tester l'endpoint de config**
   ```bash
   curl http://localhost:3000/api/v1/config/google_client_id
   ```
   Devrait retourner :
   ```json
   {"client_id":"votre_client_id.apps.googleusercontent.com"}
   ```

### ✅ Frontend

1. **Vérifier les imports**
   Ouvrir la console du navigateur et vérifier qu'il n'y a pas d'erreurs d'import.

2. **Tester le bouton Google**
   - Cliquer sur "Connexion avec Google"
   - Une popup Google devrait s'ouvrir
   - Sélectionner un compte Google
   - Vérifier la console :
     ```
     🔐 Clic sur connexion Google
     ✅ SDK Google chargé
     ✅ Connexion Google déclenchée
     🔐 Credential reçu de Google
     ✅ Connexion Google réussie: [nom]
     ```

### ✅ Base de données

Après une connexion Google réussie, vérifier dans la console Rails :

```ruby
user = User.last
user.email       # L'email Google
user.provider    # Devrait être "google"
user.password_digest  # Devrait être nil
user.name        # Le nom de l'utilisateur Google
```

## Scénarios de test

### Scénario 1 : Première connexion Google

1. L'utilisateur clique sur "Connexion avec Google"
2. Sélectionne un compte Google jamais utilisé
3. **Résultat attendu** :
   - Un nouvel utilisateur est créé dans la DB avec `provider='google'`
   - L'utilisateur est redirigé vers `game-menu`
   - Le WebSocket est connecté

### Scénario 2 : Connexion Google existante

1. L'utilisateur se connecte avec un compte Google déjà utilisé
2. **Résultat attendu** :
   - L'utilisateur existant est trouvé
   - L'utilisateur est redirigé vers `game-menu`
   - Le WebSocket est connecté

### Scénario 3 : Email partagé

1. Un utilisateur s'inscrit avec email/password (provider='email')
2. Le même utilisateur essaie de se connecter avec Google (même email)
3. **Résultat attendu** :
   - L'utilisateur existant est trouvé (même email)
   - Connexion réussie
   - ⚠️ Note : Le provider reste 'email', mais ça fonctionne

## Erreurs communes

### 1. "Token Google invalide"

**Causes possibles** :
- Le GOOGLE_CLIENT_ID dans `.env` ne correspond pas au projet Google Cloud
- Le domaine n'est pas autorisé dans Google Cloud Console
- Le token a expiré

**Solution** :
- Vérifier le GOOGLE_CLIENT_ID
- Ajouter `http://localhost:5173` (ou votre port) dans les origines autorisées de Google Cloud Console

### 2. "GOOGLE_CLIENT_ID non disponible"

**Causes possibles** :
- Le fichier `.env` n'est pas chargé
- La variable n'est pas définie

**Solution** :
- Vérifier que le fichier `.env` existe dans `api/`
- Redémarrer le serveur Rails
- Installer la gem `dotenv-rails` si nécessaire

### 3. "Impossible de charger le SDK Google"

**Causes possibles** :
- Problème de connexion Internet
- Bloqueur de publicités bloque le script Google

**Solution** :
- Vérifier la connexion Internet
- Désactiver temporairement le bloqueur de publicités
- Vérifier la console du navigateur pour plus de détails

### 4. Erreur de validation "Password can't be blank"

**Causes possibles** :
- Le provider n'est pas correctement défini à 'google'
- Les validations conditionnelles ne fonctionnent pas

**Solution** :
- Vérifier que `provider: 'google'` est bien passé lors de la création
- Vérifier les validations dans `app/models/user.rb`

## Debug avancé

### Logs Backend (Rails)

Ajouter plus de logs dans `auth_controller.rb` si nécessaire :

```ruby
puts "📋 Payload Google: #{payload.inspect}"
puts "📋 User attributes: #{user.attributes.inspect}"
puts "📋 User errors: #{user.errors.full_messages}" unless user.valid?
```

### Logs Frontend (JavaScript)

Ajouter plus de logs dans `googleAuth.js` si nécessaire :

```javascript
console.log('📋 Response Google:', response);
console.log('📋 Data reçue:', data);
```

### Vérifier le token Google manuellement

Vous pouvez décoder le token JWT de Google sur [jwt.io](https://jwt.io/) pour voir son contenu.

## Performance

- Le SDK Google est chargé dynamiquement (~50-100ms)
- La vérification du token côté backend prend ~200-500ms (appel à Google)
- Le flow complet devrait prendre moins de 2 secondes

## Sécurité

- ✅ Le token Google est vérifié côté serveur
- ✅ Le GOOGLE_CLIENT_SECRET n'est jamais exposé au client
- ✅ Le JWT custom est généré côté serveur
- ✅ Les passwords ne sont pas requis pour les users Google
- ✅ Le provider est validé ('email' ou 'google' uniquement)

