import { defineConfig } from 'vite';
import { resolve } from 'path';
import { jsonServerPlugin } from './vite-plugin-json-server.js';
import { copyAssetsPlugin } from './vite-plugin-copy-assets.js';

export default defineConfig({
  // Le dossier docs contient tout le frontend
  root: './docs',
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    open: false,
    host: true, // Permet l'accès depuis le réseau local
    // Désactiver le fallback SPA pour les fichiers JSON
    // Cela permet de servir les fichiers JSON correctement au lieu de retourner index.html
    fs: {
      // Permettre l'accès aux fichiers en dehors de root si nécessaire
      allow: ['..']
    }
  },
  
  // Configuration du build
  build: {
    outDir: '../dist', // Sortie dans un dossier dist à la racine
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      input: resolve(__dirname, 'docs/index.html')
    },
    // Copier les fichiers JSON de locales/ dans le build
    copyPublicDir: false
  },
  
  // Résolution des imports
  resolve: {
    alias: {
      // Permet d'utiliser des imports absolus depuis js/
      '@': resolve(__dirname, 'docs/js')
    }
  },
  
  // Inclure les fichiers GLB comme assets (les JSON sont copiés par le plugin)
  assetsInclude: ['**/*.glb', '**/*.gltf'],
  
  // Optimisation
  optimizeDeps: {
    include: ['three']
  },
  
  // Configuration pour servir les fichiers statiques
  publicDir: false, // Pas de dossier public, tout est dans docs/
  
  // Plugins
  plugins: [
    jsonServerPlugin(), // Plugin pour servir les JSON correctement en dev
    copyAssetsPlugin()  // Plugin pour copier les assets statiques lors du build
  ]
});

