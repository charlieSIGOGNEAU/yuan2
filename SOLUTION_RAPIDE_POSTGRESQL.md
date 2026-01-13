# 🚀 Solution Rapide : Tester PostgreSQL en Local avec Docker

## ⚠️ Problème actuel

Vous avez un problème avec `bundle install` qui bloque, ce qui empêche d'utiliser `rails db:migrate` directement.

## ✅ Solution : Utiliser Docker (le plus simple)

Docker contourne complètement le problème de `bundle install` car il installe les gems dans le container.

### Étape 1 : Vérifier que Docker est installé

```bash
docker --version
docker compose --version
```

### Étape 2 : Créer/modifier le fichier `.env`

```bash
cd /home/dipsi0/thp/yuan2
cp env.template .env
# Éditez .env et remplissez les valeurs obligatoires
```

### Étape 3 : Construire et lancer avec Docker

```bash
cd /home/dipsi0/thp/yuan2

# Construire les images (cela peut prendre quelques minutes la première fois)
docker compose build

# Lancer les services (PostgreSQL + Redis + API)
docker compose up -d

# Voir les logs
docker compose logs -f api
```

### Étape 4 : Les migrations s'exécutent automatiquement

Grâce à `docker-entrypoint`, les migrations s'exécutent automatiquement au démarrage. Vous pouvez vérifier dans les logs.

### Étape 5 : Tester

```bash
# Vérifier que tout fonctionne
docker compose ps

# Accéder à la console Rails
docker compose exec api rails console

# Dans la console, tester :
ActiveRecord::Base.connection.execute("SELECT version();")
# Devrait afficher la version de PostgreSQL

# Tester un modèle
User.count rescue puts "Pas d'utilisateurs"
Game.count rescue puts "Pas de jeux"

exit
```

### Étape 6 : Accéder à l'API

L'API sera accessible sur `http://localhost:3000`

---

## 🔧 Commandes utiles Docker

### Voir les logs

```bash
docker compose logs api        # Logs de l'API
docker compose logs postgres   # Logs de PostgreSQL
docker compose logs -f api     # Suivre les logs en temps réel
```

### Exécuter des commandes Rails

```bash
# Migrations
docker compose exec api rails db:migrate

# Console
docker compose exec api rails console

# Créer un utilisateur (exemple)
docker compose exec api rails runner "User.create!(email: 'test@example.com', password: 'password')"
```

### Accéder à PostgreSQL directement

```bash
docker compose exec postgres psql -U postgres -d yuan2_production
```

### Arrêter les services

```bash
docker compose down
```

### Redémarrer

```bash
docker compose restart api
```

---

## 🆚 Comparaison : Docker vs Local

| Aspect | Local (avec bundle) | Docker |
|--------|---------------------|--------|
| **Installation gems** | ❌ Bloque | ✅ Fonctionne |
| **Migrations** | ❌ Ne fonctionne pas | ✅ Automatique |
| **PostgreSQL** | ✅ Installé | ✅ Dans container |
| **Complexité** | ⚠️ Problèmes | ✅ Simple |
| **Performance** | ✅ Plus rapide | ⚠️ Légèrement plus lent |

---

## 📋 Checklist

- [ ] Docker et Docker Compose installés
- [ ] Fichier `.env` créé et rempli
- [ ] `docker compose build` exécuté avec succès
- [ ] `docker compose up -d` lancé
- [ ] Les services sont en cours d'exécution (`docker compose ps`)
- [ ] Les migrations sont exécutées (vérifier les logs)
- [ ] L'API répond sur `http://localhost:3000`

---

## 🎯 Avantages de Docker pour votre cas

1. **Contourne le problème bundle** : Les gems sont installées dans le container
2. **Environnement isolé** : Ne pollue pas votre système
3. **Identique à la production** : Même configuration que sur le serveur
4. **Facile à nettoyer** : `docker compose down -v` supprime tout

---

## ⚠️ Si Docker ne fonctionne pas

Si vous préférez continuer en local sans Docker, il faudra résoudre le problème de `bundle install` d'abord. Consultez `api/FIX_BUNDLE_INSTALL.md` pour les solutions possibles.

