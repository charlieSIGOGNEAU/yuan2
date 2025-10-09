import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';

// Page pour créer une partie rapide
export const CreateQuickGamePage = {
    gameCode: null,
    playersCount: 0,

    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/create-quick-game.html');
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

