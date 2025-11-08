# 🚀 Guide de Déploiement Docker - Yuan2 API

Ce guide te permet de déployer ton application Rails avec Docker, même sans expérience préalable.

## 📋 Prérequis

- WSL2 avec Ubuntu (✅ tu l'as déjà)
- Connexion Internet

## 🔧 Étape 1 : Installation de Docker

Exécute ces commandes **dans ton terminal** (elles nécessitent ton mot de passe sudo) :

```bash
# 1. Mettre à jour les paquets
sudo apt-get update

# 2. Installer les dépendances nécessaires
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Ajouter la clé GPG officielle de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 4. Ajouter le dépôt Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Installer Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Ajouter ton utilisateur au groupe Docker (pour ne pas avoir à utiliser sudo)
sudo usermod -aG docker $USER

# 7. Démarrer Docker
sudo service docker start

# 8. IMPORTANT : Ferme et rouvre ton terminal pour appliquer les changements de groupe
```

Après avoir fermé et rouvert ton terminal, vérifie que Docker fonctionne :

```bash
docker --version
docker compose version
```

## ⚙️ Étape 2 : Configuration des Variables d'Environnement

1. **Navigue vers le dossier du projet** :
```bash
cd /home/dipsi0/thp/yuan2
```

2. **Crée ton fichier .env** :
```bash
cp env.template .env
```

3. **Récupère ta RAILS_MASTER_KEY** :
```bash
cat api/config/master.key
```

4. **Génère un SECRET_KEY_BASE** :
```bash
openssl rand -hex 64
```

5. **Édite le fichier .env** :
```bash
nano .env
```

Remplis les valeurs :
- `RAILS_MASTER_KEY` : colle la valeur de `api/config/master.key`
- `SECRET_KEY_BASE` : colle la valeur générée par openssl
- `GOOGLE_CLIENT_ID` : ton ID client Google OAuth (si tu l'utilises)

Sauvegarde avec `Ctrl+O`, puis `Entrée`, puis quitte avec `Ctrl+X`.

## 🏗️ Étape 3 : Construction de l'Image Docker

```bash
# Construction de l'image de l'API
docker compose build api
```

Cette étape peut prendre plusieurs minutes la première fois (téléchargement de l'image Ruby, installation des gems, etc.).

## 🚀 Étape 4 : Démarrage des Services

```bash
# Démarrer tous les services (API + Redis)
docker compose up -d
```

L'option `-d` lance les containers en arrière-plan (detached mode).

## 🔍 Étape 5 : Vérification

**Vérifier que les containers sont en cours d'exécution** :
```bash
docker compose ps
```

Tu devrais voir 2 services : `api` et `redis`, tous les deux avec le status "Up".

**Voir les logs de l'API** :
```bash
docker compose logs -f api
```

Appuie sur `Ctrl+C` pour sortir des logs.

**Tester l'API** :
```bash
curl http://localhost:3000/up
```

Si tout fonctionne, tu devrais recevoir une réponse positive.

## 📝 Commandes Utiles

### Gestion des containers

```bash
# Arrêter tous les services
docker compose down

# Redémarrer tous les services
docker compose restart

# Voir les logs
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f api
docker compose logs -f redis

# Reconstruire et redémarrer après un changement de code
docker compose up -d --build
```

### Accès au container

```bash
# Ouvrir un shell dans le container de l'API
docker compose exec api bash

# Exécuter une commande Rails
docker compose exec api rails console
docker compose exec api rails db:migrate
docker compose exec api rails db:seed
```

### Nettoyage

```bash
# Arrêter et supprimer les containers, réseaux
docker compose down

# Supprimer également les volumes (⚠️ ATTENTION : efface la base de données)
docker compose down -v

# Nettoyer les images Docker inutilisées
docker system prune -a
```

## 🔧 Résolution de Problèmes

### Le container API ne démarre pas

1. Vérifie les logs :
```bash
docker compose logs api
```

2. Vérifie que le fichier `.env` est correctement rempli :
```bash
cat .env
```

### ⚠️ Problèmes connus résolus

**Erreur "uninitialized constant Sidekiq"** : 
- ✅ **Résolu** : Le fichier `app/jobs/broadcast_retry_job.rb` a été supprimé
- L'application utilise `BroadcastRetryWorker` à la place (pas besoin de Sidekiq)

**Redirection HTTPS (301)** :
- ✅ **Résolu** : `config.force_ssl` désactivé dans `config/environments/production.rb`
- Pour un vrai déploiement en production, réactiver SSL avec un certificat Let's Encrypt + Nginx

### Erreur "Cannot connect to Redis"

1. Vérifie que Redis est en cours d'exécution :
```bash
docker compose ps redis
```

2. Redémarre Redis :
```bash
docker compose restart redis
```

### Port 3000 déjà utilisé

Si le port 3000 est déjà utilisé, modifie le `docker-compose.yml` :
```yaml
api:
  ports:
    - "3001:3000"  # Utilise le port 3001 au lieu de 3000
```

### Rebuild complet

Si quelque chose ne fonctionne vraiment pas :
```bash
# Tout arrêter et supprimer
docker compose down -v

# ou juste arreter, plus propre
docker compose down

# Nettoyer les images
docker system prune -a

# Reconstruire et relancer
docker compose build --no-cache
docker compose up -d

# sans le --no-cache pour aller plus  vite
```


## 🎯 Prochaines Étapes

Une fois que tout fonctionne localement avec Docker :

1. **Backup** : Configure des sauvegardes régulières de ton volume de base de données
2. **Monitoring** : Ajoute des outils de monitoring (Prometheus, Grafana)
3. **CI/CD** : Configure un pipeline de déploiement automatique
4. **Production** : Déploie sur un serveur (DigitalOcean, AWS, Heroku, etc.)
5. **HTTPS** : Configure un reverse proxy (Nginx) avec Let's Encrypt

## 📚 Ressources Utiles

- [Documentation Docker](https://docs.docker.com/)
- [Documentation Docker Compose](https://docs.docker.com/compose/)
- [Documentation Rails avec Docker](https://guides.rubyonrails.org/docker.html)

## 🆘 Besoin d'Aide ?

Si tu rencontres un problème :
1. Vérifie les logs : `docker compose logs -f`
2. Vérifie le statut : `docker compose ps`
3. Consulte la section "Résolution de Problèmes" ci-dessus



