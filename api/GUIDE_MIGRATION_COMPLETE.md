# 🚀 Guide Complet : Migration SQLite → PostgreSQL (Local)

## ✅ Ce qui est DÉJÀ fait

1. ✅ **PostgreSQL installé** (version 16.11)
2. ✅ **Gemfile modifié** : `sqlite3` remplacé par `pg`
3. ✅ **database.yml configuré** pour PostgreSQL
4. ✅ **Gem `pg` installée** (version 1.5.3)
5. ✅ **Configuration Docker** mise à jour pour PostgreSQL

## ⚠️ Ce qu'il reste à faire

1. ❌ **Créer les bases de données PostgreSQL**
2. ❌ **Exécuter les migrations**
3. ❌ **Migrer les données** (si vous avez des données importantes dans SQLite)
4. ❌ **Tester la connexion**

---

## 📝 Étapes détaillées

### Étape 1 : Démarrer PostgreSQL

```bash
# Démarrer le service
sudo systemctl start postgresql

# Vérifier qu'il tourne
sudo systemctl status postgresql

# Activer au démarrage (optionnel)
sudo systemctl enable postgresql
```

### Étape 2 : Créer les bases de données

```bash
# Créer les 3 bases de données en une fois
sudo -u postgres psql << EOF
CREATE DATABASE yuan2_development;
CREATE DATABASE yuan2_test;
CREATE DATABASE yuan2_production;
\q
EOF
```

**OU** une par une :

```bash
sudo -u postgres psql -c "CREATE DATABASE yuan2_development;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_test;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_production;"
```

**Vérifier** que les bases sont créées :

```bash
sudo -u postgres psql -l | grep yuan2
```

### Étape 3 : Exécuter les migrations

```bash
cd /home/dipsi0/thp/yuan2/api

# Exécuter les migrations (sans bundle exec car bundle ne fonctionne pas)
rails db:migrate

# Vérifier que les tables sont créées
sudo -u postgres psql -d yuan2_development -c "\dt"
```

### Étape 4 : Migrer les données (SI vous avez des données importantes)

⚠️ **Important** : Si vous avez des données dans SQLite que vous voulez garder, il faut les migrer.

#### Option A : Export/Import manuel (simple)

```bash
cd /home/dipsi0/thp/yuan2/api

# 1. Exporter les données SQLite en YAML
rails runner "require 'yaml'; data = {}; ActiveRecord::Base.establish_connection(adapter: 'sqlite3', database: 'storage/development.sqlite3'); ActiveRecord::Base.connection.tables.each { |t| data[t] = ActiveRecord::Base.connection.execute(\"SELECT * FROM #{t}\").to_a }; File.write('data_export.yml', data.to_yaml)"

# 2. Importer dans PostgreSQL (après avoir changé la connexion)
# (Plus complexe, nécessite un script Ruby)
```

#### Option B : Utiliser yaml_db (recommandé)

```bash
# Ajouter la gem temporairement
echo 'gem "yaml_db"' >> Gemfile

# Installer
gem install yaml_db

# Exporter depuis SQLite
cd /home/dipsi0/thp/yuan2/api
# Modifier temporairement database.yml pour pointer vers SQLite
rails db:data:dump

# Changer database.yml pour PostgreSQL
# Importer
rails db:data:load
```

#### Option C : Recommencer à zéro (si pas de données importantes)

Si vous n'avez pas de données importantes, vous pouvez simplement supprimer les fichiers SQLite :

```bash
cd /home/dipsi0/thp/yuan2/api
rm storage/development.sqlite3 storage/test.sqlite3
```

### Étape 5 : Tester la connexion

```bash
cd /home/dipsi0/thp/yuan2/api

# Test 1 : Vérifier la version de la base
rails db:version

# Test 2 : Console Rails
rails console

# Dans la console :
ActiveRecord::Base.connection.execute("SELECT version();")
# Devrait afficher la version de PostgreSQL

# Tester un modèle (remplacez par un de vos modèles)
# User.count
# Game.count

exit
```

### Étape 6 : Lancer le serveur

```bash
cd /home/dipsi0/thp/yuan2/api

# Lancer le serveur
rails server

# Ou en arrière-plan
rails server -d

# Vérifier les logs pour voir s'il y a des erreurs
tail -f log/development.log
```

