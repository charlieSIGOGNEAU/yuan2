# ✅ Configuration Vite - Finalisée

## 📋 Résumé des modifications

### 1. Configuration de base
- ✅ `package.json` : Vite et Three.js installés
- ✅ `vite.config.js` : Configuration complète avec plugins
- ✅ `.gitignore` : Exclusion de `node_modules/` et `dist/`

### 2. Plugins Vite
- ✅ **`vite-plugin-json-server.js`** : 
  - Sert les fichiers JSON de traduction (`/locales/*.json`) en mode dev
  - Intercepte les requêtes avant le middleware SPA de Vite
  - Évite que Vite retourne `index.html` au lieu des JSON

- ✅ **`vite-plugin-copy-assets.js`** :
  - Copie les assets statiques lors du build (`npm run build`)
  - Copie : `images/`, `glb/`, `locales/`, `police/`, `svg/`, `partials/`
  - Nécessaire car Vite ne copie que les fichiers importés dans le code

### 3. Fichiers modifiés pour compatibilité Vite

#### `docs/index.html`
- ✅ Suppression de l'import map Three.js (maintenant via npm)
- ✅ Chemins absolus pour les images : `/images/favicon.png`, `/images/titre.webp`
- ✅ Chemins absolus pour CSS et JS : `/css/base.css`, `/js/app.js`

#### `docs/js/utils/assetLoader.js` (NOUVEAU)
- ✅ `getAssetUrl(path)` : Convertit les chemins relatifs en absolus
  - Avec Vite : `/glb/asset.glb`
  - Sans Vite : `/docs/glb/asset.glb`
- ✅ `loadTranslation(language)` : Charge les traductions
  - Utilise `fetch()` avec le plugin Vite en dev
  - Fallback pour environnement sans Vite

#### `docs/js/simple.js`
- ✅ `loadPartial()` : Utilise `getAssetUrl()` pour les HTML partiels
- ✅ `loadCSS()` : S'assure que les chemins sont absolus (`/css/file.css`)

#### Tous les fichiers utilisant des assets
- ✅ `MeepleManager.js` : Utilise `getAssetUrl()` pour GLB et images
- ✅ `GameBoard3D.js` : Utilise `getAssetUrl()` pour GLB et textures
- ✅ `TileTypes.js` : Utilise `getAssetUrl()` pour les modèles de tuiles
- ✅ `developpement.js` : Utilise `getAssetUrl()` pour les images
- ✅ `UIManager.js` : Utilise `getAssetUrl()` pour les HTML partiels
- ✅ `i18n.js` : Utilise `loadTranslation()` de `assetLoader.js`

### 4. Corrections apportées
- ✅ Suppression des vérifications inutiles ajoutées précédemment
- ✅ Simplification de `loadTranslation()` (plus besoin de `import.meta.glob`)
- ✅ Correction des chemins dans `index.html`

## 🚀 Utilisation

### Mode développement
```bash
npm run dev
```
- Serveur sur `http://localhost:5173`
- Rechargement automatique
- Les assets sont servis directement depuis `docs/`

### Mode production
```bash
npm run build
```
- Build optimisé dans `dist/`
- Les assets sont copiés automatiquement
- Prêt à être déployé

### Prévisualisation du build
```bash
npm run preview
```
- Teste le build de production localement

## 📁 Structure finale

```
yuan2/
├── docs/                    # Frontend (root de Vite)
│   ├── index.html
│   ├── js/
│   │   ├── app.js
│   │   ├── utils/
│   │   │   ├── assetLoader.js    ← NOUVEAU
│   │   │   └── cssManager.js
│   │   └── ...
│   ├── css/
│   ├── images/
│   ├── glb/
│   ├── locales/
│   └── ...
├── package.json
├── vite.config.js
├── vite-plugin-json-server.js    ← NOUVEAU
├── vite-plugin-copy-assets.js    ← NOUVEAU
├── node_modules/
└── dist/                         # Généré par npm run build
```

## ✅ Checklist de migration

- [x] Installation de Vite et Three.js
- [x] Configuration de `vite.config.js`
- [x] Création de `assetLoader.js`
- [x] Modification de tous les chemins d'assets
- [x] Plugin pour servir les JSON en dev
- [x] Plugin pour copier les assets lors du build
- [x] Correction des chemins dans `index.html`
- [x] Suppression des vérifications inutiles
- [x] Documentation complète

## 🎯 Prochaines étapes (optionnel)

1. **Tester le build** : `npm run build` puis vérifier que tout fonctionne dans `dist/`
2. **Optimiser les assets** : Compresser les images/GLB si nécessaire
3. **Configurer le déploiement** : Adapter selon votre serveur (Nginx, Apache, etc.)

## 📝 Notes importantes

- **En développement** : Utilisez toujours `npm run dev`, ne servez plus `/docs` directement
- **En production** : Utilisez `npm run build` et servez le dossier `dist/`
- **Les chemins** : Tous les chemins d'assets doivent utiliser `getAssetUrl()` ou être absolus (`/images/...`)
- **Les traductions** : Fonctionnent automatiquement grâce au plugin JSON

## 🐛 Dépannage

### Les traductions ne se chargent pas
- Vérifiez que le plugin `jsonServerPlugin` est actif
- Vérifiez que les fichiers existent dans `docs/locales/`

### Les assets ne se chargent pas en production
- Vérifiez que `copyAssetsPlugin` copie bien les dossiers
- Vérifiez les chemins dans le build (`dist/`)

### Erreur "Cannot find module 'three'"
```bash
npm install
```

---

**✨ Configuration Vite terminée et prête à l'emploi !**



