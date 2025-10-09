# Implémentation de l'authentification avec email/password

## ✅ Modifications effectuées

### 1. Base de données (Migration)

**Fichier**: `api/db/migrate/20251009114846_add_authentication_to_users.rb`

Ajout de 3 nouveaux champs à la table `users` :
- `email` (string) - Email de l'utilisateur avec index unique
- `provider` (string, default: 'email') - Type d'authentification ('email' ou 'google')
- `password_digest` (string) - Hash bcrypt du mot de passe

✅ Migration exécutée avec succès

### 2. Model User

**Fichier**: `api/app/models/user.rb`

**Ajouts** :
- `has_secure_password` - Active bcrypt pour le hashing des mots de passe
- Validations sur `email` (présence, unicité, format)
- Validations sur `provider` (email ou google)
- Validation conditionnelle sur `password` (requis uniquement pour provider 'email')
- Génération automatique du nom depuis l'email si non fourni

**Méthodes** :
- `authenticate(password)` - Fournie par bcrypt pour vérifier le mot de passe
- `generate_jwt_token` - Mise à jour pour inclure l'email dans le token

### 3. Contrôleur d'authentification

**Fichier**: `api/app/controllers/api/v1/auth_controller.rb`

**Nouvelles actions** :

#### POST `/api/v1/auth/login_email`
Connexion avec email et mot de passe.

**Paramètres** :
```json
{
  "email": "user@example.com",
  "password": "motdepasse"
}
```

