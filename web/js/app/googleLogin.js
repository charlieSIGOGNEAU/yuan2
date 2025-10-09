import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';

// Page de connexion Google
export const GoogleLoginPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/google-login.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/auth.css');
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        // Bouton de connexion Google
        document.getElementById('google-auth-btn')?.addEventListener('click', () => {
            console.log('🔑 Connexion Google initiée');
            // TODO: Implémenter l'authentification Google
            alert('Connexion Google à implémenter');
        });

        // Bouton retour
        document.getElementById('back-to-landing')?.addEventListener('click', () => {
            Router.goBack();
        });
    }
};

