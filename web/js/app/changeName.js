import { loadPartial, loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';

// Page pour changer de nom
export const ChangeNamePage = {
    // Afficher la page
    async show(data = {}) {
        const html = await loadPartial('partials/change-name.html');
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        
        // Pré-remplir le nom actuel
        document.getElementById('current-name').value = Auth.currentUser?.name || '';
        
        this.setupEvents();
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        const form = document.getElementById('change-name-form');
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
        const newName = formData.get('new_name');
        const password = formData.get('password');
        
        console.log('✏️ Changement de nom vers:', newName);
        // TODO: Implémenter le changement de nom
        alert(`Changement de nom vers "${newName}" à implémenter`);
    }
};