**Réponse (succès)** :
```json
{
  "success": true,
  "message": "Connexion réussie",
  "user": {
    "id": 1,
    "name": "user",
    "email": "user@example.com",
    "language": "fr"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse (erreur)** :
```json
{
  "success": false,
  "message": "Email ou mot de passe incorrect"
}
```

#### POST `/api/v1/auth/signup`
Inscription d'un nouvel utilisateur.

**Paramètres** :
```json
{
  "email": "nouveau@example.com",
  "password": "motdepasse"
}
```

**Réponse (succès)** :
```json
{
  "success": true,
  "message": "Inscription réussie",
  "user": {
    "id": 2,
    "name": "nouveau",
    "email": "nouveau@example.com",
    "language": "fr"
  },
  "token": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Réponse (erreur)** :
```json
{
  "success": false,
  "message": "Erreur lors de l'inscription",
  "errors": ["Email est déjà utilisé"]
}
```

### 4. Routes

**Fichier**: `api/config/routes.rb`

Ajout de 2 nouvelles routes :
```ruby
post 'auth/login_email', to: 'auth#login_email'
post 'auth/signup', to: 'auth#signup'
```

### 5. Seeds

**Fichier**: `api/db/seeds.rb`

Création de 6 utilisateurs de test :
- user1@mail.com / user1@mail.com
- user2@mail.com / user2@mail.com
- user3@mail.com / user3@mail.com
- user4@mail.com / user4@mail.com
- user5@mail.com / user5@mail.com
- user6@mail.com / user6@mail.com

✅ Seed exécuté avec succès

### 6. Frontend JavaScript

**Fichiers modifiés** :

#### `web/js/app/emailLogin.js`
- Appelle maintenant `Auth.loginWithEmail(email, password)`
- Suppression du console.log et de l'alert

#### `web/js/app/signup.js`
- Appelle maintenant `Auth.signup(email, password)`
- Suppression du console.log et de l'alert

#### `web/js/app/auth.js` (déjà fait précédemment)
- Méthode `loginWithEmail()` qui appelle `/api/v1/auth/login_email`
- Méthode `signup()` qui appelle `/api/v1/auth/signup`
- Les deux redirigent vers `game-menu` après succès

## 🔐 Sécurité

### Hashing des mots de passe
- Utilise **bcrypt** pour hasher les mots de passe
- Jamais de stockage en clair
- Coût adaptatif pour résister aux attaques par force brute

### Authentification
- JWT (JSON Web Token) pour maintenir la session
- Token inclut : user_id, name, email
- Token vérifié sur chaque requête protégée

### Validations
- Email valide (format URI::MailTo::EMAIL_REGEXP)
- Email unique dans la base
- Mot de passe minimum 6 caractères
- Provider limité à 'email' ou 'google'

## 🧪 Tests

### Backend (avec curl)

#### Test d'inscription :
```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

#### Test de connexion :
```bash
curl -X POST http://localhost:3000/api/v1/auth/login_email \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@mail.com","password":"user1@mail.com"}'
```

### Frontend

1. **Ouvrir** : `web/index.html` dans le navigateur
2. **Cliquer** sur "Connexion"
3. **Entrer** :
   - Email : `user1@mail.com`
   - Password : `user1@mail.com`
4. **Résultat** : Redirection vers game-menu si succès

Ou pour l'inscription :
1. **Cliquer** sur "Inscription"
2. **Entrer** :
   - Email : `nouveau@test.com`
   - Password : `password123`
   - Confirmation : `password123`
3. **Résultat** : Création du compte et redirection vers game-menu

## 📊 Structure de la table users

```sql
users
├── id (primary key)
├── name (string, nullable) - Généré depuis email si non fourni
├── email (string, not null, unique) - Email de l'utilisateur
├── provider (string, default: 'email') - 'email' ou 'google'
├── password_digest (string) - Hash bcrypt (obligatoire si provider='email')
├── language (string, default: 'fr')
├── current_game_id (foreign key, nullable)
├── created_at (datetime)
└── updated_at (datetime)
```

## 🔄 Flux d'authentification

### Inscription (Signup)
```
Frontend                Backend                  Database
   │                       │                         │
   ├─ POST /auth/signup ──>│                         │
   │  {email, password}    │                         │
   │                       ├─ Validate email format  │
   │                       ├─ Check uniqueness ─────>│
   │                       │                         │
   │                       ├─ Hash password (bcrypt) │
   │                       ├─ Create user ──────────>│
   │                       │                         │
   │                       ├─ Generate JWT token     │
   │<── {user, token} ─────┤                         │
   │                       │                         │
   ├─ Store token          │                         │
   ├─ Initialize i18n      │                         │
   ├─ Connect WebSocket    │                         │
   └─ Navigate to game-menu│                         │
```

### Connexion (Login)
```
Frontend                Backend                  Database
   │                       │                         │
   ├─ POST /auth/login_email>│                       │
   │  {email, password}    │                         │
   │                       ├─ Find user by email ───>│
   │                       │<────────────────────────┤
   │                       │                         │
   │                       ├─ Authenticate (bcrypt)  │
   │                       │   compare passwords     │
   │                       │                         │
   │                       ├─ Generate JWT token     │
   │<── {user, token} ─────┤                         │
   │                       │                         │
   ├─ Store token          │                         │
   ├─ Initialize i18n      │                         │
   ├─ Connect WebSocket    │                         │
   └─ Navigate to game-menu│                         │
```

## 🚀 Prochaines étapes (optionnelles)

### 1. Authentification Google OAuth
- [ ] Configurer OAuth dans Google Console
- [ ] Ajouter omniauth-google-oauth2 gem
- [ ] Créer action `google_callback` dans auth_controller
- [ ] Gérer provider='google' sans password_digest

### 2. Fonctionnalités supplémentaires
- [ ] Récupération de mot de passe (forgot password)
- [ ] Confirmation d'email
- [ ] Changement de mot de passe
- [ ] 2FA (Two-Factor Authentication)

### 3. Améliorations de sécurité
- [ ] Rate limiting sur les tentatives de connexion
- [ ] Logs des connexions
- [ ] Sessions multiples
- [ ] Révocation de tokens

## 📝 Notes importantes

1. **L'ancienne méthode `POST /auth/login`** avec juste un nom fonctionne toujours pour compatibilité avec les tests existants.

2. **Les mots de passe** ne sont jamais stockés en clair, uniquement le hash bcrypt dans `password_digest`.

3. **Le JWT token** contient maintenant l'email en plus du user_id et du name.

4. **Le nom de l'utilisateur** est généré automatiquement depuis l'email si non fourni (partie avant @).

5. **Le provider** permet de distinguer les utilisateurs authentifiés par email de ceux qui utiliseront Google OAuth plus tard.

## ✅ Checklist de vérification

- [x] Migration créée et exécutée
- [x] Model User avec has_secure_password
- [x] Validations sur email et password
- [x] Action login_email dans contrôleur
- [x] Action signup dans contrôleur
- [x] Routes ajoutées
- [x] Seeds avec users de test
- [x] Frontend emailLogin connecté
- [x] Frontend signup connecté
- [x] Tests manuels passés

## 🎉 Résultat

Votre application dispose maintenant d'un système d'authentification complet avec :
- ✅ Inscription par email/password
- ✅ Connexion par email/password
- ✅ Hashing sécurisé avec bcrypt
- ✅ JWT pour maintenir la session
- ✅ Frontend complètement intégré
- ✅ 6 utilisateurs de test prêts à l'emploi

Vous pouvez maintenant vous connecter avec n'importe quel compte de test ou créer de nouveaux comptes via l'interface d'inscription !

