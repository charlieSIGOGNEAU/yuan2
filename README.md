# Yuan - L'Art de la Guerre 🎮

> **Projet de reconversion professionnelle** : De professeur de mathématiques à développeur web

[![Ruby on Rails](https://img.shields.io/badge/Ruby_on_Rails-7.2-CC0000?logo=ruby-on-rails)](https://rubyonrails.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/fr/docs/Web/JavaScript)
[![Three.js](https://img.shields.io/badge/Three.js-3D-000000?logo=three.js)](https://threejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-010101)](https://developer.mozilla.org/fr/docs/Web/API/WebSocket)

---

## 📖 Contexte du Projet

Ce projet représente **mon premier grand défi de développement** dans le cadre de ma reconversion professionnelle.

### Mon Parcours

- **15 ans** de carrière comme **professeur de mathématiques**
- Formation courte à **TheHackingProject** (Ruby & Rails - bases)
- **Défi personnel** : Coder mon propre jeu de société expert (sorti en boutique il y a 18 mois)
- **Aucune expérience préalable en JavaScript** avant ce projet
- **100% autodidacte** avec l'assistance de Cursor AI (aucune aide extérieure humaine)

### Objectif

Démontrer ma **capacité d'adaptation** et ma **compréhension algorithmique** plutôt que des connaissances figées dans un langage spécifique. Ce projet illustre ma capacité à :
- Apprendre rapidement de nouvelles technologies
- Gérer la complexité d'un projet ambitieux
- Résoudre des problèmes techniques variés
- Mener un projet de A à Z

---

## 🎯 Description du Jeu

**Yuan - L'Art de la Guerre** est un jeu de société stratégique expert en 3D, jouable en ligne en temps réel. Les joueurs contrôlent des clans qui s'affrontent pour la domination territoriale dans un monde hexagonal.

### Caractéristiques du Jeu
- 🎲 Jeu de société expert (2-6 joueurs)
- 🌐 Multijoueur en temps réel
- 🎨 Rendu 3D avec Three.js
- ⚡ Gameplay simultané (tous les joueurs jouent en même temps)
- ⏱️ Tours chronométrés
- 🌍 Interface multilingue (10 langues)

---

## 🏗️ Architecture Technique

### Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (SPA)                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  JavaScript ES6+ Modules                             │    │
│  │  • Router personnalisé (historique de navigation)    │    │
│  │  • Three.js (rendu 3D)                               │    │
│  │  • Logique de jeu complète côté client              │    │
│  │  • Système anti-triche (vérification locale)        │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕ WebSocket + REST                │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (API)                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Ruby on Rails 7.2 (API Mode)                        │    │
│  │  • Authentification JWT                              │    │
│  │  • WebSocket (Action Cable + Redis)                 │    │
│  │  • Transactions & Locks optimisés                   │    │
│  │  • Vérification des actions des joueurs             │    │
│  └─────────────────────────────────────────────────────┘    │
│                            ↕                                 │
│                    SQLite / PostgreSQL                       │
└─────────────────────────────────────────────────────────────┘
```

### Séparation Front/Back

- **Frontend** : Application monopage (SPA) avec chargement dynamique des partials HTML
- **Backend** : API RESTful pure, aucun rendu de vues
- **Communication** : WebSocket pour le temps réel + REST pour les actions critiques

---

## 💻 Stack Technologique

### Backend
| Technologie | Usage | Défis Relevés |
|-------------|-------|---------------|
| **Ruby on Rails 7.2** | Framework API | Transactions complexes, locks optimisés |
| **Action Cable** | WebSocket temps réel | Gestion de la reconnexion, heartbeat bidirectionnel |
| **Redis** | Pub/Sub pour WebSocket | Broadcast aux joueurs, gestion des channels |
| **JWT** | Authentification | Tokens stateless, sécurité des routes |
| **BCrypt** | Hash des mots de passe | Sécurité des credentials |
| **SQLite / PostgreSQL** | Base de données | Portable, transactions avec locks optimisés |
| **Google OAuth** | Authentification sociale | Intégration OAuth 2.0 |

### Frontend
| Technologie | Usage | Défis Relevés |
|-------------|-------|---------------|
| **JavaScript ES6+** | Langage principal | Modules, async/await, promises |
| **Three.js** | Rendu 3D | Optimisations GPU, instancing, shadows |
| **WebSocket API** | Communication temps réel | Reconnexion automatique, retry avec backoff |
| **Router personnalisé** | Navigation SPA | Historique, gestion du bouton "précédent" |
| **Blender** | Modélisation 3D | Création de meshes optimisés (.glb) |
| **Photoshop / Illustrator** | Création graphique | Textures, sprites, éléments UI |

### DevOps & Outils
- **Docker / Docker Compose** : Conteneurisation
- **Git** : Versioning
- **Cursor AI** : Assistant de développement

---

## 🚀 Fonctionnalités Techniques Majeures

### 1. Architecture Monopage (SPA)
- ✅ Navigation sans rechargement de page
- ✅ Router personnalisé avec gestion de l'historique
- ✅ Chargement dynamique des partials HTML
- ✅ Gestion du bouton "précédent" du navigateur
- ✅ Import/Export de modules JavaScript

**Exemple de flux de navigation** :
```
Landing → Authentification → Menu du jeu → Création/Rejoindre partie → Jeu 3D
```

### 2. Authentification Multi-Sources
- ✅ Google OAuth 2.0
- ✅ Compte personnel (email/mot de passe)
- ✅ Hash BCrypt pour la sécurité
- ✅ Tokens JWT avec expiration
- ✅ Middleware d'authentification sur toutes les routes protégées

### 3. WebSocket Temps Réel
- ✅ Connexion bidirectionnelle serveur ↔ clients
- ✅ Broadcast aux joueurs d'une même partie
- ✅ Heartbeat bidirectionnel (détection de déconnexion)
- ✅ **Reconnexion automatique** avec restauration des channels
- ✅ Système de retry pour les messages perdus

**Gestion de la fiabilité** :
```javascript
// Retry automatique avec timeout
async sendActionToApi(actionData) {
    const maxRetries = 10;
    const timeoutDuration = 10000; // 10s
    // Logique de retry avec backoff exponentiel
}
```

### 4. Rendu 3D avec Three.js
- ✅ Scène 3D interactive avec caméra isométrique
- ✅ **Instancing des meshes** pour optimisation GPU
- ✅ Chargement asynchrone des modèles GLTF (.glb)
- ✅ Chargement asynchrone des textures (WebP)
- ✅ Système d'ombres optimisé (changement de repère)
- ✅ Éclairage dynamique (ambiant + directionnel)
- ✅ Gestion du drag & drop en 3D
- ✅ Raycasting pour les interactions

**Optimisations GPU** :
- Tous les meshes instanciés (économie de draw calls)
- Textures en format WebP (compression)
- Meshes low-poly créés sur Blender
- Calcul des ombres uniquement dans la vision de l'utilisateur

### 5. Logique de Jeu Côté Client
**Pourquoi côté client ?** Alléger la charge serveur, réactivité maximale

- ✅ **Gameplay simultané** : Tous les joueurs jouent en même temps
- ✅ Validation des actions en local (anti-triche)
- ✅ Gestion des tours chronométrés côté front
- ✅ Changement d'action possible tant que le tour n'est pas terminé
- ✅ Synchronisation via WebSocket quand tous les joueurs ont joué

**Système anti-triche** :
```ruby
# Backend - Vérification des actions
def create
  # Vérification du game_user_id
  if action_params[:game_user_id].to_i != @game_user.id
    return forbidden
  end
  
  # Vérification du tour actuel
  if action_params[:turn].to_i != @game.simultaneous_play_turn
    return forbidden
  end
  # ...
end
```

Chaque action est vérifiée côté serveur. Si triche détectée → les joueurs sont prévenus (pas de sanction automatique).

### 6. Transactions & Locks Optimisés

**Problématique** : Éviter les race conditions dans un jeu multijoueur temps réel

```ruby
# Exemple de transaction avec lock optimisé
def i_am_ready(game_user)
  transaction do
    self.lock!  # Lock de la partie
    if self.game_status == "waiting_for_confirmation_players"
      game_user.update(player_ready: true)
      # Vérifier si tous les joueurs sont prêts
      if game_users.where(player_ready: true).count == player_count
        start_installation_phase()
      end
    end
  end
end
```

- ✅ Locks stratégiques pour minimiser le temps de blocage
- ✅ Transactions atomiques pour les actions critiques
- ✅ Compatible SQLite (dev) et PostgreSQL (prod)

### 7. Système de Callback & Reconnexion

**Côté Frontend** :
- Détection de perte de connexion (timeout sur heartbeat)
- Reconnexion automatique avec backoff exponentiel
- Renvoi des requêtes non confirmées

**Côté Backend** :
- Timer unique partagé pour tous les callbacks (optimisation)
- Gestion des joueurs déconnectés (abandon automatique après timeout)

### 8. Internationalisation (i18n)

- ✅ **10 langues supportées** : FR, EN, ES, DE, IT, PT, RU, JA, KO, ZH
- ✅ Détection automatique de la langue du navigateur
- ✅ Changement de langue dans les options
- ✅ Fichiers JSON de traduction

```javascript
// Structure des traductions
/locales/
  ├── fr.json
  ├── en.json
  ├── es.json
  └── ...
```

### 9. Placement Initial Optimisé

**Problématique** : Générer un placement de départ équilibré pour tous les joueurs

- ✅ Algorithme d'optimisation avec **métahoïdes** (heuristiques)
- ✅ Calcul des distances entre territoires
- ✅ Équilibrage des ressources de départ
- ✅ Placement légèrement aléatoire pour la rejouabilité

### 10. Gestion des Assets 3D

**Création des modèles** :
- Modèles créés sur **Blender** (première utilisation !)
- Minimisation des polygones pour performance
- Export en format GLTF/GLB

**Optimisation des textures** :
- Toutes les images converties en **WebP** (compression supérieure)
- Retouches sur Photoshop/Illustrator
- Sprites créés avec alpha maps

---

## 🧠 Compétences Développées

### Compétences Techniques

#### Langages & Frameworks
- **Ruby** : Apprentissage avancé (méta-programmation, blocks, lambdas)
- **Ruby on Rails** : Architecture MVC, API mode, conventions
- **JavaScript ES6+** : Promesses, async/await, modules, classes
- **SQL** : Requêtes optimisées, transactions, indexes

#### Architecture & Design Patterns
- Séparation des préoccupations (front/back)
- Architecture orientée composants
- Single Page Application (SPA)
- API RESTful
- Real-time avec WebSocket

#### Performance & Optimisation
- Optimisation GPU (instancing, low-poly meshes)
- Lazy loading (textures, modèles 3D)
- Chargement asynchrone
- Transactions avec locks optimisés
- Minimisation des requêtes réseau

#### Sécurité
- Authentification JWT
- Hash de mots de passe (BCrypt)
- Protection CORS
- Validation des entrées utilisateur
- Anti-triche (vérification des actions)

#### DevOps
- Docker & Docker Compose
- Gestion d'environnements (dev/prod)
- Variables d'environnement
- Déploiement

### Compétences Transférables

#### Résolution de Problèmes
- **Vision algorithmique** développée par mes études de mathématiques
- Décomposition de problèmes complexes en sous-problèmes
- Recherche de solutions optimales

#### Apprentissage Autonome
- Capacité à apprendre de nouvelles technologies rapidement
- Lecture de documentation technique (anglais)
- Debugging systématique
- Recherche de solutions (Stack Overflow, documentation officielle)

#### Gestion de Projet
- Priorisation des fonctionnalités
- Décisions techniques (trade-offs)
- Gestion de la dette technique
- Itération et amélioration continue

#### Persévérance
- Projet complexe mené de bout en bout
- Résolution de bugs difficiles
- Apprentissage de multiples technologies en parallèle

---

## 🎓 Défis Techniques Surmontés

### 1. WebSocket avec Authentification JWT
**Difficulté** : Authentifier une connexion WebSocket avec JWT (pas de headers HTTP standard)

**Solution** :
```ruby
# Passage du token dans les query params
ws://localhost:3000/cable?token=JWT_TOKEN

# Vérification dans connection.rb
def find_verified_user
  token = request.params[:token]
  decoded_token = JWT.decode(token, secret, true, { algorithm: 'HS256' })
  User.find(decoded_token[0]['user_id'])
end
```

### 2. Reconnexion WebSocket avec Restauration des Channels
**Difficulté** : Maintenir l'état de l'application après une déconnexion

**Solution** :
- Sauvegarde des channels souscrits avant reconnexion
- Restauration automatique après reconnexion réussie
- Heartbeat bidirectionnel pour détecter les déconnexions

### 3. Optimisation des Ombres en 3D
**Difficulté** : Le calcul des ombres est coûteux en GPU

**Solution** :
- Changement de repère pour calculer uniquement dans la vision de l'utilisateur
- Désactivation des ombres sur les objets éloignés
- Optimisation du shadow map

### 4. Race Conditions en Multijoueur
**Difficulté** : Plusieurs joueurs envoient des actions simultanément

**Solution** :
```ruby
transaction do
  game.lock!  # Lock pessimiste
  # Traitement atomique
  game.update!(simultaneous_play_turn: turn + 1)
end
```

### 5. Gestion du Gameplay Simultané
**Difficulté** : Contrairement aux jeux de société traditionnels (tour par tour), tous les joueurs jouent en même temps

**Solution** :
- Timer côté client (économie de ressources serveur)
- Actions modifiables tant que le tour n'est pas terminé
- Broadcast quand tous les joueurs ont validé

### 6. First Time avec JavaScript
**Difficulté** : Aucune expérience préalable en JavaScript

**Solution** :
- Apprentissage progressif (bases → ES6+ → Three.js)
- Lecture de la documentation MDN
- Pratique avec des exemples simples avant d'attaquer le projet

---

## 📂 Structure du Projet

```
yuan2/
├── api/                          # Backend Rails
│   ├── app/
│   │   ├── controllers/          # Endpoints API
│   │   │   ├── api/v1/
│   │   │   │   ├── auth_controller.rb       # Authentification
│   │   │   │   ├── games_controller.rb      # Gestion des parties
│   │   │   │   ├── actions_controller.rb    # Actions des joueurs
│   │   │   │   └── bidding_controller.rb    # Enchères des clans
│   │   ├── channels/             # WebSocket channels
│   │   │   ├── game_channel.rb              # Channel de jeu
│   │   │   └── application_cable/
│   │   │       └── connection.rb            # Auth WebSocket
│   │   ├── models/               # Modèles ActiveRecord
│   │   │   ├── user.rb
│   │   │   ├── game.rb
│   │   │   ├── action.rb
│   │   │   └── ...
│   │   └── services/
│   │       └── json_web_token.rb            # Service JWT
│   ├── config/
│   │   ├── initializers/cors.rb             # Configuration CORS
│   │   └── routes.rb                        # Routes API
│   ├── db/
│   │   ├── migrate/                         # Migrations
│   │   └── schema.rb
│   ├── Gemfile                              # Dépendances Ruby
│   └── Dockerfile                           # Conteneurisation
│
├── web/                          # Frontend
│   ├── index.html                # Point d'entrée
│   ├── js/
│   │   ├── app.js                # Initialisation
│   │   ├── app/                  # Pages de l'application
│   │   │   ├── router.js                    # Router SPA personnalisé
│   │   │   ├── auth.js                      # Gestion authentification
│   │   │   ├── websocket.js                 # Client WebSocket
│   │   │   ├── landing.js                   # Page d'accueil
│   │   │   ├── gameMenu.js                  # Menu du jeu
│   │   │   └── ...
│   │   ├── core/                 # Utilitaires
│   │   │   └── i18n.js                      # Internationalisation
│   │   └── game_logic_yuan/      # Logique du jeu
│   │       ├── gameApi.js                   # Communication avec l'API
│   │       ├── gameState.js                 # État global du jeu
│   │       ├── StartingPositions.js         # Placement initial optimisé
│   │       ├── phases/                      # Phases de jeu
│   │       │   ├── biddingPhase.js
│   │       │   ├── installationPhase.js
│   │       │   └── simultaneous-play-phase/
│   │       ├── pieces/                      # Gestion des pièces 3D
│   │       │   └── MeepleManager.js
│   │       ├── gameplay/                    # Mécaniques de jeu
│   │       │   ├── arrowManager.js
│   │       │   └── taxe.js
│   │       └── ui/                          # Interface 3D
│   │           ├── GameBoard3D.js           # Plateau de jeu 3D
│   │           └── ShadowManager.js         # Gestion des ombres
│   ├── partials/                 # Templates HTML
│   │   ├── landing-page.html
│   │   ├── game-menu.html
│   │   └── ...
│   ├── css/                      # Styles
│   │   ├── base.css
│   │   ├── landing.css
│   │   └── ...
│   ├── locales/                  # Traductions i18n
│   │   ├── en.json
│   │   ├── fr.json
│   │   └── ...
│   ├── glb/                      # Modèles 3D
│   │   ├── tiles/                           # Tuiles hexagonales
│   │   └── meeple/                          # Pièces de jeu
│   ├── images/                   # Images (WebP)
│   └── svg/                      # Icônes vectorielles
│
├── docker-compose.yml            # Orchestration Docker
├── .env.template                 # Template des variables d'environnement
└── README.md                     # Ce fichier
```

---

## 🚀 Installation & Lancement

### Prérequis
- Ruby 3.x
- Rails 7.2+
- Redis
- Node.js (optionnel, pour servir le frontend)

### Avec Docker (Recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/votre-username/yuan2.git
cd yuan2

# 2. Configurer les variables d'environnement
cp env.template .env
# Éditer .env avec vos clés (GOOGLE_CLIENT_ID, SECRET_KEY_BASE, etc.)

# 3. Lancer avec Docker Compose
docker-compose up -d

# 4. Accéder à l'application
# API : http://localhost:3000
# Frontend : Servir le dossier web/ avec un serveur HTTP
```

### Installation Manuelle

#### Backend (API)
```bash
cd api
bundle install
rails db:create db:migrate
redis-server  # Dans un terminal séparé
rails server
```

#### Frontend
```bash
cd web
# Avec Python
python3 -m http.server 8000

# Ou avec Node.js
npx http-server -p 8000
```

#### Accès
- **API** : http://localhost:3000
- **Frontend** : http://localhost:8000

---

## 🧪 Tests

*Note : Les tests unitaires n'ont pas été implémentés dans cette version initiale du projet. C'est un point d'amélioration identifié pour une future itération.*

---

## 📝 Documentation Complémentaire

Le projet contient plusieurs fichiers de documentation technique :

- **`ARCHITECTURE.md`** : Architecture détaillée du frontend
- **`WEBSOCKET_README.md`** : Mise en place des WebSockets
- **`AUTHENTICATION_IMPLEMENTATION.md`** : Système d'authentification
- **`difficulte.md`** : Journal des difficultés rencontrées et solutions
- **`GUIDE_DEPLOIEMENT.md`** : Guide de déploiement en production

---

## 🎯 Points d'Amélioration Identifiés

Avec l'avancement du projet et mes connaissances qui se sont développées, voici les améliorations que j'identifie :

### Code Quality
- Refactorisation de certains fichiers volumineux (ex: `GameBoard3D.js` - 1543 lignes)
- Meilleure séparation des responsabilités dans certains modules
- Ajout de tests unitaires et d'intégration

### Performance
- Implémentation d'un système de cache côté serveur
- Optimisation supplémentaire des requêtes SQL (N+1 queries)
- Pagination des résultats

### Fonctionnalités
- Système de classement/ranking des joueurs
- Replay des parties
- Mode spectateur
- Statistiques détaillées

### DevOps
- Pipeline CI/CD automatisé
- Monitoring et alertes
- Logs structurés

**Pourquoi ne pas les avoir implémentés ?** J'ai fait le choix de **finir le projet en état fonctionnel** plutôt que de viser la perfection, car mon objectif principal est de **trouver un emploi** et de continuer à apprendre dans un contexte professionnel.

---

## 💡 Ce que J'ai Appris

### Sur le Plan Technique
- **Apprendre à apprendre** : Capacité à maîtriser rapidement de nouvelles technologies
- **Architecture logicielle** : Conception d'une application full-stack complexe
- **Performance** : Optimisations frontend et backend
- **Sécurité** : Bonnes pratiques d'authentification et de validation

### Sur le Plan Personnel
- **Persévérance** : Mener un projet ambitieux jusqu'au bout malgré les difficultés
- **Gestion de la complexité** : Décomposer un problème énorme en sous-problèmes gérables
- **Prise de décision** : Trade-offs entre perfection et pragmatisme
- **Humilité** : Reconnaître ce qui peut être amélioré

### Transférabilité
Ce projet démontre que **mes compétences ne sont pas limitées à Ruby et JavaScript**. Ma formation en mathématiques m'a donné une **compréhension algorithmique** profonde, et ce projet prouve ma **capacité d'adaptation** à de nouveaux langages et technologies.

---

## 🎓 Pourquoi Me Recruter ?

### 1. Capacité d'Apprentissage Prouvée
- Appris JavaScript de zéro et construit un projet 3D complexe
- Maîtrisé des technologies diverses (Rails, Three.js, WebSocket, Docker, Blender)
- Capable de lire et comprendre de la documentation technique

### 2. Vision Algorithmique
- 15 ans d'enseignement des mathématiques
- Capacité à décomposer des problèmes complexes
- Approche méthodique et logique

### 3. Autonomie & Débrouillardise
- Projet réalisé en totale autonomie
- Résolution de problèmes techniques variés
- Gestion complète du cycle de développement

### 4. Pragmatisme
- Priorisation des fonctionnalités
- Équilibre entre qualité et livraison
- Conscience des points d'amélioration

### 5. Passion & Motivation
- Reconversion professionnelle choisie
- Projet personnel ambitieux achevé
- Envie d'apprendre et de progresser

---

## 📧 Contact

**Nom** : SIGOGNEAU  
**Email** : charliesigogneau@gmail.com, charliesigogneau@gmail.com
**LinkedIn** : www.linkedin.com/in/charlie-sigogneau-61685b325


---

## 📄 Licence

Ce projet est un projet personnel de portfolio. Le code source est disponible à des fins de démonstration de compétences.

Le jeu "Yuan - L'Art de la Guerre" est ma création originale (design et règles).

---

## 🙏 Remerciements

- **TheHackingProject** pour la formation de base en Ruby/Rails
- **Cursor AI** pour l'assistance au développement
- La **communauté open-source** pour les bibliothèques et frameworks utilisés
- Les **créateurs de documentation** (MDN, Rails Guides, Three.js docs)

---

<div align="center">

**⭐ Si ce projet vous intéresse pour un recrutement, n'hésitez pas à me contacter ! ⭐**

*Développé avec passion et détermination*

</div>
