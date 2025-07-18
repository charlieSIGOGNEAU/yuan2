import { LoginPage } from './login.js';
import { MenuPage } from './menu.js';
import { WebSocketClient } from './websocket.js';
import { i18n } from '../core/i18n.js';

// Module d'authentification simplifié
export const Auth = {
    currentUser: null,
    authToken: null,

    // Connexion
    async login(name) {
        try {
            const response = await fetch('http://localhost:3000/api/v1/auth/login', {
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
                
                // Démarrer la connexion WebSocket après l'authentification, connect() est une methode de WebSocket.js
                await WebSocketClient.connect();
                
                MenuPage.show();
            } else {
                alert('❌ Erreur: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Erreur connexion:', error);
            alert('❌ Erreur de connexion au serveur');
        }
    },

    // Déconnexion
    logout() {
        // Fermer la connexion WebSocket
        WebSocketClient.disconnect();
        
        this.authToken = null;
        this.currentUser = null;
        LoginPage.show();
    },

    // Initialisation : afficher la page de login
    init() {
        LoginPage.show();
    }
}; 