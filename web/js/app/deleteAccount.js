import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

// Page pour supprimer le compte
export const DeleteAccountPage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        return `
            <div class="delete-account-page">
                <h2 id="delete-account-title">${i18n.t('account.delete_account.title')}</h2>
                
                <div class="warning-message">
                    <p>${i18n.t('account.delete_account.warning')}</p>
                    <p>${i18n.t('account.delete_account.warning_details')}</p>
                </div>
                
                <form id="delete-account-form" class="settings-form">
                    <div class="form-group">
                        <label for="delete-password">${i18n.t('account.delete_account.password_label')}</label>
                        <input type="password" id="delete-password" name="password" placeholder="${i18n.t('account.delete_account.password_placeholder')}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn danger-btn btn">${i18n.t('account.delete_account.submit_button')}</button>
                </form>
                
                <button id="back-to-options" class="back-btn btn">${i18n.t('account.delete_account.back_button')}</button>
            </div>
        `;
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
        
        // Validation
        if (!password || password.trim() === '') {
            alert('❌ Veuillez entrer votre mot de passe');
            return;
        }
        
        // Double confirmation
        if (!confirm(i18n.t('account.delete_account.confirmation'))) {
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Suppression en cours...';
        
        try {
            console.log('🗑️ Suppression du compte demandée');
            
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/delete_account`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({ 
                    password: password 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`✅ ${i18n.t('account.delete_account.success')}`);
                console.log('✅ Compte supprimé');
                
                // Déconnecter l'utilisateur
                Auth.logout();
            } else {
                alert('❌ Erreur: ' + (data.message || i18n.t('account.delete_account.error')));
                console.error('❌ Erreur suppression du compte:', data.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Supprimer mon compte';
            }
        } catch (error) {
            console.error('❌ Erreur lors de la suppression du compte:', error);
            alert('❌ Erreur de connexion au serveur');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Supprimer mon compte';
        }
    }
};

