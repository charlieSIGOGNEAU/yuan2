import { GameBoard3D } from './ui/GameBoard3D.js';
import { Game } from '../app/game.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,
    
    // Futures fonctions pour envoyer à l'API
    handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        }  
        
        if (data.message && data.message.type === 'game_details' && (data.message.game.game_status === 'installation_phase' || data.message.game.game_status === 'simultaneous_play') && !this.gameBoard) {
            // Appeler Game pour afficher le plateau de jeu
            console.log('📨 Message reçu:', "OKOK");
            this.gameBoard = Game.showGameBoard();
            this.gameBoard.test();
        } 
    } 
};

// Fonction pour recevoir les données WebSocket
