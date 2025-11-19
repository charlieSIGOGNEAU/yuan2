# 🚀 Workflow de Développement et Déploiement

## 📋 Développement au quotidien

### 1. Démarrer le serveur de développement

```bash
cd /home/dipsi0/thp/yuan2
npm run dev
```

- Ouvre automatiquement http://localhost:5173
- Hot Module Replacement (HMR) activé
- Modifications visibles instantanément

### 2. Développer normalement

- Modifiez vos fichiers dans `docs/`
- Les changements apparaissent automatiquement dans le navigateur
- ⚠️ Utilisez **toujours des chemins absolus** pour les assets : `/images/`, `/css/`, `/partials/`, etc.

### 3. Arrêter le serveur dev

```bash
Ctrl+C
```

---

## 🧪 Tester avant déploiement

### 1. Arrêter le serveur dev (si actif)

```bash
# Dans le terminal où tourne npm run dev
Ctrl+C

# OU forcer l'arrêt
pkill -f "vite dev"
```

### 2. Créer le build de production

```bash
cd /home/dipsi0/thp/yuan2
npm run build
```

**Vérifiez qu'il n'y a pas d'erreurs !**

### 3. Tester le build localement

```bash
npm run preview
```

- Ouvre http://localhost:4173
- ⚠️ **Pas 5173, mais bien 4173 !**

### 4. Tests à effectuer

- [ ] Page d'accueil s'affiche
- [ ] Connexion fonctionne
- [ ] Traductions fonctionnent
- [ ] Créer/rejoindre une partie fonctionne
- [ ] Interface de jeu s'affiche avec CSS
- [ ] Modèles 3D se chargent
- [ ] Pas d'erreurs 404 dans la console (F12)
- [ ] Session persiste après F5

### 5. Arrêter le serveur preview

```bash
Ctrl+C
```

---

## 🌐 Déploiement sur serveur de production

### Option A : Déploiement manuel (SCP/RSYNC)

#### 1. Créer le build

```bash
cd /home/dipsi0/thp/yuan2
npm run build
```

#### 2. Copier sur le serveur

**Avec SCP:**
```bash
scp -r dist/* user@votre-serveur.com:/var/www/yuan-game/
```

**Avec RSYNC (recommandé):**
```bash
rsync -avz --delete dist/ user@votre-serveur.com:/var/www/yuan-game/
```

**Explication des options rsync:**
- `-a` : mode archive (préserve permissions, etc.)
- `-v` : verbose (affiche les fichiers copiés)
- `-z` : compression pendant le transfert
- `--delete` : supprime les fichiers qui n'existent plus dans dist/

#### 3. Redémarrer le serveur web (si nécessaire)

```bash
ssh user@votre-serveur.com
sudo systemctl reload nginx
# OU
sudo systemctl reload apache2
```

### Option B : Déploiement automatisé (Script)

Créez un script `deploy.sh` :

```bash
#!/bin/bash
# deploy.sh

echo "🏗️  Building..."
npm run build || exit 1

echo "📦 Deploying to server..."
rsync -avz --delete dist/ user@serveur:/var/www/yuan-game/

echo "🔄 Reloading server..."
ssh user@serveur "sudo systemctl reload nginx"

echo "✅ Deployment complete!"
```

**Utilisation:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 📝 Checklist complète de déploiement

### Avant de déployer

- [ ] Toutes les modifications sont testées en dev (5173)
- [ ] Pas d'erreurs dans la console
- [ ] Code commité dans git (optionnel mais recommandé)

### Build et test

- [ ] `pkill -f "vite"` pour arrêter tous les serveurs
- [ ] `npm run build` sans erreurs
- [ ] `npm run preview` pour tester
- [ ] Test sur http://localhost:4173
- [ ] Vérifier la console (F12) : pas d'erreurs 404
- [ ] Tester toutes les fonctionnalités critiques

### Déploiement

