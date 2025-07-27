import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { GameBoard3D } from '../game_logic_yuan/ui/GameBoard3D.js';
// Module de gestion des jeux
export const Game = {
    // Démarrer une partie rapide
    async startQuickGame() {
        const response = await fetch('http://localhost:3000/api/v1/games/quick_game', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            WebSocketClient.subscribeToGameChannel(data.game_id);
        }
    },

    // Afficher le plateau de jeu en pleine page
    showGameBoard() {
        // Créer un container pour le jeu qui prend toute la page
        const gameContainer = document.createElement('div');
        gameContainer.id = 'game-container';
        gameContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: #000;
            z-index: 10;
            margin: 0;
            padding: 0;
        `;

        // Ajouter le container au body
        document.body.appendChild(gameContainer);

        // Créer et retourner le GameBoard3D
        return new GameBoard3D('game-container');
    }
}; 