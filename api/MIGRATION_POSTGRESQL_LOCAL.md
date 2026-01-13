# Migration PostgreSQL - Guide Local

## ✅ État actuel

- ✅ PostgreSQL installé (version 16.11)
- ✅ `Gemfile` configuré pour utiliser `pg` au lieu de `sqlite3`
- ✅ `database.yml` configuré pour PostgreSQL
- ✅ Gem `pg` installée (version 1.5.3)

## 📋 Étapes à suivre

### Étape 1 : Démarrer PostgreSQL

```bash
# Démarrer le service PostgreSQL
sudo systemctl start postgresql

# Vérifier qu'il tourne
sudo systemctl status postgresql
```

### Étape 2 : Créer les bases de données

```bash
cd /home/dipsi0/thp/yuan2/api

# Se connecter à PostgreSQL en tant qu'utilisateur postgres
sudo -u postgres psql

# Dans le prompt PostgreSQL, créer les bases de données :
CREATE DATABASE yuan2_development;
CREATE DATABASE yuan2_test;
CREATE DATABASE yuan2_production;

# Quitter
\q
```

**OU** en une seule commande :

```bash
sudo -u postgres psql -c "CREATE DATABASE yuan2_development;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_test;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_production;"
```

### Étape 3 : Vérifier la connexion

```bash
cd /home/dipsi0/thp/yuan2/api

# Tester la connexion (sans bundle exec car bundle ne fonctionne pas)
rails db:version
```

Si ça fonctionne, vous verrez la version de la base de données ou un message indiquant qu'il n'y a pas encore de migrations.

### Étape 4 : Exécuter les migrations

```bash
cd /home/dipsi0/thp/yuan2/api

# Exécuter les migrations
rails db:migrate

# Si vous avez des seeds, les charger
rails db:seed
```

### Étape 5 : Tester que tout fonctionne

```bash
cd /home/dipsi0/thp/yuan2/api

# Lancer la console Rails
rails console

# Dans la console, tester la connexion :
ActiveRecord::Base.connection.execute("SELECT version();")
# Devrait afficher la version de PostgreSQL

# Tester un modèle (remplacez par un de vos modèles)
# User.count  # ou Game.count, etc.

# Quitter
exit
```

### Étape 6 : Lancer le serveur

```bash
cd /home/dipsi0/thp/yuan2/api

# Lancer le serveur Rails
rails server

# Ou en arrière-plan
rails server -d
```

## 🔍 Vérifications

### Vérifier que les bases de données existent

```bash
sudo -u postgres psql -l | grep yuan2
```

Vous devriez voir :
```
yuan2_development
yuan2_test
yuan2_production
```

### Vérifier les tables créées

```bash
sudo -u postgres psql -d yuan2_development -c "\dt"
```

### Voir les données (exemple avec la table users si elle existe)

```bash
sudo -u postgres psql -d yuan2_development -c "SELECT * FROM users LIMIT 5;"
```

## ⚠️ Problèmes possibles

### Erreur : "FATAL: password authentication failed"

Si vous avez un mot de passe pour l'utilisateur postgres, vous devez le configurer dans votre `.env` :

```bash
cd /home/dipsi0/thp/yuan2/api

# Créer/modifier .env
echo "DATABASE_PASSWORD=votre_mot_de_passe" >> .env
```

### Erreur : "could not connect to server"

Vérifiez que PostgreSQL tourne :

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Erreur : "database does not exist"

Relancez l'étape 2 pour créer les bases de données.

## 🎯 Résumé des commandes essentielles

```bash
# 1. Démarrer PostgreSQL
sudo systemctl start postgresql

# 2. Créer les bases de données
sudo -u postgres psql -c "CREATE DATABASE yuan2_development;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_test;"

# 3. Migrer
cd /home/dipsi0/thp/yuan2/api
rails db:migrate

# 4. Tester
rails console
# Puis dans la console : ActiveRecord::Base.connection.execute("SELECT version();")

# 5. Lancer le serveur
rails server
```

## ✅ Checklist

- [ ] PostgreSQL est démarré
- [ ] Les 3 bases de données sont créées (development, test, production)
- [ ] Les migrations sont exécutées (`rails db:migrate`)
- [ ] La connexion fonctionne (`rails db:version`)
- [ ] Le serveur démarre sans erreur (`rails server`)

