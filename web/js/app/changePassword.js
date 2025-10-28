import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

// Page pour changer de mot de passe
export const ChangePasswordPage = {
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
            <div class="change-password-page">
                <h2 id="change-password-title">${i18n.t('account.change_password.title')}</h2>
                
                <form id="change-password-form" class="settings-form">
                    <div class="form-group">
                        <label for="current-password">${i18n.t('account.change_password.current_password_label')}</label>
                        <input type="password" id="current-password" name="current_password" placeholder="${i18n.t('account.change_password.password_placeholder')}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="new-password">${i18n.t('account.change_password.new_password_label')}</label>
                        <input type="password" id="new-password" name="new_password" placeholder="${i18n.t('account.change_password.password_placeholder')}" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm-new-password">${i18n.t('account.change_password.confirm_password_label')}</label>
                        <input type="password" id="confirm-new-password" name="confirm_password" placeholder="${i18n.t('account.change_password.password_placeholder')}" required minlength="6">
                    </div>
                    
                    <button type="submit" class="submit-btn btn">${i18n.t('account.change_password.submit_button')}</button>
                </form>
                
                <button id="back-to-options" class="back-btn btn">${i18n.t('account.change_password.back_button')}</button>
            </div>
        `;
    },

    // Configurer les événements
    setupEvents() {
        // Soumission du formulaire
        const form = document.getElementById('change-password-form');
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
        const currentPassword = formData.get('current_password');
        const newPassword = formData.get('new_password');
        const confirmPassword = formData.get('confirm_password');
        
        // Validation
        if (!currentPassword || currentPassword.trim() === '') {
            alert('❌ Veuillez entrer votre mot de passe actuel');
            return;
        }
        
        if (!newPassword || newPassword.trim() === '') {
            alert('❌ Veuillez entrer un nouveau mot de passe');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('❌ Le nouveau mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('❌ Les mots de passe ne correspondent pas');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Changement en cours...';
        
        try {
            console.log('🔑 Changement de mot de passe demandé');
            
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/change_password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({ 
                    current_password: currentPassword,
                    new_password: newPassword 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert(`✅ ${i18n.t('account.change_password.success')}`);
                console.log('✅ Mot de passe changé');
                
                // Retourner aux options
                Router.navigateTo('options');
            } else {
                alert('❌ Erreur: ' + (data.message || i18n.t('account.change_password.error')));
                console.error('❌ Erreur changement de mot de passe:', data.message);
            }
        } catch (error) {
            console.error('❌ Erreur lors du changement de mot de passe:', error);
            alert('❌ Erreur de connexion au serveur');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmer';
        }
    }
};

