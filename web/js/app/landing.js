import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';

// Page d'accueil - Landing Page
export const LandingPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/landing-page.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/landing.css');
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        // Connexion avec Google
        document.getElementById('google-login-btn')?.addEventListener('click', () => {
            Router.navigateTo('google-login');
        });

        // Connexion classique
        document.getElementById('email-login-btn')?.addEventListener('click', () => {
            Router.navigateTo('email-login');
        });

        // Inscription
        document.getElementById('signup-btn')?.addEventListener('click', () => {
            Router.navigateTo('signup');
        });
    }
};

