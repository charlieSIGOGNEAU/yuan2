import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { WebSocketClient } from './websocket.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

export const PlayerWaitingPage = {
    game_id: null,
    // Afficher la page
    async show(data = {}) {
        // Exécuter ces lignes uniquement si la page précédente était différente         // On vérifie si les éléments de la page existent déjà dans le DOM
        const isAlreadyOnThisPage = document.getElementById('waiting-players-count') !== null;
        
        // Toujours mettre à jour game_id si fourni
        if (data.game_id) {
            this.game_id = data.game_id;
        }
        
        if (!isAlreadyOnThisPage) {
            Router.disableBack = true;
            console.log('🔙 Données reçues:', data);
            const html = this.renderHTML();
            document.getElementById('app').innerHTML = html;
            loadCSS('css/player-waiting.css');
        }

        if (data.waiting_players_count) {
            document.getElementById('waiting-players-count').textContent = data.waiting_players_count;
        }

        const button = document.getElementById('go-to-game');
        const waiting_message = document.getElementById('waiting-message');
        const already_confirmation = document.getElementById('already-confirmation');
        const start_game_btn = document.getElementById('start-game-btn');
        const start_game_form = document.getElementById('start-game-form');



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

        if (data.i_am_creator ) {
            start_game_form.style.display = 'block';
        } else {
            start_game_form.style.display = 'none';
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

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="player-waiting-page">
                <div class="container-waiting-players">
                    <p>${i18n.t('game_setup.waiting.players_count')} <span id="waiting-players-count">1</span></p>
                </div>
                <div class="custom-code">
                    <p>${i18n.t('game_setup.waiting.game_code')} <span id="custom-code">123456</span></p>
                </div>
                <p id="waiting-message">${i18n.t('game_setup.waiting.waiting_message')}</p>
                <p id="already-confirmation">${i18n.t('game_setup.waiting.confirmation_message')}</p>
                <p>${i18n.t('game_setup.waiting.quit_message')}</p>

                <form id="start-game-form" class="game-form">
                    <div class="form-group">
                        <label for="game-duration">${i18n.t('game_setup.waiting.game_duration_label')}</label>
                        <input type="text" id="game-duration" name="game-duration" placeholder="${i18n.t('game_setup.waiting.game_duration_placeholder')}" >
                    </div>
                    
                    <button id="start-game-btn" type="submit" class="submit-btn btn">${i18n.t('game_setup.waiting.start_button')}</button>
                </form>

                <button id="go-to-game" class="btn btn-ready-game">${i18n.t('game_setup.waiting.ready_button')}</button>
                <button id="back-to-game-menu-btn" class="btn btn-quit-game">${i18n.t('game_setup.waiting.quit_button')}</button>
            </div>
        `;
    },

    async launchCustomGame(game_duration) {
        const response = await fetch(`${ServerConfig.HTTP_BASE}/games/launch_custom_game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            },
            body: JSON.stringify({
                game_id: this.game_id,
                game_duration: game_duration,
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
        try {
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
            
            // Si la partie n'existe plus (404) ou si on a réussi à la quitter
            // Dans les deux cas, retourner au menu
            if (data.success || response.status === 404 || data.message === 'Game not found') {
                console.log('🔙 Retour au menu (partie quittée ou inexistante)');
                Router.navigateTo('game-menu');
            } else {
                console.error('❌ Erreur:', data.message);
                alert('❌ Erreur: ' + (data.message || 'Erreur de connexion au serveur'));
            }
        } catch (error) {
            console.error('❌ Erreur lors de la tentative de quitter:', error);
            // En cas d'erreur, retourner quand même au menu
            // car l'utilisateur ne peut rien faire d'autre
            Router.navigateTo('game-menu');
        }
    },




    setupEvents() {
        document.getElementById('back-to-game-menu-btn').addEventListener('click', () => {
            console.log('🔙 Retour au menu');
            Router.disableBack = false;
            this.giveUpGame();
            
        });
        document.getElementById('go-to-game').addEventListener('click', () => {
            console.log('🔙 Je suis prêt');
            
            this.iamReady();
        });
        // document.getElementById('start-game-btn').addEventListener('click', () => {
        //     console.log('🚀 Lancement de la partie');
        //     this.launchCustomGame();
        // });

        const form = document.getElementById('start-game-form');
        form?.addEventListener('submit', (e) => {
        e.preventDefault();
            let game_duration = form.querySelector('input[name="game-duration"]').value.trim();
            if (!game_duration ) {
                game_duration = 120;
            }
            if (!game_duration || game_duration <= 15) {
                game_duration = 15;
            }
            console.log('🎮 Durée de la partie :', game_duration);
            this.launchCustomGame(game_duration);
        });

    }
};