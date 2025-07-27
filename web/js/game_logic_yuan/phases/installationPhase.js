import { TILE_CONFIGS } from '../pieces/TileTypes.js';
import { gameApi } from '../gameApi.js';
import { tileInGame } from '../pieces/TileTypes.js';
import { gameState } from '../gameState.js';

export const installationPhase = {
    // Stocker l'état pour éviter les doublons
    currentTileId: null,
    currentTileHandler: null,
    
    getAllAdjacentTiles(centers) {
        const centerAdjacents = [{ q: 3, r: -2}, { q: 2, r: 1}, { q: -1, r: 3}, { q: -3, r: 2}, { q: -2, r: -1}, { q: 1, r: -3}]
        const adjacentSet = new Set();
        centers.forEach(center => {
            centerAdjacents.forEach(offset => {
                const adjQ = center.q + offset.q;
                const adjR = center.r + offset.r;
                const key = `${adjQ},${adjR}`;
                adjacentSet.add(key);
            });
        });
        // Retirer les centres initiaux
        centers.forEach(center => {
            const key = `${center.q},${center.r}`;
            adjacentSet.delete(key);
        });
        return Array.from(adjacentSet).map(str => {
            const [q, r] = str.split(',').map(Number);
            return { q, r };
        });
    },

    selectedTile(tileName, tileId) {
        // Éviter les doublons : si on traite déjà cette tile, ne rien faire
        if (this.currentTileId === tileId) {
            console.log(`⚠️ Tile ${tileId} déjà en cours de traitement, ignoré`);
            return;
        }
        
        // Nettoyer l'état précédent s'il existe
        this.cleanupPreviousTile();
        
        // Marquer cette tile comme en cours de traitement
        this.currentTileId = tileId;
        
        // Récupérer les positions des tiles déjà posées
        const playedTilesPositions = gameState.game.tiles
            .filter(tile => tile.name && tile.position.q !== undefined && tile.position.r !== undefined)
            .map(tile => tile.position);

        // Si aucune tile n'est posée, on commence à (0,0)
        if (playedTilesPositions.length === 0) {
            gameApi.gameBoard.addTileTemp(TILE_CONFIGS[tileName].model, { q: 0, r: 0 }, 0)
                .then(async () => {
                                    // Utiliser le système d'instances pour créer le cercle
                const circleInstance = await gameApi.gameBoard.meepleManager.createCircleInstance(
                    'selection', 
                    { q: 0, r: 0 }, 
                    2.0, 
                    1
                );
                if (circleInstance) {
                    // Convertir les coordonnées hexagonales en cartésiennes pour le positionnement
                    const cartesianPos = gameApi.gameBoard.hexToCartesian({ q: 0, r: 0 });
                    circleInstance.position.set(cartesianPos.x, 0, cartesianPos.z);
                    
                    gameApi.gameBoard.workplane.add(circleInstance);
                    gameApi.gameBoard.circles.push(circleInstance);
                    console.log('🔵 Cercle d\'instance créé à (0, 0)');
                }
                })
                .catch(error => {
                    console.error('Erreur lors du chargement de la tuile temporaire:', error);
                    this.currentTileId = null; // Réinitialiser en cas d'erreur
                });
            return;
        }

        // Récupérer les positions adjacentes
        const adjacentPositions = this.getAllAdjacentTiles(playedTilesPositions);

        // Ajouter la tile temporaire à la première position adjacente
        gameApi.gameBoard.addTileTemp(TILE_CONFIGS[tileName].model, adjacentPositions[0], 0)
            .then(async () => {
                // Créer les cercles d'instances pour chaque position adjacente
                for (const position of adjacentPositions) {
                    const circleInstance = await gameApi.gameBoard.meepleManager.createCircleInstance(
                        'selection', 
                        position, 
                        1.0, 
                        0.1
                    );
                    if (circleInstance) {
                        // Convertir les coordonnées hexagonales en cartésiennes pour le positionnement
                        const cartesianPos = gameApi.gameBoard.hexToCartesian(position);
                        circleInstance.position.set(cartesianPos.x, 0.1, cartesianPos.z);
                        
                        gameApi.gameBoard.workplane.add(circleInstance);
                        gameApi.gameBoard.circles.push(circleInstance);
                        console.log(`🔵 Cercle d'instance créé à (${position.q}, ${position.r})`);
                    }
                }
            })
            .catch(error => {
                console.error('Erreur lors du chargement de la tuile temporaire:', error);
                this.currentTileId = null; // Réinitialiser en cas d'erreur
            });

        // Écouter l'événement tilePlaced
        const handleTilePlaced = (event) => {
            console.log(`✅ Tile ${tileId} placée à la position:`, event.detail.position);
            
            gameApi.sendTileToApi({
                game_id: gameState.game.id,
                tile_id: tileId,
                name: tileName,
                rotation: event.detail.rotation,
                position: event.detail.position
            });
            
            // Nettoyer l'état
            this.cleanupPreviousTile();
        };

        // Stocker le handler pour pouvoir le nettoyer plus tard
        this.currentTileHandler = handleTilePlaced;
        gameApi.gameBoard.container.addEventListener('tilePlaced', handleTilePlaced);
    },

    // Nettoyer l'état précédent
    cleanupPreviousTile() {
        if (this.currentTileHandler) {
            gameApi.gameBoard.container.removeEventListener('tilePlaced', this.currentTileHandler);
            this.currentTileHandler = null;
        }
        this.currentTileId = null;
        console.log('🧹 État précédent nettoyé');
    },

    addTiles(gameState) { //envois seulement a l'api les coordonner de la tile a ajouter. l'ajout dans gameBoard se fais dans updateTile3d
        // Chercher la tile avec turn = 0
        const tileWithTurn0 = gameState.game.tiles.find(tile => tile.turn === 0);
        
        if (tileWithTurn0) {
            // Vérifier si le game_user_id correspond au joueur actuel
            if (tileWithTurn0.game_user_id === gameState.myGameUserId && tileWithTurn0.name === null) {
                const array = tileInGame(gameState.game.player_count);
                const rotation = Math.floor(Math.random() * 6);
                const name = array[Math.floor(Math.random() * array.length)];
                
                // Envoyer la tile à l'API
                gameApi.sendTileToApi({
                    game_id: gameState.game.id,
                    tile_id: tileWithTurn0.id,
                    name: name,
                    rotation: rotation,
                    position: { q: 0, r: 0 }
                });
                return;
            } 
        } 
    
        // Trouver la tile avec le turn le plus bas qui n'a pas de name
        const nextTile = gameState.game.tiles
            .filter(tile => tile.name === null)
            .sort((a, b) => a.turn - b.turn)[0];

        if (nextTile && nextTile.game_user_id === gameState.myGameUserId) {
            // Récupérer toutes les tiles déjà utilisées
            const usedTiles = gameState.game.tiles
                .filter(tile => tile.name !== null)
                .map(tile => tile.name);

            // Récupérer toutes les tiles disponibles pour ce nombre de joueurs
            const availableTiles = tileInGame(gameState.game.player_count);

            // Filtrer pour ne garder que les tiles non utilisées
            const unusedTiles = availableTiles.filter(name => !usedTiles.includes(name));

            if (unusedTiles.length > 0) {
                // Sélectionner une tile au hasard parmi les non utilisées
                const randomName = unusedTiles[Math.floor(Math.random() * unusedTiles.length)];
                
                installationPhase.selectedTile(randomName, nextTile.id);
            } 
        }
        
    },

    updateTile3d() {
        // Parcourir toutes les tiles
        gameState.game.tiles.forEach(tile => {
            // Vérifier si la tile a un nom mais pas de sprite
            if (tile.name && !tile.sprite) {
                
                // Créer le modèle 3D (async)
                gameApi.gameBoard.addTile(
                    TILE_CONFIGS[tile.name].model,
                    tile.position,
                    tile.rotation
                ).then(model => {
                    // Stocker le modèle dans la tile
                    tile.sprite = model;
                    console.log(`✅ Tuile ${tile.name} chargée à la position:`, tile.position);
                }).catch(error => {
                    console.error(`❌ Erreur lors du chargement de la tuile ${tile.name}:`, error);
                });
            }
        });
    }
};
