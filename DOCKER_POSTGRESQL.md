# Configuration Docker avec PostgreSQL

## ✅ Modifications effectuées

Votre configuration Docker a été mise à jour pour utiliser PostgreSQL au lieu de SQLite :

### 1. **Dockerfile** (`api/Dockerfile`)
- ✅ Remplacé `sqlite3` par `libpq-dev` (dépendances PostgreSQL)
- ✅ La gem `pg` sera compilée correctement

### 2. **docker-compose.yml**
- ✅ Ajouté un service `postgres` (PostgreSQL 16)
- ✅ Configuré les variables d'environnement pour la connexion à PostgreSQL
- ✅ Ajouté un healthcheck pour s'assurer que PostgreSQL est prêt avant de démarrer l'API
- ✅ Configuré `depends_on` pour que l'API attende PostgreSQL

### 3. **Variables d'environnement**
- ✅ Ajouté `DATABASE_HOST=postgres` (nom du service Docker)
- ✅ Ajouté `DATABASE_USERNAME` et `DATABASE_PASSWORD` (optionnels, par défaut: postgres/postgres)

## 🚀 Utilisation

### 1. Créer/Modifier votre fichier `.env`

```bash
cd /home/dipsi0/thp/yuan2
cp env.template .env
# Éditez .env et remplissez les valeurs obligatoires
```

Les variables PostgreSQL sont optionnelles dans `.env` :
- Si non définies, Docker utilisera `postgres` / `postgres` par défaut
- Vous pouvez les personnaliser si vous voulez :

```bash
DATABASE_USERNAME=mon_user
DATABASE_PASSWORD=mon_password_securise
```

### 2. Construire et lancer

```bash
cd /home/dipsi0/thp/yuan2

# Construire les images
docker compose build

# Lancer les services
docker compose up -d

# Voir les logs
docker compose logs -f api
```

### 3. Exécuter les migrations

Les migrations s'exécutent automatiquement au démarrage grâce à `docker-entrypoint`, mais vous pouvez aussi les lancer manuellement :

```bash
docker compose exec api rails db:migrate
```

## 📋 Différences avec SQLite

| Aspect | SQLite (avant) | PostgreSQL (maintenant) |
|--------|----------------|------------------------|
| **Service Docker** | Aucun | Service `postgres` dédié |
| **Volume de données** | `api_db` (fichiers .sqlite3) | `postgres_data` (données PostgreSQL) |
| **Performance** | Limité pour la production | Optimisé pour la production |
| **Concurrence** | Limité | Excellent |
| **Dépendances** | `sqlite3` | `libpq-dev` |

## 🔧 Commandes utiles

### Accéder à PostgreSQL directement

```bash
# Se connecter à PostgreSQL dans le container
docker compose exec postgres psql -U postgres -d yuan2_production

# Ou depuis l'extérieur (si vous exposez le port)
# docker compose exec postgres psql -h localhost -U postgres -d yuan2_production
```

### Backup de la base de données

```bash
# Exporter la base de données
docker compose exec postgres pg_dump -U postgres yuan2_production > backup.sql

# Restaurer
docker compose exec -T postgres psql -U postgres yuan2_production < backup.sql
```

### Voir les logs PostgreSQL

```bash
docker compose logs postgres
```

### Redémarrer PostgreSQL

```bash
docker compose restart postgres
```

## ⚠️ Important pour le déploiement

Quand vous déployez sur votre serveur :

1. **Variables d'environnement** : Assurez-vous que votre fichier `.env` contient toutes les variables nécessaires
2. **Mot de passe PostgreSQL** : Changez le mot de passe par défaut en production !
3. **Volume de données** : Le volume `postgres_data` contient toutes vos données - sauvegardez-le régulièrement
4. **Réseau** : L'API se connecte à PostgreSQL via le nom du service `postgres` (pas `localhost`)

## 🔒 Sécurité en production

Pour la production, modifiez votre `.env` :

```bash
DATABASE_USERNAME=yuan2_user
DATABASE_PASSWORD=un_mot_de_passe_tres_securise_et_long
```

Et dans `docker-compose.yml`, vous pouvez aussi ajouter :

```yaml
postgres:
  environment:
    - POSTGRES_USER=${DATABASE_USERNAME}
    - POSTGRES_PASSWORD=${DATABASE_PASSWORD}
```

## ✅ Vérification

Pour vérifier que tout fonctionne :

```bash
# Vérifier que tous les services sont en cours d'exécution
docker compose ps

# Vérifier les logs de l'API
docker compose logs api | grep -i database

# Tester la connexion depuis l'API
docker compose exec api rails db:version
```

