import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { ServerConfig } from './config.js';
import { Auth } from './auth.js';
import { i18n } from '../core/i18n.js';

// Page pour rejoindre une partie rapide
export const JoinQuickGamePage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/game.css');
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="join-quick-game-page">
                <h2>${i18n.t('game_setup.join.title')}</h2>
                
                <form id="join-game-form" class="game-form">
                    <div class="form-group">
                        <label for="game-code">${i18n.t('game_setup.join.code_label')}</label>
                        <input type="text" id="game-code" name="code" placeholder="${i18n.t('game_setup.join.code_placeholder')}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn btn">${i18n.t('game_setup.join.submit_button')}</button>
                </form>
                
                <button id="back-to-game-menu" class="back-btn btn">${i18n.t('game_setup.join.back_button')}</button>
            </div>
        `;
    },

    async joinCustomGame(code) {
        console.log('🎮 Tentative de rejoindre la partie avec le code:', code);
        
        try {
            const response = await fetch(`${ServerConfig.HTTP_BASE}games/join_game_custom`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    custom_code: code
                })
            });
            
            const data = await response.json();
            console.log('📥 Réponse du serveur:', data);
            
            // if (data.success) {
            //     alert(`✅ Vous avez rejoint la partie ${code} !`);
            //     // TODO: Rediriger vers la page de jeu
            // } else {
            //     alert(`❌ Erreur: ${data.message}`);
            // }
        } catch (error) {
            console.error('❌ Erreur lors de la tentative de rejoindre:', error);
            alert('❌ Erreur de connexion au serveur');
        }
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        // const form = document.getElementById('join-game-form');
        // form?.addEventListener('submit', this.handleSubmit.bind(this));

        const form = document.getElementById('join-game-form');
        form?.addEventListener('submit', (e) => {
        e.preventDefault(); // empêche le rechargement
        const code = form.querySelector('input[name="code"]').value.trim();
        console.log('🎮 Code entré :', code);
        this.joinCustomGame(code);
    });

        // Bouton retour
        document.getElementById('back-to-game-menu')?.addEventListener('click', () => {
            Router.goBack();
        });
        
    },

    // Gestion de la soumission
    // async handleSubmit(e) {
    //     e.preventDefault();
    //     const formData = new FormData(e.target);
    //     const code = formData.get('code');
        
    //     console.log('🎮 Rejoindre la partie avec le code:', code);
    //     // TODO: Implémenter la logique de rejoindre une partie
    //     alert(`Rejoindre la partie ${code} - À implémenter`);
    // }
};

