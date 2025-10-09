import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { ServerConfig } from './config.js';

// Menu principal du jeu (anciennement lobby)
export const GameMenuPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/game-menu.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/lobby.css');
        
        // Afficher le nom d'utilisateur
        document.getElementById('username').textContent = Auth.currentUser?.name || '';
        
        // Mettre à jour le statut WebSocket
        WebSocketClient.updateConnectionUI();
        
        this.setupEvents();
    },

    async startQuickGame() {

        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/quick_game`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            }
        });
        
        // const data = await response.json();
        
        // if (data.success) {
        //     WebSocketClient.subscribeToGameChannel(data.game_id);
        // }
    },

    async createCustomGame() {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/creat_custom_game`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            }
        });
        const data = await response.json();
        console.log('🎮 Données reçues:', data);
        if (data.custom_code) {
            console.log('🎮 Code personnalisé:', data.custom_code);
            const display = document.getElementById("game-code-display");
            display.textContent = data.custom_code;  // remplace "-"
        }
    },

    

    // Configurer les événements
    setupEvents() {
        // Partie rapide
        document.getElementById('quick-game-btn')?.addEventListener('click', () => {
            console.log('🎮 Partie rapide sélectionnée');
            this.startQuickGame();
        });

        // Rejoindre une partie personnalisée
        document.getElementById('join-custom-game-btn')?.addEventListener('click', () => {
            Router.navigateTo('join-quick-game');
        });

        // Créer une partie personnalisée
        document.getElementById('create-custom-game-btn')?.addEventListener('click', () => {
            this.createCustomGame();
            Router.navigateTo('create-quick-game');
        });

        // Options
        document.getElementById('options-btn')?.addEventListener('click', () => {
            Router.navigateTo('options');
        });
    }
};

