import { loadPartial, loadCSS } from '../simple.js';
import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { Game } from './game.js';

// Gestion menu principal - Version simplifiée
export const MenuPage = {
    // Afficher la page
    async show() {
        const html = await loadPartial('partials/menu.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/menu.css');
        
        // Afficher le nom d'utilisateur
        document.getElementById('username').textContent = Auth.currentUser?.name || '';
        
        // Mettre à jour le statut WebSocket
        WebSocketClient.updateConnectionUI();
        
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        document.addEventListener('click', this.handleClick);
    },

    // Gestion des clics
    handleClick(e) {
        switch(e.target.id) {
            case 'logout-btn':
                Auth.logout();
                break;
            case 'quick-game-btn':
                Game.startQuickGame();
                break;
            case 'custom-game-btn':
                alert('⚙️ Partie personnalisée - À implémenter');
                break;
            case 'options-btn':
                alert('🔧 Options - À implémenter');
                break;
            // Boutons Game Channels
            // case 'game-1-btn':
            //     WebSocketClient.toggleGameChannel(1);
            //     break;
            // case 'game-2-btn':
            //     WebSocketClient.toggleGameChannel(2);
            //     break;
            // case 'game-3-btn':
            //     WebSocketClient.toggleGameChannel(3);
            //     break;
        }
    }
}; 