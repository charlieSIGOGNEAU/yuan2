# 🔧 Solution au problème bundle install dans Docker

## ⚠️ Problème

`bundle install` se bloque lors de la construction de l'image Docker, exactement comme en local.

## ✅ Solution : Dockerfile alternatif

J'ai créé `Dockerfile.dev.alternative` qui **installe les gems directement** sans passer par `bundle install`.

### Avantages

- ✅ Évite complètement le problème de `bundle install`
- ✅ Installation plus rapide
- ✅ Fonctionne même si bundle bloque

### Inconvénients

- ⚠️ Les versions des gems ne sont pas verrouillées par un Gemfile.lock
- ⚠️ Il faut mettre à jour le Dockerfile si vous ajoutez des gems

## 🚀 Utilisation

Le `docker-compose.dev.yml` est déjà configuré pour utiliser `Dockerfile.dev.alternative`.

### Construire l'image

```bash
cd /home/dipsi0/thp/yuan2

# Construire avec le Dockerfile alternatif
docker compose -f docker-compose.dev.yml build

# Si ça bloque toujours, arrêtez avec Ctrl+C et essayez :
docker compose -f docker-compose.dev.yml build --no-cache
```

### Lancer

```bash
docker compose -f docker-compose.dev.yml up -d
```

## 🔄 Si vous ajoutez une nouvelle gem

Si vous ajoutez une gem dans le `Gemfile`, vous devez aussi l'ajouter dans `Dockerfile.dev.alternative` :

```dockerfile
# Dans Dockerfile.dev.alternative, ajoutez :
RUN gem install votre_nouvelle_gem --no-document && \
```

Puis reconstruisez :

```bash
docker compose -f docker-compose.dev.yml build api
docker compose -f docker-compose.dev.yml up -d
```

## 🆚 Comparaison des Dockerfiles

| Aspect | Dockerfile.dev | Dockerfile.dev.alternative |
|--------|----------------|---------------------------|
| **Méthode** | `bundle install` | Installation directe des gems |
| **Blocage** | ❌ Peut bloquer | ✅ Ne bloque pas |
| **Gemfile.lock** | ✅ Utilisé | ❌ Ignoré |
| **Maintenance** | ✅ Automatique | ⚠️ Manuelle (ajouter gems) |

## 🎯 Recommandation

Pour l'instant, utilisez `Dockerfile.dev.alternative` pour éviter le blocage. Une fois que vous aurez résolu le problème de `bundle install` (peut-être avec un meilleur réseau ou un VPN), vous pourrez revenir à `Dockerfile.dev`.

## 🔍 Vérification

Après la construction, vérifiez que les gems sont installées :

```bash
docker compose -f docker-compose.dev.yml exec api gem list | grep -E "(rails|pg|puma)"
```

Vous devriez voir :
```
pg (1.5.3)
puma (7.1.0)
rails (7.2.2)
```

