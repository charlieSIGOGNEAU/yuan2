import { Router } from './router.js';
import { WebSocketClient } from './websocket.js';
import { i18n } from '../core/i18n.js';
import { ServerConfig } from './config.js';

// Module d'authentification simplifié
const AuthInstance = {
    currentUser: null,
    authToken: null,
    options: {
        fps: 20,
        resolutionScale: 1,
        shadowRealtime: true
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
                if (this.currentUser.fps != null) {
                    console.log('🎨 Chargement de la qualité graphique:', this.currentUser.fps);
                    Auth.options.fps = this.currentUser.fps;
                }
                if (this.currentUser.resolutionScale != null) {
                    console.log('🎨 Chargement de la résolution:', this.currentUser.resolutionScale);
                    Auth.options.resolutionScale = this.currentUser.resolutionScale;
                }
                if (this.currentUser.shadowRealtime != null) {
                    console.log('🎨 Chargement des ombres en temps réel:', this.currentUser.shadowRealtime);
                    Auth.options.shadowRealtime = this.currentUser.shadowRealtime;
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
        console.log('🔐 Auth.init() démarré');
        
        // Vérifier s'il y a une session sauvegardée (après un reset complet)
        const { SessionManager } = await import('./sessionManager.js');
        const savedSession = SessionManager.checkSavedSession();
        
        if (savedSession) {
            // Restaurer la session
            this.authToken = savedSession.token;
            this.currentUser = savedSession.user;
            
            console.log('🔄 Session restaurée:', this.currentUser.name);
            console.log('🔑 Token restauré:', this.authToken ? 'présent' : 'absent');
            console.log('👤 User restauré:', this.currentUser);
            
            // Charger la langue de l'utilisateur si différente de la langue actuelle
            if (this.currentUser.language && this.currentUser.language !== i18n.getLanguage()) {
                console.log('🌍 Changement de langue vers:', this.currentUser.language);
                await i18n.initialize(this.currentUser.language);
            }
            
            console.log('🔌 Connexion WebSocket...');
            await WebSocketClient.connect();
            console.log('✅ WebSocket connecté');
            
            // Naviguer vers la page demandée (généralement game-menu)
            console.log('🧭 Navigation vers:', savedSession.redirectTo);
            console.log('🧭 Router.pages disponibles:', Object.keys(Router.pages));
            Router.navigateTo(savedSession.redirectTo);
            console.log('✅ Navigation lancée');
        } else {
            // Pas de session sauvegardée, afficher la landing page
            console.log('🔐 Pas de session, navigation vers landing');
            Router.navigateTo('landing');
        }
    }
};

// Réutiliser l'instance existante si elle existe (pour survivre au HMR)
let Auth;
if (typeof window !== 'undefined' && window.Auth) {
    console.log('🔄 Réutilisation de l\'instance Auth existante');
    console.log('👤 User préservé:', window.Auth.currentUser?.name || 'aucun');
    console.log('🔑 Token préservé:', window.Auth.authToken ? 'présent' : 'absent');
    Auth = window.Auth;
} else {
    console.log('🆕 Création d\'une nouvelle instance Auth');
    Auth = AuthInstance;
    // Exposer Auth globalement
    if (typeof window !== 'undefined') {
        window.Auth = Auth;
    }
}

export { Auth };

// Support du HMR de Vite
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('🔥 Auth module rechargé par HMR, instance préservée');
    });
}