# Guide de migration SQLite → PostgreSQL

## Étape 1 : Installer PostgreSQL

Exécutez ces commandes dans votre terminal :

```bash
# Mettre à jour la liste des paquets
sudo apt update

# Installer PostgreSQL et ses outils
sudo apt install postgresql postgresql-contrib

# Démarrer le service PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## Étape 2 : Créer un utilisateur PostgreSQL (optionnel mais recommandé)

Par défaut, PostgreSQL crée un utilisateur `postgres`. Vous pouvez l'utiliser ou créer un utilisateur spécifique :

```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Dans le prompt PostgreSQL, créer un utilisateur (remplacez 'votre_nom' par votre nom d'utilisateur Linux)
CREATE USER votre_nom WITH PASSWORD 'votre_mot_de_passe';
ALTER USER votre_nom CREATEDB;

# Quitter
\q
```

## Étape 3 : Installer les gems Ruby

```bash
cd /home/dipsi0/thp/yuan2/api
bundle install
```

## Étape 4 : Créer les bases de données

```bash
cd /home/dipsi0/thp/yuan2/api
rails db:create
```

## Étape 5 : Exécuter les migrations

```bash
rails db:migrate
```

## Étape 6 : (Optionnel) Migrer les données existantes

Si vous avez des données dans SQLite que vous voulez migrer, vous pouvez utiliser un outil comme `yaml_db` ou faire une export/import manuel.

## Configuration des variables d'environnement (optionnel)

Si vous avez créé un utilisateur PostgreSQL personnalisé, vous pouvez ajouter ces variables dans votre fichier `.env` :

```
DATABASE_USERNAME=votre_nom
DATABASE_PASSWORD=votre_mot_de_passe
DATABASE_HOST=localhost
```

## Vérification

Pour vérifier que tout fonctionne :

```bash
rails db:version
rails console
# Dans la console : ActiveRecord::Base.connection.execute("SELECT version();")
```



