import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';

// Page pour supprimer le compte
export const DeleteAccountPage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/delete-account.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        const form = document.getElementById('delete-account-form');
        form?.addEventListener('submit', this.handleSubmit.bind(this));

        // Bouton précédent
        document.getElementById('back-to-options')?.addEventListener('click', () => {
            Router.goBack();
        });
    },

    // Gestion de la soumission
    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const password = formData.get('password');
        
        // Double confirmation
        if (!confirm('⚠️ Êtes-vous vraiment sûr de vouloir supprimer votre compte ? Cette action est irréversible !')) {
            return;
        }
        
        console.log('🗑️ Suppression du compte demandée');
        // TODO: Implémenter la suppression du compte
        alert('Suppression du compte à implémenter');
    }
};

