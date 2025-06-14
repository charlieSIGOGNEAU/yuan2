import { TILE_CONFIGS } from '../pieces/TileTypes.js';
import { gameApi } from '../gameApi.js';
import { tileInGame } from '../pieces/TileTypes.js';
import { gameState } from '../gameState.js';

export const installationPhase = {
    
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

    selectedTile(tileName) {
        // Récupérer les positions des tiles déjà posées
        const playedTilesPositions = gameState.game.tiles
            .filter(tile => tile.name && tile.position.q !== undefined && tile.position.r !== undefined)
            .map(tile => tile.position);

        // Si aucune tile n'est posée, on commence à (0,0)
        if (playedTilesPositions.length === 0) {
            const tileInfo = gameApi.gameBoard.addTileTemp(TILE_CONFIGS[tileName].image, { q: 0, r: 0 }, 0);
            gameApi.gameBoard.createCircle({ q: 0, r: 0 });
            
            // Envoyer les informations à l'API
            gameApi.sendTileToApi({
                game_id: gameState.game.id,
                tile_id: gameState.game.tiles.find(tile => tile.name === null).id,
                name: tileName,
                rotation: tileInfo.rotation,
                position: tileInfo.position
            });
            return;
        }

        // Récupérer les positions adjacentes
        const adjacentPositions = this.getAllAdjacentTiles(playedTilesPositions);

        // Ajouter la tile temporaire à la première position adjacente
        const tileInfo = gameApi.gameBoard.addTileTemp(TILE_CONFIGS[tileName].image, adjacentPositions[0], 0);

        // Créer les cercles pour chaque position adjacente
        adjacentPositions.forEach(position => {
            gameApi.gameBoard.createCircle(position);
        });

        // Envoyer les informations à l'API
        gameApi.sendTileToApi({
            game_id: gameState.game.id,
            tile_id: gameState.game.tiles.find(tile => tile.name === null).id,
            name: tileName,
            rotation: tileInfo.rotation,
            position: tileInfo.position
        });
    },

    addTiles(gameState) { //envois seulement a l'api les coordonner de la tile a ajouter. l'ajout dans gameBoard se fais dans updateTile3d
        // Chercher la tile avec turn = 0
        console.log('test0');
        const tileWithTurn0 = gameState.game.tiles.find(tile => tile.turn === 0);
        
        if (tileWithTurn0) {
            // Vérifier si le game_user_id correspond au joueur actuel
            if (tileWithTurn0.game_user_id === gameState.myGameUserId && tileWithTurn0.name === null) {
                console.log('✅ C\'est mon tour de placer une tile !');
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
                console.log('test1');
                return;
            } 
        } 
        console.log('test2');
    
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
                console.log('🎲 Tile sélectionnée:', randomName, 'parmi les tiles non utilisées:', unusedTiles);
                installationPhase.selectedTile(randomName);
            } else {
                console.log('⚠️ Toutes les tiles ont déjà été utilisées !');
            }
        }
        
    },

    updateTile3d() {
        // Parcourir toutes les tiles
        gameState.game.tiles.forEach(tile => {
            // Vérifier si la tile a un nom mais pas de sprite
            if (tile.name && !tile.sprite) {
                console.log('🎮 Mise à jour 3D de la tile:', tile);
                
                // Créer le sprite 3D
                const sprite = gameApi.gameBoard.addTile(
                    TILE_CONFIGS[tile.name].image,
                    tile.position,
                    tile.rotation
                );
                
                // Stocker le sprite dans la tile
                tile.sprite = sprite;
                console.log(tile.name , 'pose');
            }
        });
    }
};
