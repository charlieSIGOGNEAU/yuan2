import { TILE_CONFIGS } from '../pieces/TileTypes.js';

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

    selectedTile(plateau,gameBoard) {
        const getAllAdjacentTiles = installationPhase.getAllAdjacentTiles(plateau.playedTilesPosition);
        gameBoard.addTileTemp(TILE_CONFIGS[plateau.tilesToPlay[0]].image, getAllAdjacentTiles[0],0);
        console.log(plateau.tilesToPlay[0]);
        getAllAdjacentTiles.forEach(position => {
            gameBoard.createCircle(position);
            // gameBoard.moveTileTemp({ q: -3, r: 2});
        });
    }
}
