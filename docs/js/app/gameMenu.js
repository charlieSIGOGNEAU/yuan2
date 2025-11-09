import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

// Menu principal du jeu (anciennement lobby)
export const GameMenuPage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/lobby.css');
        
        // Mettre à jour le statut WebSocket
        WebSocketClient.updateConnectionUI();
        
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        const username = Auth.currentUser?.name || '';
        return `
            <div class="game-menu-page">
                <p>${i18n.t('menu.welcome')}, <span id="username">${username}</span> <span id="connection-status" class="connection-status disconnected">disconnected</span></p>
                
                <div class="menu">
                    <button id="quick-game-btn" class="menu-btn btn">${i18n.t('menu.quick_game')}</button>
                    <button id="join-custom-game-btn" class="menu-btn btn">${i18n.t('menu.join_custom_game')}</button>
                    <button id="create-custom-game-btn" class="menu-btn btn">${i18n.t('menu.create_custom_game')}</button>
                    <button id="options-btn" class="menu-btn btn">${i18n.t('menu.options')}</button>
                </div>
            </div>
        `;
    },

    async startQuickGame() {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/quick_game`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            }
        });
        const data = await response.json();
        console.log('🎮 Données reçues:', data);
        if (data.game_id) {
            // Router.navigateTo('player-waiting',{game_id: data.game_id});
        }
        else {
            console.error('❌ Erreur lors de la tentative de création de partie rapide:', data);
        }
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
            // Router.navigateTo('player-waiting',data);
            
            // const data2 = {
            //     custom_code: data.custom_code,
            //     waiting_players_count: data.waiting_players_count
            // };
            // return data2;
        }
        else {
            return false;
        }
    },

    

    // Configurer les événements
    setupEvents() {
        // Partie rapide
        document.getElementById('quick-game-btn')?.addEventListener('click', () => {
            console.log('🎮 Partie rapide sélectionnée');
            this.startQuickGame();
            // Router.navigateTo('player-waiting');

        });

        // Rejoindre une partie personnalisée
        document.getElementById('join-custom-game-btn')?.addEventListener('click', () => {
            Router.navigateTo('join-quick-game');
        });

        // Créer une partie personnalisée
        document.getElementById('create-custom-game-btn')?.addEventListener('click', async () => {
            const data2 = await this.createCustomGame();
            if (data2) {
                Router.navigateTo('create-quick-game',data2);
            }
        });

        // Options
        document.getElementById('options-btn')?.addEventListener('click', () => {
            Router.navigateTo('options');
        });
    }
};

