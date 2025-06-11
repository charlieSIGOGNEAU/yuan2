import { GameBoard3D } from './js/ui/GameBoard3D.js';
import { PlayerSelectionUI } from './js/ui/PlayerSelectionUI.js';
import { gameSimulator } from './js/network/gameSimulator.js';
import { gameState } from './js/core/gameState.js';
import { installationPhase} from './js/phases/installationPhase.js';
import { TILE_CONFIGS } from './js/pieces/TileTypes.js';

// Initialisation de la scène 3D
const gameBoard = new GameBoard3D('threejs-container');

// Initialisation de la sélection des joueurs
const playerSelection = new PlayerSelectionUI();

// Écouter les changements de joueur
document.addEventListener('playerSelected', (event) => {
    console.log(`Joueur ${event.detail.playerNumber} sélectionné`);
    // Ici, tu pourras ajouter la logique pour gérer le changement de joueur
    // Par exemple, changer la couleur des tuiles, etc.
});

// Responsive
window.addEventListener('resize', () => {
    gameBoard.onResize();
});

if (gameSimulator.plateau.tilesToPlay == null) {  // je devrais aussi plus tard verifier que je suis le premier joueur
    const tiles = installationPhase.tilesInGame(gameSimulator.players.length);
    

    gameSimulator.plateau.playedTiles = [tiles[0]];
    gameSimulator.plateau.tilesToPlay = tiles.slice(1); // Tous les éléments sauf le premier
    gameSimulator.plateau.playedTilesPosition = [{ q: 0, r: 0}];
    gameSimulator.plateau.playedTilesRotation = [Math.floor(Math.random() * 6)];

    // Copie des valeurs de gameSimulator.plateau vers gameState.plateau
    gameState.plateau.tilesToPlay = [...gameSimulator.plateau.tilesToPlay];
    gameState.plateau.playedTiles = [...gameSimulator.plateau.playedTiles];
    gameState.plateau.playedTilesPosition = [...gameSimulator.plateau.playedTilesPosition];
    gameState.plateau.playedTilesRotation = [...gameSimulator.plateau.playedTilesRotation];
}

//affichage de la premiere tuile
const image = TILE_CONFIGS[gameState.plateau.playedTiles[0]].image;
console.log(gameState.plateau.playedTiles[0]);
gameBoard.addTile(image, { q: 0, r: 0},gameState.plateau.playedTilesRotation[0]);

//affiche la prochaine tuile et les cercle de choix
installationPhase.selectedTile(gameState.plateau,gameBoard);


