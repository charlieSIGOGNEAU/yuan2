// Client WebSocket simplifié
const WebSocketClient = {
    connection: null,
    gameSubscriptions: new Map(),
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
            
            // 🎯 AFFICHAGE SIMPLE DU JSON
            if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
                console.log('📨 Message reçu:', data);
            }
            
            this.handleMessage(data);
        };

        this.connection.onclose = () => {
            this.connectionStatus = 'disconnected';
            this.updateConnectionUI();
            setTimeout(() => this.connect(), 2000); // Reconnexion simple
        };
    },

    // S'abonner au channel principal
    subscribeToChannel() {
        const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'GameChannel' })
        };
        this.send(subscribeMessage);
    },

    // Gérer les messages
    handleMessage(data) {
        if (data.message) {
            // 🎯 AFFICHAGE SIMPLE DU MESSAGE
            console.log('💬 Message:', data.message);
        }
    },

    // Envoyer un message
    send(data) {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
            return true;
        }
        return false;
    },

    // Ping simple
    ping() {
        const pingMessage = {
            command: 'message',
            identifier: JSON.stringify({ channel: 'GameChannel' }),
            data: JSON.stringify({ action: 'ping', timestamp: Date.now() })
        };
        return this.send(pingMessage);
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

    // Message de test
    sendTestMessage(message) {
        const messageData = {
            command: 'message',
            identifier: JSON.stringify({ channel: 'GameChannel' }),
            data: JSON.stringify({ action: 'send_message', message: message })
        };
        return this.send(messageData);
    },

    // Game channels
    subscribeToGameChannel(gameId) {
        if (this.gameSubscriptions.has(gameId)) return;

        const subscribeMessage = {
            command: 'subscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
        };
        
        if (this.send(subscribeMessage)) {
            this.gameSubscriptions.set(gameId, true);
            this.updateGameChannelUI(gameId, true);
        }
    },

    unsubscribeFromGameChannel(gameId) {
        if (!this.gameSubscriptions.has(gameId)) return;

        const unsubscribeMessage = {
            command: 'unsubscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
        };
        
        if (this.send(unsubscribeMessage)) {
            this.gameSubscriptions.delete(gameId);
            this.updateGameChannelUI(gameId, false);
        }
    },

    toggleGameChannel(gameId) {
        if (this.gameSubscriptions.has(gameId)) {
            this.unsubscribeFromGameChannel(gameId);
        } else {
            this.subscribeToGameChannel(gameId);
        }
    },

    updateGameChannelUI(gameId, isSubscribed) {
        const button = document.getElementById(`game-${gameId}-btn`);
        if (button) {
            if (isSubscribed) {
                button.classList.add('subscribed');
                button.textContent = `✅ Game ${gameId}`;
            } else {
                button.classList.remove('subscribed');
                const icons = { 1: '🎲', 2: '🎯', 3: '🃏' };
                button.textContent = `${icons[gameId] || '🎮'} Game ${gameId}`;
            }
        }
    }
}; 