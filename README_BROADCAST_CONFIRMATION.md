# 📡 Système de Confirmation des Broadcasts game_details

## 🎯 Objectif

Ce système garantit que tous les messages `game_details` envoyés via WebSocket sont bien reçus par les clients, avec un mécanisme de retry automatique en cas de problème réseau.

## 🏗️ Architecture

### Backend (Ruby on Rails)

1. **BroadcastConfirmationService** (`app/services/broadcast_confirmation_service.rb`)
   - Enregistre chaque broadcast dans Redis avec un compteur de tentatives
   - Vérifie périodiquement les broadcasts non confirmés
   - Retente l'envoi jusqu'à 20 fois maximum
   - Utilise Redis pour garantir l'atomicité (thread-safe, compatible load balancing)

2. **GameBroadcast** (`app/services/game_broadcast.rb`)
   - Modifié pour enregistrer automatiquement les broadcasts `game_details`
   - Fonctionne avec `game_broadcast_game_details` (tous les joueurs)
   - Fonctionne avec `user_broadcast_game_details` (un seul joueur)

3. **GamesController** (`app/controllers/api/v1/games_controller.rb`)
   - Nouvelle méthode `confirm_game_details_reception`
   - Reçoit les confirmations du frontend
   - Vérifie l'autorisation (le current_user doit correspondre au game_user)

4. **BroadcastRetryWorker** (`config/initializers/broadcast_retry_worker.rb`)
   - Worker simple qui tourne en background
   - Vérifie toutes les 5 secondes les broadcasts en attente
   - Alternative légère à Sidekiq pour démarrer rapidement

### Frontend (JavaScript)

1. **gameApi.js** (`web/js/game_logic_yuan/gameApi.js`)
   - À la réception d'un `game_details`, envoie automatiquement une confirmation
   - Nouvelle méthode `confirmGameDetailsReception()`
   - Échec silencieux (pas d'alerte utilisateur) car le retry serveur gère

## 📊 Flux de données

```
1. Backend envoie game_details
   ↓
2. Backend enregistre dans Redis (tentative = 1)
   ↓
3. Frontend reçoit le message
   ↓
4. Frontend envoie confirmation POST /games/confirm_game_details_reception
   ↓
5. Backend supprime l'entrée Redis (OK, message reçu)

SI PAS DE CONFIRMATION:
   ↓
6. Worker vérifie toutes les 5s
   ↓
7. Incrémente le compteur et renvoie le message
   ↓
8. Répète jusqu'à 20 tentatives max (100 secondes)
```

## 🔧 Configuration

### Redis

Le système utilise Redis qui est déjà configuré dans votre projet (ActionCable).

Structure des données Redis:
```
Key: "broadcast_confirmation:{game_user_id}"
Value (Hash):
  - game_id: "123"
  - retry_count: "3"
  - timestamp: "1634567890"
TTL: 120 secondes (auto-cleanup)
```

### Worker

**Option 1: Worker simple (actuelle)**
- Démarre automatiquement avec le serveur Rails
- Fonctionne dans le même process que Rails
- Parfait pour le développement et petite production

**Option 2: Sidekiq (recommandé pour production)**

1. Ajouter au Gemfile:
```ruby
gem 'sidekiq'
gem 'sidekiq-scheduler'
```

2. Installer:
```bash
bundle install
```

3. Désactiver le worker simple dans `config/initializers/broadcast_retry_worker.rb`:
```ruby
# Commenter ou supprimer les dernières lignes
# if defined?(Rails::Server) || ENV['BROADCAST_RETRY_WORKER'] == 'true'
#   Rails.application.config.after_initialize do
#     BroadcastRetryWorker.start
#   end
# end
```

4. Démarrer Sidekiq:
```bash
bundle exec sidekiq -C config/sidekiq.yml
```

La configuration est déjà prête dans:
- `app/jobs/broadcast_retry_job.rb`
- `config/sidekiq_scheduler.yml`
- `config/initializers/sidekiq_scheduler.rb`

## 🔍 Monitoring

### Statistiques en temps réel

Depuis la console Rails:
```ruby
BroadcastConfirmationService.pending_broadcasts_stats
# => {
#   total: 3,
#   by_retry_count: {
#     1 => 2,  # 2 broadcasts à la 1ère tentative
#     5 => 1   # 1 broadcast à la 5ème tentative
#   }
# }
```

### Logs

Le système log automatiquement:
- 📝 Enregistrement d'un broadcast
- ✅ Confirmation reçue
- 🔄 Retry avec numéro de tentative
- ❌ Abandon après 20 tentatives
- ⚠️ Erreurs

Exemple de logs:
```
📝 Broadcast enregistré pour game_user_id=42, game_id=7
✅ Confirmation reçue pour game_user_id=42
🔄 Retry 3/20 pour game_user_id=43, game_id=7
❌ Abandon après 20 tentatives pour game_user_id=44
```

## 🧪 Tests

### Test manuel

1. Démarrer le serveur Rails
2. Observer les logs: le worker devrait démarrer
3. Jouer une partie
4. Vérifier dans les logs les confirmations

### Simuler un problème réseau

Dans la console frontend (navigateur):
```javascript
// Bloquer temporairement les confirmations
gameApi.confirmGameDetailsReception = async () => {
  console.log('Confirmation bloquée pour test');
};
```

Vous devriez voir dans les logs Rails les retries toutes les 5 secondes.

### Vérifier Redis

```bash
redis-cli
> KEYS broadcast_confirmation:*
> HGETALL broadcast_confirmation:42
```

## 📈 Métriques

- **Temps maximum de retry**: 100 secondes (20 tentatives × 5 secondes)
- **TTL Redis**: 120 secondes (auto-cleanup après abandon)
- **Intervalle de vérification**: 5 secondes
- **Atomicité**: Garantie par Redis (compatible multi-serveurs)

## 🚀 Optimisations futures

1. **Métriques Prometheus/Grafana**
   - Nombre de retries par période
   - Taux de succès des confirmations
   - Temps moyen de confirmation

2. **Alerting**
   - Alert si trop de broadcasts non confirmés
   - Alert si Redis est indisponible

3. **Retry exponentiel**
   - Au lieu de 5s constant, utiliser: 5s, 10s, 20s, etc.

4. **Priority queue**
   - Retenter d'abord les broadcasts les plus récents

## ❓ FAQ

**Q: Pourquoi Redis et pas une simple Hash Ruby ?**
R: Redis garantit l'atomicité et fonctionne avec plusieurs serveurs Rails (load balancing).

**Q: Que se passe-t-il si Redis est down ?**
R: Les broadcasts fonctionnent toujours (envoi direct), mais pas de retry en cas de perte.

**Q: Pourquoi 20 tentatives ?**
R: 100 secondes de retry (20 × 5s) est un bon compromis entre persistance et performance.

**Q: Ça consomme beaucoup de ressources ?**
R: Non, le worker vérifie seulement toutes les 5s et Redis est très léger.

## 🔐 Sécurité

- ✅ Vérification de l'autorisation (current_user vs game_user)
- ✅ Pas d'exposition de données sensibles
- ✅ TTL automatique dans Redis (pas d'accumulation)
- ✅ Validation des paramètres côté serveur

## 📝 Notes techniques

- Compatible avec WebSocket (ActionCable)
- Compatible avec multi-serveurs (via Redis)
- Thread-safe
- Auto-cleanup (TTL Redis)
- Pas de dépendances externes (sauf Redis)

