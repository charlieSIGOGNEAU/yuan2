import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { ServerConfig } from './config.js';

export const PlayerWaitingPage = {
    game_id: null,
    // Afficher la page
    async show(data = {}) {
        console.log('🔙 Données reçues:', data);
        this.game_id = data.game_id;
        const html = await loadPartial('partials/player-waiting.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/player-waiting.css');

        if (data.waiting_players_count) {
            document.getElementById('waiting-players-count').textContent = data.waiting_players_count;
        }

        const button = document.getElementById('go-to-game');
        const waiting_message = document.getElementById('waiting-message');
        const already_confirmation = document.getElementById('already-confirmation');
        const start_game_btn = document.getElementById('start-game-btn');
        const back_to_game_menu_btn = document.getElementById('back-to-game-menu-btn');



        // si demande de confirmation de demarage de la partie
        if (data.ready_game || data.type === 'ready_to_play') {
            button.style.display = 'block';
            waiting_message.style.display = 'none';

            if (data.already_confirmation) {
                already_confirmation.style.display = 'block';
                button.style.display = 'none';
            } else {
                already_confirmation.style.display = 'none';
                button.style.display = 'block';
            }
            
        // si toujours sur attendre d'autres joueurs
        } else {
            button.style.display = 'none';
            waiting_message.style.display = 'block';
            already_confirmation.style.display = 'none';
        }

        if (data.i_am_creator && data.waiting_players_count >= 2) {
            start_game_btn.style.display = 'block';
        } else {
            start_game_btn.style.display = 'none';
        }


        const div_custom_code = document.querySelector('.custom-code');
        if (data.custom_code) {
            div_custom_code.style.display = 'block';
            document.getElementById('custom-code').textContent = data.custom_code;
        } else {
            div_custom_code.style.display = 'none';
        }


        this.setupEvents();

    },
    async launchCustomGame() {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/launch_custom_game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            },
            body: JSON.stringify({
                game_id: this.game_id,
            })
        });
        const data = await response.json();
        console.log('🎮 Données reçues:', data);
    },

    async iamReady() {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/i_am_ready`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            },
            body: JSON.stringify({
                game_id: this.game_id,
            })
        });
        const data = await response.json();
        console.log('🎮 Données reçues:', data);
    },

    async giveUpGame() {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/give_up_game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            },
            body: JSON.stringify({
                game_id: this.game_id,
            })
        });
        const data = await response.json();
        console.log('🎮 Données reçues:', data);
        if (data.success) {
            Router.navigateTo('game-menu');
        } else {
            alert('❌ Erreur de connexion au serveur');
        }
    },




    setupEvents() {
        document.getElementById('back-to-game-menu-btn').addEventListener('click', () => {
            console.log('🔙 Retour au menu');
            this.giveUpGame();
            
        });
        document.getElementById('go-to-game').addEventListener('click', () => {
            console.log('🔙 Je suis prêt');
            
            this.iamReady();
        });
        document.getElementById('start-game-btn').addEventListener('click', () => {
            console.log('🚀 Lancement de la partie');
            this.launchCustomGame();

        });
    }
};