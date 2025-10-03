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

    async joinGame(gameId) {
    },

    async createGame(playerCount) {
    },


}; 