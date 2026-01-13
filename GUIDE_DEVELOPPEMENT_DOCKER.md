# 🛠️ Guide : Développement avec Docker

## 🎯 Comment ça fonctionne ?

**Avec la configuration de développement, vous n'avez PAS besoin de reconstruire le container à chaque modification !**

### Principe des volumes

Les **volumes** montent votre code local dans le container Docker. Quand vous modifiez un fichier sur votre machine, le changement est **immédiatement visible** dans le container.

```
Votre machine          Container Docker
─────────────          ───────────────
./api/app/models/  ───> /rails/app/models/
     ↓                        ↓
  Modifiez ici          Visible ici instantanément
```

## 🚀 Utilisation

### 1. Première fois : Construire l'image

```bash
cd /home/dipsi0/thp/yuan2

# Construire l'image (une seule fois, ou quand vous changez le Gemfile)
docker compose -f docker-compose.dev.yml build
```

### 2. Lancer les services

```bash
# Lancer tous les services (PostgreSQL + Redis + API)
docker compose -f docker-compose.dev.yml up -d

# Voir les logs
docker compose -f docker-compose.dev.yml logs -f api
```

### 3. Travailler normalement

**Maintenant, vous pouvez :**

✅ **Modifier vos fichiers** dans `api/` - les changements sont visibles immédiatement  
✅ **Rails recharge automatiquement** le code en mode développement  
✅ **Pas besoin de reconstruire** le container  
✅ **Pas besoin de redémarrer** le serveur (sauf pour certains changements de config)

### 4. Exécuter des commandes Rails

```bash
# Migrations
docker compose -f docker-compose.dev.yml exec api rails db:migrate

# Console
docker compose -f docker-compose.dev.yml exec api rails console

# Créer un modèle (exemple)
docker compose -f docker-compose.dev.yml exec api rails generate model User name:string email:string

# Seeds
docker compose -f docker-compose.dev.yml exec api rails db:seed
```

## 📝 Workflow de développement typique

### Scénario 1 : Modifier un modèle

```bash
# 1. Modifiez api/app/models/user.rb dans votre éditeur
# 2. Rails recharge automatiquement (pas besoin de redémarrer)
# 3. Testez dans la console :
docker compose -f docker-compose.dev.yml exec api rails console
```

### Scénario 2 : Ajouter une route

```bash
# 1. Modifiez api/config/routes.rb
# 2. Rails recharge automatiquement
# 3. Testez avec curl :
curl http://localhost:3000/votre_nouvelle_route
```

### Scénario 3 : Créer une migration

```bash
# 1. Créer la migration
docker compose -f docker-compose.dev.yml exec api rails generate migration AddEmailToUsers email:string

# 2. Modifiez le fichier de migration créé dans api/db/migrate/

# 3. Exécutez la migration
docker compose -f docker-compose.dev.yml exec api rails db:migrate
```

### Scénario 4 : Ajouter une gem

```bash
# 1. Ajoutez la gem dans api/Gemfile

# 2. Reconstruisez l'image (seulement quand vous changez le Gemfile)
docker compose -f docker-compose.dev.yml build api

# 3. Redémarrez le container
docker compose -f docker-compose.dev.yml restart api
```

## ⚠️ Quand reconstruire le container ?

Vous devez **reconstruire** (`docker compose build`) seulement quand :

- ✅ Vous modifiez le `Gemfile` (ajout/suppression de gems)
- ✅ Vous modifiez le `Dockerfile`
- ✅ Vous modifiez des fichiers de configuration système

Vous **N'AVEZ PAS BESOIN** de reconstruire pour :

- ❌ Modifier le code Ruby (app/, lib/, etc.)
- ❌ Modifier les routes (config/routes.rb)
- ❌ Modifier les contrôleurs, modèles, vues
- ❌ Créer des migrations (juste les exécuter)
- ❌ Modifier les fichiers de config Rails (database.yml, etc.)

## 🔄 Redémarrer le serveur

En général, Rails recharge automatiquement le code en développement. Mais parfois, vous devez redémarrer :

```bash
# Redémarrer seulement l'API
docker compose -f docker-compose.dev.yml restart api

# Ou arrêter et relancer
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d
```

## 🧪 Tester vos modifications

### Tester une route API

```bash
# Depuis votre machine
curl http://localhost:3000/api/v1/votre_route
```

### Tester dans la console Rails

```bash
docker compose -f docker-compose.dev.yml exec api rails console

# Dans la console :
User.count
Game.first
# etc.
```

### Voir les logs en temps réel

```bash
docker compose -f docker-compose.dev.yml logs -f api
```

## 📊 Comparaison : Production vs Développement

| Aspect | Production (`docker-compose.yml`) | Développement (`docker-compose.dev.yml`) |
|--------|-----------------------------------|------------------------------------------|
| **Code** | Copié dans l'image | Monté via volume |
| **Modifications** | Besoin de reconstruire | Visibles immédiatement |
| **RAILS_ENV** | `production` | `development` |
| **Rechargement** | Non | Oui (automatique) |
| **Performance** | Optimisée | Moins optimisée |
| **Logs** | Minimaux | Verbose |

## 🛠️ Commandes utiles

### Voir les containers en cours

```bash
docker compose -f docker-compose.dev.yml ps
```

### Accéder au shell du container

```bash
docker compose -f docker-compose.dev.yml exec api bash
```

### Voir les logs

```bash
# Tous les services
docker compose -f docker-compose.dev.yml logs -f

# Seulement l'API
docker compose -f docker-compose.dev.yml logs -f api

# Dernières 100 lignes
docker compose -f docker-compose.dev.yml logs --tail=100 api
```

### Arrêter tout

```bash
docker compose -f docker-compose.dev.yml down
```

### Nettoyer (supprimer les volumes aussi)

```bash
# ⚠️ ATTENTION : Supprime aussi la base de données !
docker compose -f docker-compose.dev.yml down -v
```

## 🐛 Dépannage

### Le code ne se recharge pas

```bash
# Vérifiez que RAILS_ENV=development
docker compose -f docker-compose.dev.yml exec api env | grep RAILS_ENV

# Redémarrez le container
docker compose -f docker-compose.dev.yml restart api
```

### Les modifications ne sont pas visibles

```bash
# Vérifiez que le volume est bien monté
docker compose -f docker-compose.dev.yml exec api ls -la /rails/app/models/

# Vérifiez les logs pour des erreurs
docker compose -f docker-compose.dev.yml logs api
```

### Erreur "port already in use"

```bash
# Arrêtez les autres containers qui utilisent le port 3000
docker compose down
docker compose -f docker-compose.dev.yml up -d
```

## ✅ Checklist de démarrage

- [ ] `docker-compose.dev.yml` créé
- [ ] Image construite (`docker compose -f docker-compose.dev.yml build`)
- [ ] Services lancés (`docker compose -f docker-compose.dev.yml up -d`)
- [ ] Migrations exécutées (`docker compose -f docker-compose.dev.yml exec api rails db:migrate`)
- [ ] API accessible sur `http://localhost:3000`
- [ ] Modifications de code testées (elles doivent être visibles immédiatement)

## 🎯 Résumé

**Avec Docker en développement :**
- ✅ Vous modifiez vos fichiers normalement
- ✅ Les changements sont visibles immédiatement
- ✅ Rails recharge automatiquement
- ✅ Pas besoin de reconstruire sauf pour le Gemfile
- ✅ Même environnement que la production

**C'est comme travailler en local, mais avec Docker !** 🚀

