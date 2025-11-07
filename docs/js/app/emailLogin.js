import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { i18n } from '../core/i18n.js';

// Page de connexion par email
export const EmailLoginPage = {
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
            <div class="email-login-page">
                <form id="email-login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login-email">${i18n.t('auth.email_login.email_label')}</label>
                        <input type="email" id="login-email" name="email" placeholder="${i18n.t('auth.email_login.email_placeholder')}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="login-password">${i18n.t('auth.email_login.password_label')}</label>
                        <input type="password" id="login-password" name="password" placeholder="${i18n.t('auth.email_login.password_placeholder')}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn btn">${i18n.t('auth.email_login.submit_button')}</button>
                </form>
                
                <button id="back-to-landing" class="back-btn btn">${i18n.t('auth.email_login.back_button')}</button>
            </div>
        `;
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        const form = document.getElementById('email-login-form');
        form?.addEventListener('submit', this.handleSubmit.bind(this));

        // Bouton retour
        document.getElementById('back-to-landing')?.addEventListener('click', () => {
            Router.goBack();
        });
    },

    // Gestion de la soumission
    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        
        console.log('🔑 Tentative de connexion:', email);
        await Auth.loginWithEmail(email, password);
    }
};

