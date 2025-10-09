import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';

// Page des options
export const OptionsPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/options.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        this.setupEvents();
        this.loadCurrentSettings();
    },

    // Configurer les événements
    setupEvents() {
        // Changement de langue
        document.getElementById('language-select')?.addEventListener('change', (e) => {
            console.log('🌍 Changement de langue:', e.target.value);
            // TODO: Implémenter le changement de langue
        });

        // Changer de nom
        document.getElementById('change-name-btn')?.addEventListener('click', () => {
            Router.navigateTo('change-name');
        });

        // Changement de qualité graphique
        document.getElementById('graphics-quality')?.addEventListener('change', (e) => {
            console.log('🎨 Qualité graphique:', e.target.value);
            // TODO: Implémenter le changement de qualité
        });

        // Activation des ombres
        document.getElementById('enable-shadows')?.addEventListener('change', (e) => {
            console.log('💡 Ombres:', e.target.checked ? 'activées' : 'désactivées');
            // TODO: Implémenter l'activation des ombres
        });

        // Déconnexion
        document.getElementById('logout-btn')?.addEventListener('click', () => {
            if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                Auth.logout();
            }
        });

        // Supprimer le compte
        document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            Router.navigateTo('delete-account');
        });

        // Bouton précédent
        document.getElementById('back-to-game-menu')?.addEventListener('click', () => {
            Router.goBack();
        });
    },

    // Charger les paramètres actuels
    loadCurrentSettings() {
        // TODO: Charger les paramètres depuis le serveur ou le localStorage
        console.log('📥 Chargement des paramètres');
    }
};

