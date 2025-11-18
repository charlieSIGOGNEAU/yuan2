# 🚀 Guide de démarrage rapide avec Vite

## ✅ Installation terminée !

Vite et Three.js ont été installés avec succès.

## 📝 Commandes principales

### Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:5173**

Ouvrez votre navigateur et allez sur cette adresse.

### Arrêter le serveur

Appuyez sur `Ctrl + C` dans le terminal.

### Créer un build de production

```bash
npm run build
```

Le build est créé dans le dossier `dist/` à la racine.

## 🔄 Changements effectués

### 1. Fichiers créés
- ✅ `package.json` : Gestion des dépendances
- ✅ `vite.config.js` : Configuration de Vite
- ✅ `.gitignore` : Fichiers à ignorer
- ✅ `docs/VITE_SETUP.md` : Documentation complète

### 2. Fichiers modifiés
- ✅ `docs/index.html` : Suppression de l'import map (Three.js via npm maintenant), chemins absolus pour images
- ✅ `docs/js/simple.js` : Adaptation de `loadCSS()` et `loadPartial()` pour Vite
- ✅ `docs/js/utils/assetLoader.js` : Gestion des chemins d'assets compatibles Vite
- ✅ Tous les fichiers JS utilisant des assets : Utilisation de `getAssetUrl()`

### 3. Plugins Vite créés
- ✅ `vite-plugin-json-server.js` : Sert les fichiers JSON de traduction en dev
- ✅ `vite-plugin-copy-assets.js` : Copie les assets statiques lors du build

### 4. Structure
```
yuan2/
├── docs/              ← Tout votre frontend (root de Vite)
│   ├── index.html
│   ├── js/
│   ├── css/
│   ├── images/
│   ├── glb/
│   └── locales/
├── package.json       ← Nouveau
├── vite.config.js     ← Nouveau
├── node_modules/      ← Généré par npm install
└── dist/              ← Généré par npm run build
```

## 🎯 Utilisation

### Mode développement (recommandé)

1. Ouvrir un terminal à la racine du projet (`/home/dipsi0/thp/yuan2`)
2. Exécuter : `npm run dev`
3. Ouvrir le navigateur sur `http://localhost:5173`

**Avantages** :
- ✅ Rechargement automatique lors des modifications
- ✅ Erreurs affichées directement dans le navigateur
- ✅ Plus rapide que de servir les fichiers statiques

### Mode production

1. Exécuter : `npm run build`
2. Le dossier `dist/` contient tous les fichiers optimisés
3. Servir le dossier `dist/` avec votre serveur web

## ⚠️ Important

### Avant Vite
Vous serviez probablement les fichiers depuis `/docs` directement.

### Avec Vite
- **Développement** : Utilisez `npm run dev` (ne servez plus `/docs` directement)
- **Production** : Utilisez `npm run build` et servez le dossier `dist/`

## 🐛 Problèmes courants

### "Port 5173 already in use"
Le port est déjà utilisé. Modifiez le port dans `vite.config.js` :
```javascript
server: {
    port: 5174, // Changez le numéro
}
```

### "Cannot find module 'three'"
Exécutez à nouveau :
```bash
npm install
```

### Les assets ne se chargent pas
Vérifiez que les chemins utilisent `getAssetUrl()` (déjà fait dans le code).

## 📚 Documentation complète

Pour plus de détails, consultez `docs/VITE_SETUP.md`

## ✨ C'est tout !

Votre projet est maintenant configuré avec Vite. Lancez `npm run dev` et commencez à développer !

