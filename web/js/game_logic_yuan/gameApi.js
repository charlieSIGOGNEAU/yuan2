import { gameState } from './gameState.js';
import { Game } from '../app/game.js';
import { installationPhase } from './phases/installationPhase.js';
import { Auth } from '../app/auth.js';

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
            console.log('🎮 GameState status:', gameState.game.game_status);
            
            // Lancer le GameBoard3D si on est en phase de jeu et qu'il n'existe pas encore
            if ((gameState.isInstallationPhase() || gameState.isSimultaneousPlay()) && !this.gameBoard) {
                console.log('🎮 Lancement du GameBoard3D');
                this.gameBoard = Game.showGameBoard();
            }
            // Mise à jour des tiles 3D
            if ((gameState.isInstallationPhase() || gameState.isSimultaneousPlay()) && this.gameBoard) {
                console.log('🎮 Lancement du GameBoard3D');
                installationPhase.updateTile3d();
            }

            // Ajout de la premiere tile ou choix de la tile a ajouter
            if (gameState.game.game_status === 'installation_phase') {
                console.log('🎮 installation_phase');
                installationPhase.addTiles(gameState);
            }

        } 
    },

    // Envoyer une tile à l'API
    async sendTileToApi(tileData) {
        try {
            console.log('📤 Envoi tile à l\'API:', tileData);
            
            const response = await fetch(`http://localhost:3000/api/v1/games/${tileData.game_id}/tiles/${tileData.tile_id}/place`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    name: tileData.name,
                    rotation: tileData.rotation,
                    position_q: tileData.position.q,
                    position_r: tileData.position.r
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Tile envoyée avec succès:', data);
            } else {
                console.error('❌ Erreur lors de l\'envoi de la tile:', data);
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi de la tile:', error);
        }
    }
};

// Fonction pour recevoir les données WebSocket
 