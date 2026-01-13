# Solution alternative : Utiliser les gems installées sans bundle

## Situation actuelle

- ✅ Toutes les gems principales sont installées (rails, pg, puma, etc.)
- ❌ `bundle install` se bloque lors de la résolution des dépendances
- ❌ Impossible de créer le Gemfile.lock

## Solution : Contourner bundle temporairement

Puisque toutes les gems sont installées, vous pouvez utiliser Rails directement sans bundle :

### 1. Créer les bases de données PostgreSQL

```bash
cd /home/dipsi0/thp/yuan2/api

# Démarrer PostgreSQL (si pas déjà fait)
sudo systemctl start postgresql

# Créer les bases de données manuellement
sudo -u postgres psql << EOF
CREATE DATABASE yuan2_development;
CREATE DATABASE yuan2_test;
CREATE DATABASE yuan2_production;
\q
EOF
```

### 2. Exécuter les migrations

```bash
cd /home/dipsi0/thp/yuan2/api

# Utiliser rails directement (sans bundle exec)
rails db:migrate
```

### 3. Pour lancer le serveur

```bash
# Au lieu de: bundle exec rails server
rails server
```

## Solutions pour résoudre le problème bundle

### Option A : Vérifier la connexion réseau

Le problème pourrait venir d'un firewall ou d'un proxy :

```bash
# Tester la connexion
curl -v https://rubygems.org
curl -v https://index.rubygems.org/versions

# Si ça bloque, il y a un problème réseau
```

### Option B : Utiliser un VPN ou changer de réseau

Si vous êtes derrière un firewall d'entreprise, essayez un autre réseau.

### Option C : Installer bundler dans une version différente

```bash
gem install bundler -v 2.5.0
bundle _2.5.0_ install
```

### Option D : Utiliser Docker

Si bundle ne fonctionne pas localement, utilisez Docker (vous avez déjà un Dockerfile) :

```bash
cd /home/dipsi0/thp/yuan2
docker compose build
docker compose up
```

## Pour l'instant : Continuer sans bundle

Vous pouvez continuer à développer en utilisant les gems installées directement. Bundle est surtout utile pour :
- Gérer les versions exactes des gems
- Déployer en production
- Travailler en équipe

Pour le développement local, vous pouvez utiliser les gems installées directement.

