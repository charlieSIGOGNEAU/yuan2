// apres reconection automatique, il faudrais demander game_details pour verifier si il y aurai pas des changements

import { Auth } from './auth.js';
import { gameApi } from '../game_logic_yuan/gameApi.js';
import { ServerConfig } from './config.js';


// Client WebSocket simplifié
export const WebSocketClient = {
    connection: null,
    gameSubscriptions: [],
    connectionStatus: 'disconnected',

    async requestSyncLaravel() {
        try {
            const syncUrl = ServerConfig.HTTP_BASE.replace('/v1', '/v1/games/reconnect');
            await fetch(syncUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                }
            });
            console.log('🔄 Requête de synchronisation envoyée');
        } catch (error) {
            console.error('❌ Erreur lors de la demande de synchro:', error);
        }
    },


    // Connexion WebSocket
    async connect() {
        if (!Auth.authToken) return;

        this.connectionStatus = 'connecting';
        this.updateConnectionUI();

        let wsUrl;
        if (ServerConfig.TYPE === 'laravel') {
            wsUrl = `${ServerConfig.WS_URL}?protocol=7&client=js&version=8.4.0&flash=false`;
        } else {
            wsUrl = `${ServerConfig.WS_URL}?token=${Auth.authToken}`;
        }

        this.connection = new WebSocket(wsUrl);

        this.connection.onopen = () => {
            this.connectionStatus = 'connected';
            this.updateConnectionUI();

            // Pour Rails, on s'abonne tout de suite
            if (ServerConfig.TYPE === 'rails') {
                this.subscribeToChannel();
            }
            // Pour Laravel, on attend l'événement pusher:connection_established qui donne le socket_id
        };

        this.connection.onmessage = (event) => {
            let rawData = JSON.parse(event.data);

            if (ServerConfig.TYPE === 'laravel') {
                // Gérer le ping
                if (rawData.event === "pusher:ping") {
                    this.connection.send(JSON.stringify({ event: "pusher:pong" }));
                    return;
                }

                // Gérer la confirmation d'abonnement réussie
                if (rawData.event === 'pusher_internal:subscription_succeeded') {
                    const channel = rawData.channel;
                    if (channel.startsWith('private-user_')) {
                        console.log('✅ Abonnement confirmé, demande de synchronisation...');
                        this.requestSyncLaravel(); // <--- APPEL ICI
                    }
                    return;
                }

                // Gérer la connexion établie (Reverb/Pusher)
                if (rawData.event === 'pusher:connection_established') {
                    const data = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;
                    this.socketId = data.socket_id;
                    console.log('🔌 Connecté à Reverb avec socket_id:', this.socketId);
                    this.subscribeToChannel();
                    return;
                }

                // Si c'est un message de ton canal, on extrait le contenu
                if (rawData.event === 'message') { // 'message' est défini dans ton broadcastAs()
                    // Reverb envoie parfois le champ data comme une String JSON
                    const payload = typeof rawData.data === 'string' ? JSON.parse(rawData.data) : rawData.data;
                    // On adapte le format pour matcher celui de Rails (attendu par gameApi)
                    // Rails envoie { message: { ... } }, Laravel envoie { data: { ... }, userId: ... }
                    gameApi.handleGameMessage({ message: payload.data });
                    return;
                }
            }

            // Comportement Rails par défaut ou message brut
            gameApi.handleGameMessage(rawData);
        };

        this.connection.onclose = () => {
            this.connectionStatus = 'disconnected';
            this.socketId = null;

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
                // Pour Laravel, il faut aussi avoir le socketId
                const isReady = this.connection && this.connection.readyState === WebSocket.OPEN &&
                    (ServerConfig.TYPE !== 'laravel' || this.socketId);

                if (isReady) {
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
    async subscribeToUserChannelLaravel(userId) {
        if (!this.socketId) {
            console.error('❌ Impossible de s\'abonner : pas de socket_id');
            return;
        }

        const channelName = `private-user_${userId}`;
        console.log(`🔑 Authentification du canal ${channelName}...`);

        try {
            // URL d'auth : on remonte d'un niveau par rapport à /api/v1 pour aller à /api/broadcasting/auth
            const authUrl = ServerConfig.HTTP_BASE.replace('/v1', '/broadcasting/auth');

            const response = await fetch(authUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    socket_id: this.socketId,
                    channel_name: channelName
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur auth broadcast: ${response.statusText}`);
            }

            const authData = await response.json();
            console.log('✅ Signature reçue:', authData);

            const subscribeMessage = {
                event: 'pusher:subscribe',
                data: {
                    auth: authData.auth,
                    channel: channelName
                }
            };
            this.sendLaravel(subscribeMessage);
            console.log(`👤 Abonnement au canal utilisateur: ${channelName}`);

        } catch (error) {
            console.error('❌ Erreur authentification canal:', error);
        }
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