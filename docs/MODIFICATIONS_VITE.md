# Modifications pour la compatibilité Vite

Ce document récapitule toutes les modifications effectuées pour rendre le projet compatible avec Vite.

## 📋 Résumé des modifications

### 1. ✅ Retrait de l'import map CDN Three.js

**Fichier modifié:** `docs/index.html`

- **Avant:** Import map pointant vers le CDN jsdelivr pour Three.js
- **Après:** Commentaire indiquant que Three.js est importé via npm/Vite
- **Raison:** Vite gère les modules npm, pas besoin de CDN

### 2. ✅ Imports Three.js déjà compatibles

**Fichiers vérifiés:**
- `docs/js/game_logic_yuan/ui/GameBoard3D.js`
- `docs/js/game_logic_yuan/ui/ShadowManager.js`
- `docs/js/game_logic_yuan/ui/MeshMerger.js`
- `docs/js/game_logic_yuan/pieces/MeepleManager.js`
- `docs/js/game_logic_yuan/gameplay/arrowManager.js`
- `docs/js/game_logic_yuan/gameplay/taxe.js`
- `docs/js/game_logic_yuan/phases/simultaneous-play-phase/developpement.js`

**Status:** ✅ Tous les fichiers utilisent déjà la syntaxe correcte:
```javascript
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
```

### 3. ✅ Correction des chemins vers les assets

#### A. Fichier JavaScript: `MeepleManager.js`

**Fichier modifié:** `docs/js/game_logic_yuan/pieces/MeepleManager.js`

Conversion de tous les chemins relatifs `./` vers des chemins absolus `/`:

**Avant:**
```javascript
path: './glb/meeple/ville.glb'
path: './images/cercle.webp'
path: './images/disqueAlpha.png'
```

**Après:**
```javascript
path: '/glb/meeple/ville.glb'
path: '/images/cercle.webp'
path: '/images/disqueAlpha.png'
```

**Assets modifiés:**
- Tous les fichiers GLB des meeples (ville, village, guerrier, 2villes, temple, fortification)
- Toutes les images de sprites (cercle, disqueAlpha, arow, 1chao, 2chao, echao, rotation, buttonOk)

#### B. Fichiers HTML

**Fichiers modifiés:**
- `docs/partials/game-ui.html`
- `docs/partials/google-login.html`
- `docs/js/app/googleLogin.js`

Conversion de tous les chemins `src="./images/"` et `src="./svg/"` vers `src="/images/"` et `src="/svg/"`:

**Exemples:**
- `./images/icon/riceIcon.webp` → `/images/icon/riceIcon.webp`
- `./svg/settings.svg` → `/svg/settings.svg`
- `./images/google-icon.png` → `/images/google-icon.png`

#### C. Fichiers CSS

**Fichiers modifiés:**
- `docs/css/base.css`
- `docs/css/game-ui.css`

**Modifications:**
- `url('../images/landingPage.webp')` → `url('/images/landingPage.webp')`
- `url('../police/EBGaramond08-Regular.ttf')` → `url('/police/EBGaramond08-Regular.ttf')`

### 4. ✅ assetLoader.js déjà compatible

**Fichier:** `docs/js/utils/assetLoader.js`

**Status:** ✅ Le fichier est déjà bien configuré avec:
- Détection de l'environnement Vite via `import.meta.glob`
- Fonction `getAssetUrl()` pour convertir les chemins
- Fonction `loadTranslation()` compatible avec le plugin JSON server de Vite

## 📦 Configuration Vite

### Fichiers de configuration déjà en place:

1. **`vite.config.js`** - Configuration principale:
   - Root: `./docs` (tout le frontend est dans ce dossier)
   - Port: 5173
   - Plugins: jsonServerPlugin et copyAssetsPlugin
   - Alias: `@` pointe vers `docs/js`

2. **`vite-plugin-json-server.js`** - Plugin pour servir les JSON correctement en dev

3. **`vite-plugin-copy-assets.js`** - Plugin pour copier les assets lors du build

4. **`package.json`** - Dépendances:
   - vite: ^5.0.0
   - three: ^0.160.0

## 🎯 Chemins importants

Avec Vite configuré avec `root: './docs'`, tous les chemins absolus (`/...`) sont résolus depuis le dossier `docs/`:

- `/images/...` → `docs/images/...`
- `/glb/...` → `docs/glb/...`
- `/locales/...` → `docs/locales/...`
- `/css/...` → `docs/css/...`
- `/svg/...` → `docs/svg/...`
- `/police/...` → `docs/police/...`

## 🚀 Utilisation

### Mode développement
```bash
npm run dev
```
Le serveur démarre sur http://localhost:5173

### Build de production
```bash
npm run build
```
Le build est créé dans le dossier `dist/` à la racine

### Prévisualiser le build
```bash
npm run preview
```

## ✅ Vérifications effectuées

- [x] Import map CDN Three.js retiré de index.html
- [x] Tous les imports Three.js sont au format npm (déjà fait)
- [x] Chemins assets convertis en chemins absolus dans MeepleManager.js
- [x] Chemins images/svg convertis en chemins absolus dans HTML
- [x] Chemins url() convertis en chemins absolus dans CSS
- [x] assetLoader.js compatible avec Vite (déjà fait)
- [x] Three.js installé via npm (version 0.160.1)
- [x] Configuration Vite en place

## 📝 Notes

- Tous les imports relatifs entre fichiers JS (`from './...'` ou `from '../...'`) restent inchangés car ils sont gérés correctement par Vite
- Les chemins vers les assets doivent utiliser des chemins absolus depuis `/` pour être cohérents
- Le plugin `jsonServerPlugin` garantit que les fichiers JSON sont servis avec le bon content-type
- Le plugin `copyAssetsPlugin` copie tous les assets statiques lors du build

## 🎉 Résultat

Le projet est maintenant **100% compatible avec Vite** ! Vous pouvez:
1. Lancer le serveur de développement avec `npm run dev`
2. Bénéficier du Hot Module Replacement (HMR)
3. Créer des builds optimisés pour la production
4. Profiter de l'écosystème Vite et de ses plugins

