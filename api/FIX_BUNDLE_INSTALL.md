# Solution au problème de bundle install qui bloque

## Diagnostic

Le problème : `bundle install` se bloque lors de la résolution des dépendances, probablement à cause d'un problème de réseau ou de timeout avec l'index de rubygems.org.

## Solutions à essayer (dans l'ordre)

### Solution 1 : Utiliser un miroir de rubygems (recommandé)

```bash
cd /home/dipsi0/thp/yuan2/api

# Utiliser le miroir chinois (plus rapide parfois)
bundle config set mirror.https://rubygems.org https://gems.ruby-china.com

# Ou utiliser le CDN Cloudflare
bundle config set mirror.https://rubygems.org https://rubygems.global.ssl.fastly.net

# Puis réessayer
bundle install
```

### Solution 2 : Augmenter les timeouts

```bash
cd /home/dipsi0/thp/yuan2/api

bundle config set --local timeout 300
bundle config set --local retry 5

bundle install
```

### Solution 3 : Installer les gems une par une puis bundle install --local

```bash
cd /home/dipsi0/thp/yuan2/api

# Installer les gems principales manuellement
gem install rails -v "7.2.2" --no-document
gem install pg --no-document
gem install puma --no-document
gem install redis --no-document
gem install bcrypt -v "3.1.7" --no-document
gem install jwt --no-document
gem install bootsnap --no-document
gem install rack-cors --no-document
gem install google-id-token --no-document
gem install dotenv-rails --no-document

# Puis essayer bundle install --local
bundle install --local
```

### Solution 4 : Utiliser bundle install avec --full-index (plus lent mais plus fiable)

```bash
cd /home/dipsi0/thp/yuan2/api
bundle install --full-index
```

### Solution 5 : Nettoyer et réessayer

```bash
cd /home/dipsi0/thp/yuan2/api

# Nettoyer le cache
rm -rf ~/.bundle/cache
rm -rf vendor/bundle
bundle clean --force

# Réessayer
bundle install
```

### Solution 6 : Vérifier la connexion réseau

```bash
# Tester la connexion à rubygems
curl -I https://rubygems.org
curl -I https://index.rubygems.org/versions

# Si ça bloque, il y a un problème de réseau/firewall
```

## Solution recommandée pour commencer

Essayez d'abord la Solution 1 (miroir) ou la Solution 2 (timeouts), puis la Solution 3 si ça ne marche toujours pas.

