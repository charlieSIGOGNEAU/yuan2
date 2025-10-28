import { ServerConfig } from './config.js';
import { Router } from './router.js';
import { WebSocketClient } from './websocket.js';
import { i18n } from '../core/i18n.js';
import { Auth } from './auth.js';

// Module de connexion Google
export const GoogleAuth = {
    googleInitialized: false,

    // Initialiser le SDK Google
    async initialize() {
        return new Promise((resolve, reject) => {
            // Vérifier si le script est déjà chargé
            if (window.google && window.google.accounts) {
                this.googleInitialized = true;
                console.log('✅ SDK Google déjà chargé');
                resolve();
                return;
            }

            // Charger le script Google Identity Services
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                this.googleInitialized = true;
                console.log('✅ SDK Google chargé');
                resolve();
            };
            
            script.onerror = () => {
                console.error('❌ Erreur lors du chargement du SDK Google');
                reject(new Error('Impossible de charger le SDK Google'));
            };
            
            document.head.appendChild(script);
        });
    },

    // Afficher le bouton de connexion Google
    async showLoginButton(buttonElement) {
        try {
            console.log('🔄 Début showLoginButton');
            
            // S'assurer que le SDK est initialisé
            if (!this.googleInitialized) {
                console.log('🔄 Initialisation du SDK Google');
                await this.initialize();
            }

            // Récupérer le GOOGLE_CLIENT_ID depuis l'API
            const clientId = await this.getClientId();
            console.log('🔄 GOOGLE_CLIENT_ID récupéré:', clientId);
            
            if (!clientId) {
                console.error('❌ GOOGLE_CLIENT_ID non disponible');
                alert('❌ Configuration Google non disponible');
                return;
            }

            // Initialiser Google Identity Services
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false,
                cancel_on_tap_outside: true
            });

            console.log('🔄 Google Identity Services initialisé, rendu du bouton...');

            // Afficher le bouton de connexion classique Google
            window.google.accounts.id.renderButton(
                buttonElement,
                {
                    type: 'standard',           // Type de bouton: 'standard' ou 'icon'
                    theme: 'outline',           // Thème: 'outline', 'filled_blue', 'filled_black'
                    size: 'large',              // Taille: 'large', 'medium', 'small'
                    text: 'signin_with',        // Texte: 'signin_with', 'signup_with', 'continue_with', 'signin'
                    shape: 'rectangular',       // Forme: 'rectangular', 'pill', 'circle', 'square'
                    logo_alignment: 'left',     // Position du logo: 'left', 'center'
                    width: 300                  // Largeur en pixels
                }
            );

            console.log('✅ Bouton Google classique configuré et affiché');
        } catch (error) {
            console.error('❌ Erreur lors de la configuration du bouton Google:', error);
            alert('❌ Erreur lors de la configuration de la connexion Google');
        }
    },

    // Déclencher la connexion Google avec popup
    async triggerLogin() {
        try {
            // S'assurer que le SDK est initialisé
            if (!this.googleInitialized) {
                console.log('🔄 Initialisation du SDK Google');
                await this.initialize();
            }

            // Récupérer le GOOGLE_CLIENT_ID depuis l'API
            const clientId = await this.getClientId();
            console.log('🔄 GOOGLE_CLIENT_ID récupéré:', clientId);
            
            if (!clientId) {
                console.error('❌ GOOGLE_CLIENT_ID non disponible');
                alert('❌ Configuration Google non disponible');
                return;
            }

            // Initialiser Google Identity Services
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: this.handleCredentialResponse.bind(this),
                auto_select: false
            });

            console.log('🔄 Google Identity Services initialisé');

            // Déclencher le prompt
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('🔔 Popup Google non affichée ou ignorée');
                }
            });
            console.log('🔄 Popup Google déclenché');

            console.log('✅ Connexion Google déclenchée');
        } catch (error) {
            console.error('❌ Erreur lors du déclenchement de la connexion Google:', error);
            alert('❌ Erreur lors de la connexion Google');
        }
    },

    // Gérer la réponse de Google
    async handleCredentialResponse(response) {
        console.log('🔐 Credential reçu de Google');
        
        try {
            // Récupérer la langue actuelle du navigateur
            const currentLanguage = i18n.getLanguage();
            console.log('🌍 Envoi de la langue pour le nouveau compte Google:', currentLanguage);
            
            // Envoyer le credential au backend
            const apiResponse = await fetch(`${ServerConfig.HTTP_BASE}auth/google_login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credential: response.credential,
                    language: currentLanguage
                })
            });

            const data = await apiResponse.json();

            if (data.success) {
                // Stocker le token et l'utilisateur dans Auth
                Auth.authToken = data.token;
                Auth.currentUser = data.user;
                console.log('✅ Connexion Google réussie:', Auth.currentUser.name);
                console.log('🌍 Langue utilisateur:', Auth.currentUser.language);

                // Charger la langue de l'utilisateur si différente de la langue actuelle
                if (Auth.currentUser.language && Auth.currentUser.language !== i18n.getLanguage()) {
                    console.log('🌍 Changement de langue vers:', Auth.currentUser.language);
                    await i18n.initialize(Auth.currentUser.language);
                }

                // Démarrer la connexion WebSocket après l'authentification
                await WebSocketClient.connect();

                // Naviguer vers le menu du jeu
                Router.navigateTo('game-menu');
            } else {
                console.error('❌ Erreur:', data.message);
                alert('❌ Erreur: ' + data.message);
            }
        } catch (error) {
            console.error('❌ Erreur lors de la connexion Google:', error);
            alert('❌ Erreur de connexion au serveur');
        }
    },

    // Récupérer le GOOGLE_CLIENT_ID depuis différentes sources
    async getClientId() {
        // Option 1: Depuis ServerConfig (recommandé pour le développement)
        if (ServerConfig.GOOGLE_CLIENT_ID) {
            console.log('✅ GOOGLE_CLIENT_ID récupéré depuis ServerConfig');
            return ServerConfig.GOOGLE_CLIENT_ID;
        }
        
        // Option 2: Récupérer depuis un endpoint API (plus sécurisé pour la production d'apres cursor, mais j'en doute. pour le momant non fonctionel)
        try {
            const response = await fetch(`${ServerConfig.HTTP_BASE}config/google_client_id`);
            const data = await response.json();
            if (data.client_id) {
                console.log('✅ GOOGLE_CLIENT_ID récupéré depuis l\'API');
                return data.client_id;
            }
        } catch (error) {
            console.warn('⚠️ Impossible de récupérer le GOOGLE_CLIENT_ID depuis l\'API:', error);
        }

        // Si aucune source n'est disponible
        console.error('❌ GOOGLE_CLIENT_ID non trouvé dans ServerConfig, window, ou API');
        return null;
    }
};

