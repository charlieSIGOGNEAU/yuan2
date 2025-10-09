import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';

// Page de connexion par email
export const EmailLoginPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/email-login.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/auth.css');
        this.setupEvents();
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

