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
                    <button id="rules-video-btn" class="menu-btn btn short-btn">${i18n.t('menu.rules_video')}</button>
                    <button id="rules-pdf-btn" class="menu-btn btn short-btn">${i18n.t('menu.rules_pdf')}</button>
                    <button id="rate-bgg-btn" class="menu-btn btn short-btn">${i18n.t('menu.rate_on_bgg')}</button>
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
            console.log('🎮 Code de la partie:', data.custom_code);
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
            this.createCustomGame();
            // maintenant c'est gameApi qui lance la partie personnalisée suite au broadcast de la partie personnalisée
        });

        // Options
        document.getElementById('options-btn')?.addEventListener('click', () => {
            Router.navigateTo('options');
        });

        // Règles vidéo
        document.getElementById('rules-video-btn')?.addEventListener('click', () => {
            this.openRulesVideo();
        });

        // Règles PDF
        document.getElementById('rules-pdf-btn')?.addEventListener('click', () => {
            this.openRulesPDF();
        });

        // Noter sur BGG
        document.getElementById('rate-bgg-btn')?.addEventListener('click', () => {
            this.openBGG();
        });
    },

    // Ouvrir la vidéo des règles en plein écran
    openRulesVideo() {
        const videoUrl = 'https://www.youtube.com/embed/TvlbKy-nVtY?autoplay=1';
        
        // Créer un iframe en plein écran
        const iframe = document.createElement('iframe');
        iframe.src = videoUrl;
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.zIndex = '10000';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        
        // Bouton de fermeture
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'fixed';
        closeBtn.style.top = '20px';
        closeBtn.style.right = '20px';
        closeBtn.style.zIndex = '10001';
        closeBtn.style.padding = '10px 15px';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        closeBtn.style.color = 'white';
        closeBtn.style.border = 'none';
        closeBtn.style.borderRadius = '5px';
        
        closeBtn.onclick = () => {
            document.body.removeChild(iframe);
            document.body.removeChild(closeBtn);
        };
        
        document.body.appendChild(iframe);
        document.body.appendChild(closeBtn);
    },

    // Ouvrir le PDF des règles selon la langue
    openRulesPDF() {
        const currentLang = i18n.currentLanguage || 'en';
        let pdfUrl;
        
        if (currentLang === 'fr') {
            pdfUrl = 'https://okaluda.fr/wp-content/uploads/2023/09/YUAN-Regles-Chine_compressed.pdf';
        } else {
            pdfUrl = 'https://okaluda.fr/wp-content/uploads/2024/09/YUAN-Regles-Mongolie-ENG_WEB.pdf';
        }
        
        window.open(pdfUrl, '_blank');
    },

    // Ouvrir la page BGG
    openBGG() {
        window.open('https://boardgamegeek.com/boardgame/403280/yuan-lart-de-la-guerre-chine', '_blank');
    }
};

