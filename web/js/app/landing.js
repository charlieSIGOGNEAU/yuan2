import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { GoogleAuth } from './googleAuth.js';

// Page d'accueil - Landing Page
export const LandingPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/landing-page.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/landing.css');
        await this.setupEvents();
    },

    // Configurer les événements
    async setupEvents() {
        // Connexion avec Google - Afficher le bouton Google officiel
        const googleBtnContainer = document.getElementById('google-login-btn');
        if (googleBtnContainer) {
            console.log('🔐 Initialisation du bouton Google');
            await GoogleAuth.showLoginButton(googleBtnContainer);
        }

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

