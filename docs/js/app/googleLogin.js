import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { i18n } from '../core/i18n.js';

// Page de connexion Google
export const GoogleLoginPage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/auth.css');
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="google-login-page">
                <h2>${i18n.t('auth.google_login.title')}</h2>
                
                <div class="google-auth-container">
                    <button id="google-auth-btn" class="google-connect-btn">
                        <img src="./images/google-icon.png" alt="Google" class="btn-icon">
                        ${i18n.t('auth.google_login.button')}
                    </button>
                    
                    <p class="auth-info">
                        ${i18n.t('auth.google_login.info')}
                    </p>
                </div>
                
                <button id="back-to-landing" class="back-btn">${i18n.t('auth.google_login.back_button')}</button>
            </div>
        `;
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

