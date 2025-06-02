# Yuan Game - Architecture API + Web

Ce projet implémente une authentification JWT avec une API Rails séparée d'une interface web.

## 🏗️ Architecture

```
yuan2/
├── api/                    # API Rails 7 (Backend)
│   ├── app/
│   │   ├── controllers/
│   │   │   ├── application_controller.rb    # Authentification JWT
│   │   │   └── api/v1/auth_controller.rb   # Endpoints auth
│   │   ├── models/
│   │   │   └── user.rb                     # Modèle User
│   │   └── services/
│   │       └── json_web_token.rb           # Service JWT
│   ├── config/
│   │   ├── initializers/cors.rb            # Configuration CORS
│   │   └── routes.rb                       # Routes API
│   └── ...
└── web/                    # Interface Web (Frontend)
    ├── index.html          # Page principale
    ├── js/
    │   └── app.js         # Logique authentification
    ├── partials/
    │   └── login-form.html # Formulaire de connexion
    └── README.md
```

## 🚀 Démarrage

### 1. API Rails (Port 3000)
```bash
cd api
bundle install
rails db:create db:migrate
rails server
```

### 2. Interface Web (Port 8000)
```bash
cd web
python3 -m http.server 8000
```

### 3. Accès
- API : http://localhost:3000/api/v1/
- Web : http://localhost:8000/

## 🔐 Authentification JWT

### Points clés implémentés :
- ✅ **JWT Service** : Encodage/Décodage des tokens
- ✅ **CORS configuré** : Pour les requêtes cross-origin
- ✅ **Authentification simple** : Seulement avec le nom d'utilisateur
- ✅ **Persistence** : Token sauvegardé dans localStorage
- ✅ **Vérification** : Token validé à chaque rechargement

### Endpoints API :
- `POST /api/v1/auth/login` : Connexion avec nom
- `GET /api/v1/auth/me` : Vérification du token

## 📝 Fonctionnalités Web

### Page d'authentification avec :
- ✅ **Formulaire de connexion** (via partial)
- ✅ **Gestion des états** (connecté/déconnecté)
- ✅ **Debug console** : Logs détaillés
- ✅ **Persistence** : Reconnexion automatique
- ✅ **Fallback** : Si le partial ne charge pas

## 🛠️ Difficultés Résolues

Basé sur le fichier `difficulte.md`, les principales difficultés ont été prises en compte :

1. **CORS** : Configuration pour HTTP + Action Cable
2. **Rack-CORS** : Gem décommentée et configurée
3. **Architecture séparée** : API et Web dans des dossiers distincts
4. **JWT simple** : Sans email, juste nom d'utilisateur

## 🔄 Prochaines étapes

- [ ] Implémentation d'Action Cable pour les WebSockets
- [ ] Authentification Google OAuth
- [ ] Gestion des channels de jeu
- [ ] Interface de jeu

## 🧪 Tests

Pour tester l'API avec curl :
```bash
# Connexion
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name":"MonNom"}'

# Vérification (remplacer TOKEN par le token reçu)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/v1/auth/me
``` 