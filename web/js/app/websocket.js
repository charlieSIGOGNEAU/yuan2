import { Auth } from './auth.js';
import { gameApi } from '../game_logic_yuan/gameApi.js';


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

        const wsUrl = `ws://localhost:3000/cable?token=${Auth.authToken}`;
        this.connection = new WebSocket(wsUrl);
        
        this.connection.onopen = () => {
            this.connectionStatus = 'connected';
            this.updateConnectionUI();
            this.subscribeToChannel();
        };

        this.connection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 🎯 AFFICHAGE SIMPLE DU JSON (sauf les pings automatiques)
            gameApi.handleGameMessage(data);
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
        const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'GameChannel' })
        };
        this.send(subscribeMessage);
    },

    // Envoyer un message
    send(data) {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
            return true;
        }
        return false;
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

    // Game channels
    subscribeToGameChannel(gameId) {
        if (this.gameSubscriptions.includes(gameId)) return;

        const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
        };
        
        if (this.send(subscribeMessage)) {
            this.gameSubscriptions.push(gameId);
        }
    },

    unsubscribeFromGameChannel(gameId) {
        if (!this.gameSubscriptions.includes(gameId)) return;

        const unsubscribeMessage = {
            command: 'unsubscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
        };
        
        if (this.send(unsubscribeMessage)) {
            this.gameSubscriptions = this.gameSubscriptions.filter(id => id !== gameId);
        }
    },

    // toggleGameChannel(gameId) {
    //     if (this.gameSubscriptions.includes(gameId)) {
    //         this.unsubscribeFromGameChannel(gameId);
    //     } else {
    //         this.subscribeToGameChannel(gameId);
    //     }
    // }
}; 