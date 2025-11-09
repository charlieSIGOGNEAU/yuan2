import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { GoogleAuth } from './googleAuth.js';
import { i18n } from '../core/i18n.js';

// Page d'accueil - Landing Page
export const LandingPage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/landing.css');
        await this.setupEvents();
        console.log('🔐 Page d\'accueil affichée');
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="landing-page">
                <div class="auth-options">
                    <!-- Bouton Google rendu par le SDK Google -->
                    <div id="google-login-btn" class="google-btn-container"></div>
                    
                    <button id="email-login-btn" class="auth-btn email-btn btn">
                        ${i18n.t('auth.landing.login')}
                    </button>
                    
                    <button id="signup-btn" class="auth-btn signup-btn btn">
                        ${i18n.t('auth.landing.signup')}
                    </button>
                </div>
            </div>
        `;
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
            console.log('🔐 Connexion par email');
            Router.navigateTo('email-login');
        });

        // Inscription
        document.getElementById('signup-btn')?.addEventListener('click', () => {
            console.log('🔐 Inscription');
            Router.navigateTo('signup');
        });
    }
};

