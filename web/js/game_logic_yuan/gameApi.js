import { gameState } from './gameState.js';
import { Game } from '../app/game.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,

    
    // Futures fonctions pour envoyer à l'API
    handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        }  
        
        if (data.message && data.message.type === 'game_details') {
            // Mettre à jour le gameState avec les nouvelles données
            gameState.update(data.message);
            console.log('🎮 GameState mis à jour:', gameState);
            
            // Lancer le GameBoard3D si on est en phase de jeu et qu'il n'existe pas encore
            if ((gameState.isInstallationPhase() || gameState.isSimultaneousPlay()) && !this.gameBoard) {
                console.log('🎮 Lancement du GameBoard3D');
                this.gameBoard = Game.showGameBoard();
            }
        } 
    } 
};

// Fonction pour recevoir les données WebSocket
