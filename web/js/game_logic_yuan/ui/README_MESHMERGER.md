# MeshMerger - Système de fusion de meshes

## État actuel : DÉSACTIVÉ

La fusion de meshes est actuellement **désactivée** pour préserver les textures et matériaux multiples.

## ✨ Animation des temples

Les temples ont une animation de chute avant d'arriver à leur position finale. Le système a été modifié pour que **la fusion se fasse APRÈS l'animation**, préservant ainsi l'effet visuel.

### Comment ça marche ?

1. Le temple est créé et ajouté au workplane
2. L'animation de chute s'exécute (`animateTempleFall` dans gameState.js)
3. Une fois l'animation terminée, le temple est automatiquement ajouté à la fusion (si activée)

**Important** : Même sans fusion, les animations fonctionnent normalement !

## Pourquoi désactivé ?

Le système initial ne gérait pas correctement les modèles avec plusieurs matériaux, ce qui causait :
- Perte de textures
- Meshes invisibles
- Corruption visuelle

## Solution implémentée

Le système a été complètement refait pour :
1. Grouper les géométries **par matériau**
2. Créer un mesh fusionné pour chaque matériau
3. Permettre d'activer/désactiver la fusion à la volée
4. Restaurer automatiquement les meshes originaux

## Utilisation console

### Activer la fusion (après rechargement de page)
```javascript
meshMerger.setMergingEnabled(true)
```

### Désactiver la fusion (restaure les meshes originaux)
```javascript
meshMerger.setMergingEnabled(false)
```

### Voir les statistiques
```javascript
meshMerger.getStats()
```

### Configuration du seuil de reconstruction
```javascript
// Pour charger beaucoup de tiles d'un coup
meshMerger.setRebuildThreshold(50)  // Reconstruit tous les 50 ajouts

// Charger vos tiles...

// Forcer la reconstruction à la fin
meshMerger.forceRebuild()

// Remettre à 1
meshMerger.setRebuildThreshold(1)
```

### Nettoyer complètement
```javascript
meshMerger.clear()
```

## Pour réactiver la fusion

### Étape 1 : Activer la fusion

```javascript
// Dans la console
meshMerger.setMergingEnabled(true)
```

### Étape 2 : Décommenter dans GameBoard3D.js

Décommenter ces lignes dans `addTile()` :
```javascript
// if (tileType !== 'eau' && this.meshMerger) {
//     this.meshMerger.addTileToMerge(tile, true);
// }
```

**Note** : Les temples se fusionnent automatiquement APRÈS leur animation grâce au code dans `gameState.js` (pas besoin de modifier `GameBoard3D.js` pour les temples)

## Notes importantes

- La fusion **ne fonctionne pas** pour les tiles temporaires (elles sont exclues automatiquement)
- Les tiles **eau** ne sont **jamais fusionnées** (elles restent individuelles)
- La fusion gère maintenant correctement les **matériaux multiples**
- Les ombres sont correctement appliquées aux meshes fusionnés

## Avantages de la fusion (quand activée)

✅ Réduction massive des draw calls  
✅ Meilleures performances de rendu  
✅ Calcul d'ombres optimisé  
✅ Préserve les textures et matériaux  

## Inconvénients

⚠️ Légère surcharge mémoire (les géométries sont clonées)  
⚠️ Temps de reconstruction lors des ajouts  

