import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { ServerConfig } from './config.js';
import { Auth } from './auth.js';
import { i18n } from '../core/i18n.js';

// Page d'inscription
export const SignupPage = {
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
            <div class="signup-page">
                <h2 id="signup-page-title">${i18n.t('auth.signup.title')}</h2>
                
                <form id="signup-form" class="auth-form">
                    <div class="form-group">
                        <label for="signup-email">${i18n.t('auth.signup.email_label')}</label>
                        <input type="email" id="signup-email" name="email" placeholder="${i18n.t('auth.signup.email_placeholder')}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password">${i18n.t('auth.signup.password_label')}</label>
                        <input type="password" id="signup-password" name="password" placeholder="${i18n.t('auth.signup.password_placeholder')}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="signup-password-confirm">${i18n.t('auth.signup.password_confirm_label')}</label>
                        <input type="password" id="signup-password-confirm" name="password_confirm" placeholder="${i18n.t('auth.signup.password_placeholder')}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn btn">${i18n.t('auth.signup.submit_button')}</button>
                </form>
                
                <button id="back-to-landing" class="back-btn btn">${i18n.t('auth.signup.back_button')}</button>
            </div>
        `;
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        const form = document.getElementById('signup-form');
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
        const passwordConfirm = formData.get('password_confirm');
        
        // Vérifier que les mots de passe correspondent
        if (password !== passwordConfirm) {
            alert('❌ Les mots de passe ne correspondent pas');
            return;
        }
        
        console.log('📝 Tentative d\'inscription:', email);
        await Auth.signup(email, password);
    }
};

