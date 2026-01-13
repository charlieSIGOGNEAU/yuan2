# 🧪 Guide d'exécution des tests dans Docker

## 📁 Structure des tests créés

```
api/test/
├── test_helper.rb              # Configuration et helpers
├── models/
│   └── game_test.rb            # Tests unitaires du modèle Game
├── controllers/
│   └── games_controller_test.rb # Tests d'intégration du contrôleur
└── integration/
    └── concurrency_test.rb     # Tests de concurrence/race conditions
```

## 🚀 Commandes pour exécuter les tests

### 1. Préparer la base de données de test

```bash
# Entrer dans le container
docker compose -f docker-compose.dev.yml exec api bash

# Créer la base de données de test
RAILS_ENV=test bin/rails db:create

# Migrer la base de données de test
RAILS_ENV=test bin/rails db:migrate
```

### 2. Exécuter tous les tests

```bash
# Depuis l'intérieur du container
docker compose -f docker-compose.dev.yml exec api bin/rails test

# OU depuis l'extérieur du container
docker compose -f docker-compose.dev.yml exec api bin/rails test
```

### 3. Exécuter des tests spécifiques

```bash
# Tests unitaires du modèle Game uniquement
docker compose -f docker-compose.dev.yml exec api bin/rails test test/models/game_test.rb

# Tests d'intégration du contrôleur uniquement
docker compose -f docker-compose.dev.yml exec api bin/rails test test/controllers/games_controller_test.rb

# Tests de concurrence uniquement
docker compose -f docker-compose.dev.yml exec api bin/rails test test/integration/concurrency_test.rb

# Un test spécifique par son nom
docker compose -f docker-compose.dev.yml exec api bin/rails test test/models/game_test.rb -n "test_add_player_increments_waiting_players_count"
```

### 4. Exécuter les tests avec plus de détails

```bash
# Mode verbose
docker compose -f docker-compose.dev.yml exec api bin/rails test -v

# Afficher les tests lents
docker compose -f docker-compose.dev.yml exec api bin/rails test --profile
```

## 📊 Types de tests disponibles

### Tests Unitaires (`test/models/game_test.rb`)
| Test | Objectif | Risque couvert |
|------|----------|----------------|
| `test_game_requires_game_status...` | Validations de base | Données corrompues |
| `test_game_status_enum_contains...` | Enum complet | États manquants |
| `test_calculate_tile_count...` | Calcul tuiles | Partie non jouable |
| `test_the_clans...` | Attribution clans | Clans incorrects |
| `test_add_player...` | Ajout joueur | Partie corrompue |
| `test_ongoing_game...` | Détection partie en cours | Multi-parties |
| `test_find_or_create_waiting_game...` | Matchmaking | Mauvais matching |
| `test_i_am_ready...` | Confirmation présence | Lancement prématuré |
| `test_creat_custom_game...` | Création custom | Code non unique |
| `test_give_up_game...` | Abandon | Données corrompues |
| `test_check_game_completion...` | Fin par abandon | Partie zombie |

### Tests d'Intégration (`test/controllers/games_controller_test.rb`)
| Test | Objectif | Risque couvert |
|------|----------|----------------|
| `test_quick_game_returns_401...` | Auth requise | Accès non autorisé |
| `test_quick_game_creates_new...` | Création partie | Échec matchmaking |
| `test_creat_custom_game...` | Partie custom | Initialisation incorrecte |
| `test_join_game_custom...` | Join custom | Code invalide |
| `test_i_am_ready...` | Confirmation | Lancement incorrect |
| `test_give_up_game...` | Abandon | Suppression incorrecte |
| `test_submit_victory...` | Résultats | Rankings incorrects |
| `test_launch_custom_game...` | Lancement | Non-créateur lance |

### Tests de Concurrence (`test/integration/concurrency_test.rb`)
| Test | Objectif | Risque couvert |
|------|----------|----------------|
| `test_concurrent_add_player...` | Join simultané | Dépassement player_count |
| `test_concurrent_quick_game...` | Matchmaking concurrent | Fragmentation parties |
| `test_concurrent_i_am_ready...` | Ready simultané | Double initialisation |
| `test_concurrent_give_up_game...` | Abandon concurrent | Compteur négatif |
| `test_concurrent_join_custom...` | Join custom concurrent | >8 joueurs |
| `test_concurrent_submit_victory...` | Submit concurrent | Perte soumission |
| `test_concurrent_launch_custom...` | Launch concurrent | Double lancement |
| `test_stress_test...` | Charge | Stabilité système |

## 🔧 Dépannage

### Erreur "database does not exist"
```bash
docker compose -f docker-compose.dev.yml exec api RAILS_ENV=test bin/rails db:create
```

### Erreur "migrations pending"
```bash
docker compose -f docker-compose.dev.yml exec api RAILS_ENV=test bin/rails db:migrate
```

### Réinitialiser la base de test
```bash
docker compose -f docker-compose.dev.yml exec api RAILS_ENV=test bin/rails db:drop db:create db:migrate
```

### Tests qui échouent à cause de données résiduelles
```bash
# Nettoyer manuellement
docker compose -f docker-compose.dev.yml exec api RAILS_ENV=test bin/rails runner "
  Action.delete_all
  Bidding.delete_all
  Tile.delete_all
  GameUser.delete_all
  Clan.delete_all
  Game.delete_all
  User.where('email LIKE ?', '%@test.com').delete_all
"
```

## 📝 Ajouter de nouveaux tests

### Modèle de test unitaire
```ruby
# test/models/nouveau_test.rb
require "test_helper"

class NouveauTest < ActiveSupport::TestCase
  # Objectif: [Description]
  # Risque: [Ce que ça prévient]
  test "description du test" do
    # Arrange - créer les données
    user = create_test_user
    
    # Act - exécuter l'action
    result = SomeModel.some_method(user)
    
    # Assert - vérifier le résultat
    assert_equal expected_value, result
  end
end
```

### Modèle de test de contrôleur
```ruby
# test/controllers/nouveau_controller_test.rb
require "test_helper"

class Api::V1::NouveauControllerTest < ActionDispatch::IntegrationTest
  test "endpoint returns success" do
    user = create_test_user
    
    post "/api/v1/nouveau/action", headers: auth_headers(user)
    
    assert_response :success
    json = JSON.parse(response.body)
    assert json['success']
  end
end
```

### Modèle de test de concurrence
```ruby
# test/integration/nouveau_concurrency_test.rb
require "test_helper"

class NouveauConcurrencyTest < ActionDispatch::IntegrationTest
  test "concurrent access is safe" do
    users = 5.times.map { create_test_user }
    threads = []
    results = []
    
    users.each do |user|
      threads << Thread.new do
        result = SomeModel.concurrent_operation(user)
        results << result
      end
    end
    
    threads.each(&:join)
    
    # Vérifications
    assert results.all? { |r| r[:success] }
  end
end
```

## ✅ Checklist avant commit

- [ ] `bin/rails test` passe sans erreur
- [ ] Les tests de concurrence passent
- [ ] Pas de données résiduelles après les tests
- [ ] Les nouveaux tests suivent le pattern existant



