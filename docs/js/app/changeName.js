import { loadCSS } from '../simple.js';
import { Router } from './router.js';
import { Auth } from './auth.js';
import { ServerConfig } from './config.js';
import { i18n } from '../core/i18n.js';

// Page pour changer de nom
export const ChangeNamePage = {
    // Afficher la page
    async show(data = {}) {
        const html = this.renderHTML();
        document.getElementById('app').innerHTML = html;
        loadCSS('css/options.css');
        this.setupEvents();
    },

    // Générer le HTML avec les traductions
    renderHTML() {
        const currentName = Auth.currentUser?.name || '';
        return `
            <div class="change-name-page">
                <h2 id="change-name-title">${i18n.t('account.change_name.title')}</h2>
                
                <form id="change-name-form" class="settings-form">
                    <div class="form-group">
                        <label for="current-name">${i18n.t('account.change_name.current_name_label')}</label>
                        <input type="text" id="current-name" name="current_name" value="${currentName}" readonly>
                    </div>
                    
                    <div class="form-group">
                        <label for="new-name">${i18n.t('account.change_name.new_name_label')}</label>
                        <input type="text" id="new-name" name="new_name" placeholder="${i18n.t('account.change_name.new_name_placeholder')}" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm-password">${i18n.t('account.change_name.password_label')}</label>
                        <input type="password" id="confirm-password" name="password" placeholder="${i18n.t('account.change_name.password_placeholder')}" required>
                    </div>
                    
                    <button type="submit" class="submit-btn btn">${i18n.t('account.change_name.submit_button')}</button>
                </form>
                
                <button id="back-to-options" class="back-btn btn">${i18n.t('account.change_name.back_button')}</button>
            </div>
        `;
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
        
        // Validation
        if (!newName || newName.trim() === '') {
            alert('❌ Veuillez entrer un nouveau nom');
            return;
        }
        
        if (!password || password.trim() === '') {
            alert('❌ Veuillez entrer votre mot de passe');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Changement en cours...';
        
        try {
            console.log('✏️ Changement de nom vers:', newName);
            
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/change_name`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({ 
                    new_name: newName,
                    password: password 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Mettre à jour le nom localement
                Auth.currentUser.name = newName;
                
                alert(`✅ ${i18n.t('account.change_name.success')}`);
                console.log('✅ Nom changé:', newName);
                
                // Retourner aux options
                Router.navigateTo('options');
            } else {
                alert('❌ Erreur: ' + (data.message || i18n.t('account.change_name.error')));
                console.error('❌ Erreur changement de nom:', data.message);
            }
        } catch (error) {
            console.error('❌ Erreur lors du changement de nom:', error);
            alert('❌ Erreur de connexion au serveur');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Confirmer';
        }
    }
};

