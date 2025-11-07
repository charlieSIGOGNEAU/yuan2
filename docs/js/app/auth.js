import { Router } from './router.js';
import { WebSocketClient } from './websocket.js';
import { i18n } from '../core/i18n.js';
import { ServerConfig } from './config.js';

// Module d'authentification simplifié
export const Auth = {
    currentUser: null,
    authToken: null,
    options: {
        fps: 20
    },

    // Connexion avec email/password
    async loginWithEmail(email, password) {
        try {
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/login_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                console.log('✅ Connexion réussie:', this.currentUser);
                
                // Charger la langue de l'utilisateur si différente de la langue actuelle
                if (this.currentUser.language && this.currentUser.language !== i18n.getLanguage()) {
                    console.log('🌍 Changement de langue vers:', this.currentUser.language);
                    await i18n.initialize(this.currentUser.language);
                }
                if (this.currentUser.fps && this.currentUser.fps !== Auth.options.fps) {
                    console.log('🎨 Changement de qualité graphique vers:', this.currentUser.fps);
                    Auth.options.fps = this.currentUser.fps;
                }
                
                await WebSocketClient.connect();
                
                Router.navigateTo('game-menu');
            } else {
                alert('❌ Erreur: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            alert('❌ Erreur de connexion au serveur');
        }
    },

    // Inscription
    async signup(email, password) {
        try {
            // Récupérer la langue actuelle du navigateur
            const currentLanguage = i18n.getLanguage();
            console.log('🌍 Envoi de la langue pour le nouveau compte:', currentLanguage);
            
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email, 
                    password,
                    language: currentLanguage
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                console.log('✅ Inscription réussie:', this.currentUser.name);
                console.log('✅ Langue enregistrée:', this.currentUser.language);
                
                // Charger la langue de l'utilisateur si différente de la langue actuelle
                if (this.currentUser.language && this.currentUser.language !== i18n.getLanguage()) {
                    console.log('🌍 Changement de langue vers:', this.currentUser.language);
                    await i18n.initialize(this.currentUser.language);
                }
                
                await WebSocketClient.connect();
                
                Router.navigateTo('game-menu');
            } else {
                alert('❌ Erreur: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            alert('❌ Erreur lors de l\'inscription');
        }
    },

    // Déconnexion
    logout() {
        // Fermer la connexion WebSocket
        WebSocketClient.disconnect();
        
        this.authToken = null;
        this.currentUser = null;
        
        // Retourner à la landing page
        Router.navigateTo('landing');
    },

    // Initialisation : vérifier si session sauvegardée, sinon landing page
    async init() {
        // Vérifier s'il y a une session sauvegardée (après un reset complet)
        const { SessionManager } = await import('./sessionManager.js');
        const savedSession = SessionManager.checkSavedSession();
        
        if (savedSession) {
            // Restaurer la session
            this.authToken = savedSession.token;
            this.currentUser = savedSession.user;
            
            console.log('🔄 Session restaurée:', this.currentUser.name);
            
            // Charger la langue de l'utilisateur si différente de la langue actuelle
            if (this.currentUser.language && this.currentUser.language !== i18n.getLanguage()) {
                console.log('🌍 Changement de langue vers:', this.currentUser.language);
                await i18n.initialize(this.currentUser.language);
            }
            
            await WebSocketClient.connect();
            
            // Naviguer vers la page demandée (généralement game-menu)
            Router.navigateTo(savedSession.redirectTo);
        } else {
            // Pas de session sauvegardée, afficher la landing page
            Router.navigateTo('landing');
        }
    }
}; 

// pour debug
window.Auth = Auth;