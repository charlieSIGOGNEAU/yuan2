// fichier a supprimer

import { GameBoard3D } from './ui/GameBoard3D.js';
import { PlayerSelectionUI } from './ui/PlayerSelectionUI.js';
import { gameSimulator } from './network/gameSimulator.js';
import { gameState } from './gameState.js';
import { installationPhase} from './phases/installationPhase.js';
import { TILE_CONFIGS } from './pieces/TileTypes.js';

// Initialisation de la scène 3D
const gameBoard = new GameBoard3D('threejs-container');

// Fonction d'initialisation asynchrone
async function initializeGame() {
    // Attendre que le gameBoard soit prêt
    await gameBoard.ready;
    
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
    const model = TILE_CONFIGS[gameState.plateau.playedTiles[0]].model;
    console.log(gameState.plateau.playedTiles[0]);
    gameBoard.addTile(model, { q: 0, r: 0},gameState.plateau.playedTilesRotation[0]).then(() => {
        console.log('Première tuile chargée avec succès');
    }).catch(error => {
        console.error('Erreur lors du chargement de la première tuile:', error);
    });

    //affiche la prochaine tuile et les cercle de choix
    installationPhase.selectedTile(gameState.plateau,gameBoard);
}

// Lancer l'initialisation
initializeGame().catch(error => {
    console.error('Erreur lors de l\'initialisation du jeu:', error);
});


