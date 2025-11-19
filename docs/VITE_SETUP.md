# Guide d'installation et d'utilisation de Vite

## 🚀 Installation

### 1. Installer Node.js (si pas déjà installé)

Vite nécessite Node.js version 18 ou supérieure.

Vérifier l'installation :
```bash
node --version
npm --version
```

Si Node.js n'est pas installé, téléchargez-le depuis [nodejs.org](https://nodejs.org/)

### 2. Installer les dépendances

À la racine du projet (pas dans `/docs`), exécutez :

```bash
npm install
```

Cela va installer :
- **Vite** : Outil de build et serveur de développement
- **Three.js** : Bibliothèque 3D (remplace le CDN)

## 📝 Utilisation

### Mode développement

Lancer le serveur de développement :

```bash
npm run dev
```

Le serveur démarre sur `http://localhost:5173`

**Avantages** :
- Rechargement automatique lors des modifications
- Erreurs affichées directement dans le navigateur
- Hot Module Replacement (HMR) pour un rechargement instantané

### Build de production

Créer une version optimisée pour la production :

```bash
npm run build
```

Le build est créé dans le dossier `dist/` à la racine du projet.

### Prévisualiser le build

Tester le build de production localement :

```bash
npm run preview
```

## 🔧 Configuration

### Fichiers de configuration

- **`package.json`** : Dépendances et scripts npm
- **`vite.config.js`** : Configuration de Vite
- **`.gitignore`** : Fichiers à ignorer par Git

### Structure

```
yuan2/
├── docs/              # Tout le frontend (root de Vite)
│   ├── index.html
│   ├── js/
│   ├── css/
│   ├── images/
│   ├── glb/
│   └── locales/
├── package.json
├── vite.config.js
└── dist/              # Build de production (généré)
```

## ⚠️ Changements importants

### 1. Three.js via npm

Three.js est maintenant installé via npm au lieu du CDN. L'import map dans `index.html` n'est plus nécessaire.

### 2. Chemins des assets

Les chemins des assets sont gérés automatiquement par Vite via `getAssetUrl()` (déjà implémenté).

### 3. Variables d'environnement

Si vous avez besoin de variables d'environnement, créez un fichier `.env` à la racine :

```env
VITE_API_BASE_URL=http://localhost:3001/api/v1/
VITE_WS_URL=ws://localhost:3001/cable
```

Utilisez-les dans le code avec `import.meta.env.VITE_API_BASE_URL`

## 🐛 Dépannage

### Erreur "Cannot find module"

Si vous avez des erreurs de module non trouvé :
1. Vérifiez que `npm install` a bien été exécuté
2. Vérifiez que vous êtes à la racine du projet (pas dans `/docs`)

### Le serveur ne démarre pas

1. Vérifiez que le port 5173 n'est pas déjà utilisé
2. Modifiez le port dans `vite.config.js` si nécessaire

### Les assets ne se chargent pas

1. Vérifiez que les chemins utilisent `getAssetUrl()` (déjà fait)
2. Vérifiez que les fichiers existent dans `/docs/`

## 📚 Ressources

- [Documentation Vite](https://vitejs.dev/)
- [Guide de migration](https://vitejs.dev/guide/migration.html)


