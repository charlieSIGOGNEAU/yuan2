# Système de Gestion des Meeples 🎭

## Vue d'ensemble

Le `MeepleManager` optimise le chargement et la gestion des pièces de jeu (meeples) en préchargeant les modèles GLB et en créant des instances colorées selon les besoins.

## Types de Meeples Disponibles

### Meeples Colorables (selon les clans)
- **`ville`** - Ville principale des clans
- **`village`** - Village secondaire  
- **`guerrier`** - Unité militaire
- **`2villes`** - Double ville spéciale

### Meeples Neutres (couleur fixe)
- **`temple`** - Bâtiment religieux
- **`fortification`** - Défense militaire

## Utilisation

### 1. Initialisation Automatique

L'initialisation se fait automatiquement dans la phase `biddingPhase` :

```javascript
// Dans biddingPhase.js
await this.initializeMeeples(gameBoard);
```

### 2. Ajout de Meeples au Plateau

#### Méthode Simple
```javascript
// Ajouter une ville rouge à la position (2, -1)
const city = gameBoard.addMeeple('ville', { q: 2, r: -1 }, '#FF0000', {
    clanName: 'red_clan',
    owner: 'player1'
});
```

#### Méthode Clan (Optimisée)
```javascript
// Utiliser la méthode optimisée pour les villes de clan
const city = gameBoard.addClanCityOptimized(
    { q: 2, r: -1 }, 
    '#FF0000', 
    'red_clan', 
    false // isInitialPlacement
);
```

### 3. Création d'Instances Manuelles

```javascript
// Import du manager
import { meepleManager } from './MeepleManager.js';

// Précharger un type spécifique
await meepleManager.preloadMeepleModel('guerrier');

// Créer une instance colorée
const redWarrior = meepleManager.createMeepleInstance('guerrier', '#FF0000', {
    strength: 5,
    clanName: 'red_clan'
});

// Créer un set de couleurs
const warriors = meepleManager.createColoredMeepleSet('guerrier', [
    '#FF0000', '#00FF00', '#0000FF'
]);
```

## Avantages du Système

### 🚀 Performance
- **Préchargement unique** : Chaque modèle GLB n'est chargé qu'une fois
- **Instanciation rapide** : Clonage des modèles en mémoire
- **Gestion mémoire** : Dispose automatique des ressources

### 🎨 Flexibilité
- **Couleurs dynamiques** : Application automatique des couleurs de clan
- **Métadonnées** : Stockage d'informations personnalisées
- **Types variés** : Support des meeples colorables et neutres

### 🔧 Facilité d'Usage
- **API simple** : Méthodes intuitives pour créer et placer
- **Intégration GameBoard3D** : Compatible avec le système existant
- **Gestion d'erreurs** : Logs détaillés et fallbacks

## Structure des Données

### Instance de Meeple
```javascript
meepleInstance.userData = {
    type: 'meeple',
    meepleType: 'ville',           // Type du meeple
    colorHex: '#FF0000',           // Couleur appliquée
    colorable: true,               // Si colorable
    clanName: 'red_clan',          // Nom du clan (optionnel)
    // ... autres métadonnées personnalisées
}
```

### Configuration de Type
```javascript
meepleTypes.ville = {
    path: './glb/meeple/ville.glb',
    colorable: true,
    scale: { x: 1, y: 1, z: 1 }
}
```

## Exemples Pratiques

### Placement Initial des Villes
```javascript
// Récupérer les clans du jeu
const clans = gameState.game.clans;

// Placer une ville pour chaque clan
clans.forEach((clan, index) => {
    const position = startingPositions[index];
    gameBoard.addMeeple('ville', position, clan.color_hex, {
        clanName: clan.name,
        isStartingCity: true
    });
});
```

### Renforcements de Phase
```javascript
// Ajouter des guerriers lors de la phase militaire
const playerClan = getCurrentPlayerClan();
const guerrier = gameBoard.addMeeple('guerrier', selectedPosition, playerClan.color_hex, {
    clanName: playerClan.name,
    phaseCreated: 'military',
    strength: 3
});
```

### Expansion de Territoire
```javascript
// Créer un nouveau village
const village = gameBoard.addMeeple('village', expansionPosition, clan.color_hex, {
    clanName: clan.name,
    parentCity: nearestCityId,
    economicValue: 2
});
```

## Maintenance et Debug

### Vérification du Cache
```javascript
// Vérifier si un type est préchargé
if (meepleManager.isMeepleLoaded('ville')) {
    console.log('✅ Villes prêtes');
}

// Lister les types disponibles
console.log('Types:', meepleManager.getAvailableMeepleTypes());
```

### Nettoyage Mémoire
```javascript
// Nettoyer le cache si nécessaire (rare)
meepleManager.clearCache();
```

---

**Note :** Ce système est rétro-compatible avec l'ancienne méthode `addClanCity()` qui reste disponible mais est moins optimisée. 