- [ ] Copier `dist/` vers le serveur
- [ ] Vérifier que les permissions sont correctes sur le serveur
- [ ] Tester sur l'URL de production
- [ ] Vider le cache du navigateur (Ctrl+Shift+R)

---

## ⚠️ Pièges à éviter

### ❌ Ne jamais faire :

1. **Déployer sans tester le build preview**
   - Le dev (5173) ≠ prod (4173)
   - Toujours tester avec `npm run preview`

2. **Oublier d'arrêter le serveur dev avant le preview**
   - Vous pourriez tester le mauvais serveur
   - Utilisez `pkill -f "vite"` pour tout arrêter

3. **Utiliser des chemins relatifs pour les assets**
   - ❌ `./images/`, `./css/`, `./partials/`
   - ✅ `/images/`, `/css/`, `/partials/`

4. **Oublier de rebuild après des modifications**
   - Le build n'est pas automatique
   - Toujours faire `npm run build` après modifications

5. **Tester sur 5173 au lieu de 4173**
   - 5173 = dev (sources)
   - 4173 = preview (build)

### ✅ Bonnes pratiques :

1. **Vérifier le port avant de tester**
   ```bash
   lsof -i :5173 -i :4173 | grep LISTEN
   ```

2. **Nettoyer avant de builder**
   ```bash
   rm -rf dist/
   npm run build
   ```

3. **Vider le cache du navigateur**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

4. **Vérifier les logs du build**
   - Chercher les warnings
   - Vérifier que tous les assets sont copiés

---

## 🔧 Commandes utiles

### Vérifier quels serveurs tournent
```bash
lsof -i :5173 -i :4173 | grep LISTEN
```

### Arrêter tous les serveurs Vite
```bash
pkill -f "vite"
```

### Voir la taille du build
```bash
du -sh dist/
ls -lh dist/assets/
```

### Tester un fichier spécifique en prod
```bash
curl -I http://localhost:4173/css/game-ui.css
curl -I http://localhost:4173/partials/game-ui.html
```

### Nettoyer complètement
```bash
rm -rf dist/ node_modules/
npm install
npm run build
```

---

## 📊 Résumé des ports

| Port | Mode | Commande | Utilisation |
|------|------|----------|-------------|
| **5173** | Dev | `npm run dev` | Développement quotidien |
| **4173** | Preview | `npm run preview` | Test du build avant déploiement |

---

## 🎯 Workflow type complet

### Développement d'une nouvelle feature

```bash
# 1. Démarrer le dev
npm run dev

# 2. Développer (le navigateur se rafraîchit automatiquement)

# 3. Tester en dev
# Ouvrir http://localhost:5173

# 4. Arrêter le dev
Ctrl+C

# 5. Tester le build
pkill -f "vite"              # S'assurer que tout est arrêté
npm run build                # Créer le build
npm run preview              # Tester le build

# 6. Ouvrir http://localhost:4173 et tester

# 7. Si OK, déployer
rsync -avz --delete dist/ user@serveur:/var/www/yuan-game/

# 8. Vérifier en production
```

---

## 💡 Astuces

### Développement rapide
Si vous ne changez que du JavaScript/HTML (pas de CSS externe) :
```bash
npm run dev
# Développez, testez, c'est tout !
```

### Test critique avant déploiement important
```bash
pkill -f "vite"
rm -rf dist/
npm run build
npm run preview
# Testez TOUT
```

### Déploiement rapide (une fois testé)
```bash
npm run build && rsync -avz dist/ user@serveur:/path/
```

---

## 📱 Configuration serveur (rappel)

### Nginx (recommandé)
```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    root /var/www/yuan-game;
    index index.html;
    
    # SPA routing - important !
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache pour les assets avec hash
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache
```apache
<Directory /var/www/yuan-game>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</Directory>
```

---

## ✅ Vous êtes prêt !

Suivez ce guide à chaque mise à jour et tout se passera bien ! 🚀

