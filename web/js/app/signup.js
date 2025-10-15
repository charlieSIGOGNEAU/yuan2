import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { ServerConfig } from './config.js';
import { Auth } from './auth.js';

// Page d'inscription
export const SignupPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/signup.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/auth.css');
        this.setupEvents();
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

