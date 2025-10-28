import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { i18n } from '../core/i18n.js';

// Page pour créer une partie rapide
export const CreateQuickGamePage = {
    gameCode: null,
    playersCount: 0,

    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/game.css');
        
        // Initialiser avec les données si fournies
        if (data.custom_code) {
            this.custom_code = data.custom_code;
            this.waiting_players_count = data.waiting_players_count || 0;
            this.updateUI();
        }
        
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="create-quick-game-page">
                <div class="game-info">
                    <div class="info-item">
                        <label>${i18n.t('game_setup.create.code_label')}</label>
                        <div id="game-code-display" class="code-display">-</div>
                    </div>
                    
                    <div class="info-item">
                        <label>${i18n.t('game_setup.create.players_label')}</label>
                        <div id="players-count" class="players-count">0/4</div>
                    </div>
                </div>
                
                <div class="game-actions">
                    <button id="start-game-btn" class="action-btn start-btn">${i18n.t('game_setup.create.start_button')}</button>
                    <button id="delete-game-btn" class="action-btn delete-btn">${i18n.t('game_setup.create.delete_button')}</button>
                </div>
                
                <button id="back-to-game-menu" class="back-btn">${i18n.t('game_setup.create.back_button')}</button>
            </div>
        `;
    },

    // Configurer les événements
    setupEvents() {
        // Lancer la partie
        document.getElementById('start-game-btn')?.addEventListener('click', () => {
            console.log('🚀 Lancement de la partie');
            // TODO: Implémenter le lancement de la partie
            alert('Lancement de la partie à implémenter');
        });

        // Supprimer la partie
        document.getElementById('delete-game-btn')?.addEventListener('click', () => {
            console.log('🗑️ Suppression de la partie');
            // TODO: Implémenter la suppression de la partie
            alert('Suppression de la partie à implémenter');
            // Puis retourner au menu
            Router.navigateTo('game-menu');
        });

        // Bouton retour
        document.getElementById('back-to-game-menu')?.addEventListener('click', () => {
            Router.goBack();
        });
    },

    // Mettre à jour l'interface
    updateUI() {
        if (this.custom_code) {
            document.getElementById('game-code-display').textContent = this.custom_code;
        }
        document.getElementById('players-count').textContent = `${this.waiting_players_count} (max 8)`;
    }
};

