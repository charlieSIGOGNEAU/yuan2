import { Router } from './router.js';
import { WebSocketClient } from './websocket.js';
import { i18n } from '../core/i18n.js';
import { ServerConfig } from './config.js';

// Module d'authentification simplifié
export const Auth = {
    currentUser: null,
    authToken: null,

    // Connexion (ancienne méthode - gardée pour compatibilité)
    async login(name) {
        try {
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                console.log('✅ Connexion réussie:', this.currentUser.name);
                console.log('🌍 Langue utilisateur:', this.currentUser.language);
                
                // Initialiser le système de traductions avec la langue de l'utilisateur
                await i18n.initialize(this.currentUser.language);
                
                // Démarrer la connexion WebSocket après l'authentification
                await WebSocketClient.connect();
                
                // Naviguer vers le menu du jeu
                Router.navigateTo('game-menu');
            } else {
                alert('❌ Erreur: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            alert('❌ Erreur de connexion au serveur');
        }
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
                console.log('✅ Connexion réussie:', this.currentUser.name);
                
                await i18n.initialize(this.currentUser.language);
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
            const response = await fetch(`${ServerConfig.HTTP_BASE}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.authToken = data.token;
                this.currentUser = data.user;
                console.log('✅ Inscription réussie:', this.currentUser.name);
                
                await i18n.initialize(this.currentUser.language);
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
            
            // Initialiser i18n et WebSocket
            await i18n.initialize(this.currentUser.language);
            await WebSocketClient.connect();
            
            // Naviguer vers la page demandée (généralement game-menu)
            Router.navigateTo(savedSession.redirectTo);
        } else {
            // Pas de session sauvegardée, afficher la landing page
            Router.navigateTo('landing');
        }
    }
}; 