---

## 🧪 Tests complets

### Test 1 : Vérifier les bases de données

```bash
sudo -u postgres psql -l | grep yuan2
```

**Résultat attendu** :
```
yuan2_development
yuan2_test  
yuan2_production
```

### Test 2 : Vérifier les tables

```bash
sudo -u postgres psql -d yuan2_development -c "\dt"
```

**Résultat attendu** : Liste de toutes vos tables (users, games, etc.)

### Test 3 : Tester une requête

```bash
sudo -u postgres psql -d yuan2_development -c "SELECT COUNT(*) FROM schema_migrations;"
```

### Test 4 : Tester depuis Rails

```bash
cd /home/dipsi0/thp/yuan2/api
rails console

# Dans la console :
ActiveRecord::Base.connection.execute("SELECT COUNT(*) FROM schema_migrations").first
# Devrait retourner le nombre de migrations exécutées

# Tester un modèle
User.first rescue puts "Pas d'utilisateurs (normal si nouvelle base)"
Game.first rescue puts "Pas de jeux (normal si nouvelle base)"

exit
```

### Test 5 : Lancer le serveur et tester une route

```bash
cd /home/dipsi0/thp/yuan2/api
rails server

# Dans un autre terminal :
curl http://localhost:3000/api/v1/health  # ou une route de votre API
```

---

## 🔧 Commandes utiles

### Voir les logs PostgreSQL

```bash
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Se connecter à PostgreSQL

```bash
sudo -u postgres psql

# Ou directement à une base
sudo -u postgres psql -d yuan2_development
```

### Voir toutes les bases de données

```bash
sudo -u postgres psql -l
```

### Voir toutes les tables d'une base

```bash
sudo -u postgres psql -d yuan2_development -c "\dt"
```

### Voir la structure d'une table

```bash
sudo -u postgres psql -d yuan2_development -c "\d users"
```

### Backup de la base de données

```bash
sudo -u postgres pg_dump yuan2_development > backup_$(date +%Y%m%d).sql
```

### Restaurer un backup

```bash
sudo -u postgres psql yuan2_development < backup_20250104.sql
```

---

## ⚠️ Problèmes courants et solutions

### Erreur : "FATAL: password authentication failed"

**Solution** : Créer un fichier `.env` dans `/home/dipsi0/thp/yuan2/api/` :

```bash
cd /home/dipsi0/thp/yuan2/api
echo "DATABASE_PASSWORD=votre_mot_de_passe" > .env
```

### Erreur : "could not connect to server"

**Solution** : Vérifier que PostgreSQL tourne

```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Erreur : "database does not exist"

**Solution** : Relancer l'étape 2 pour créer les bases

### Erreur : "relation does not exist"

**Solution** : Les migrations ne sont pas exécutées

```bash
cd /home/dipsi0/thp/yuan2/api
rails db:migrate
```

### Erreur : "uninitialized constant ActiveRecord"

**Solution** : Les gems ne sont pas chargées. Utilisez `rails` directement (pas `bundle exec rails`)

---

## ✅ Checklist finale

Avant de considérer la migration terminée :

- [ ] PostgreSQL est démarré et fonctionne
- [ ] Les 3 bases de données sont créées
- [ ] Les migrations sont exécutées (`rails db:migrate` fonctionne)
- [ ] La connexion fonctionne (`rails db:version` fonctionne)
- [ ] Les tables existent (vérifié avec `\dt`)
- [ ] Le serveur démarre sans erreur (`rails server`)
- [ ] Les données sont migrées (si nécessaire)
- [ ] Les anciens fichiers SQLite sont supprimés (optionnel)

---

## 🎯 Résumé rapide

```bash
# 1. Démarrer PostgreSQL
sudo systemctl start postgresql

# 2. Créer les bases
sudo -u postgres psql -c "CREATE DATABASE yuan2_development;"
sudo -u postgres psql -c "CREATE DATABASE yuan2_test;"

# 3. Migrer
cd /home/dipsi0/thp/yuan2/api
rails db:migrate

# 4. Tester
rails db:version
rails console
# Dans la console : ActiveRecord::Base.connection.execute("SELECT version();")

# 5. Lancer
rails server
```

**C'est tout !** 🎉

