// apres reconection automatique, il faudrais demander game_details pour verifier si il y aurai pas des changements

import { Auth } from './auth.js';
import { gameApi } from '../game_logic_yuan/gameApi.js';
import { ServerConfig } from './config.js';


// Client WebSocket simplifié
export const WebSocketClient = {
    connection: null,
    gameSubscriptions: [],
    connectionStatus: 'disconnected',
    
    // Connexion WebSocket
    async connect() {
        if (!Auth.authToken) return;

        this.connectionStatus = 'connecting';
        this.updateConnectionUI();

        const wsUrl = `${ServerConfig.WS_URL}?token=${Auth.authToken}`;
        this.connection = new WebSocket(wsUrl);
        
        this.connection.onopen = () => {
            this.connectionStatus = 'connected';
            this.updateConnectionUI();
            this.subscribeToChannel();
        };

        this.connection.onmessage = (event) => {
            let rawData = JSON.parse(event.data);
            
            if (ServerConfig.TYPE === 'laravel') {
                // Gérer le ping
                if (rawData.event === "pusher:ping") {
                    this.connection.send(JSON.stringify({ event: "pusher:pong" }));
                    return;
                }
        
                // Si c'est un message de ton canal, on extrait le contenu
                if (rawData.event === 'message') { // 'message' est défini dans ton broadcastAs()
                    // Reverb envoie parfois le champ data comme une String JSON
                    const data = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;
                    gameApi.handleGameMessage(data);
                    return;
                }
            }
        
            // Comportement Rails par défaut ou message brut
            gameApi.handleGameMessage(rawData);
        };

        this.connection.onclose = () => {
            this.connectionStatus = 'disconnected';
            
            // Sauvegarder les channels avant reconnexion
            const channelsToRestore = [...this.gameSubscriptions];
            this.gameSubscriptions = []; // Reset
            
            this.updateConnectionUI();
            
            // Reconnexion avec attente vraie
            setTimeout(async () => {
                await this.connect();
                
                // Attendre que la connexion soit vraiment prête
                if (channelsToRestore.length > 0) {
                    await this.waitForConnectionAndRestore(channelsToRestore);
                }
            }, 2000);
        };
    },

    // Fonction qui attend la connexion puis restaure les channels
    async waitForConnectionAndRestore(channelsToRestore) {
        console.log('⏳ Attente connexion pour restaurer:', channelsToRestore);
        
        // Attendre que la connexion soit vraiment ouverte
        return new Promise((resolve) => {
            const checkConnection = () => {
                if (this.connection && this.connection.readyState === WebSocket.OPEN) {
                    console.log('✅ Connexion établie, restauration des channels...');
                    
                    // Restaurer les channels
                    channelsToRestore.forEach(gameId => {
                        console.log(`🔄 Restauration channel game ${gameId}`);
                        this.subscribeToGameChannel(gameId);
                    });
                    
                    resolve();
                } else {
                    // Réessayer dans 100ms
                    setTimeout(checkConnection, 100);
                }
            };
            
            checkConnection();
        });
    },

    // S'abonner au channel personel
    subscribeToChannel() {
        // S'abonner seulement au canal utilisateur personnel (évite la duplication)
        if (Auth.currentUser && Auth.currentUser.id) {
            if (ServerConfig.TYPE === 'rails') {
                this.subscribeToUserChannelRails(Auth.currentUser.id);
            } else if (ServerConfig.TYPE === 'laravel') {
                this.subscribeToUserChannelLaravel(Auth.currentUser.id);
            }
        }
    },
    subscribeToUserChannelLaravel(userId) {
        const subscribeMessage = {
            event: 'pusher:subscribe', // Reverb attend 'event', pas 'command'
            data: {
                channel: `private-user_${userId}` // 'private-' est obligatoire pour les canaux sécurisés
            }
        };
        this.sendLaravel(subscribeMessage);
        console.log(`👤 Abonnement au canal utilisateur: private-user_${userId}`);
    },

    // S'abonner au canal utilisateur personnel
    subscribeToUserChannelRails(userId) {
        const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'UserChannel', user_id: userId })
        };
        this.sendRails(subscribeMessage);
        console.log(`👤 Abonnement au canal utilisateur: user_${userId}`);
    },

    // Envoyer un message
    sendRails(data) {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
            return true;
        }
        return false;
    },
    sendLaravel(data) {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
        }
    },

    // Déconnexion
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
        this.connectionStatus = 'disconnected';
        this.updateConnectionUI();
    },

    // Interface utilisateur
    updateConnectionUI() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = this.connectionStatus;
            statusElement.className = `connection-status ${this.connectionStatus}`;
        }
    },

    // Notification simple
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.textContent = message;
        Object.assign(notification.style, {
            position: 'fixed', top: '20px', right: '20px', padding: '10px',
            borderRadius: '5px', color: 'white', zIndex: '1000',
            backgroundColor: type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'
        });
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    },


}; 