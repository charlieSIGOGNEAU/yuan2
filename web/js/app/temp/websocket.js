

const WebSocketClient = {
    connection: null,
    gameSubscriptions: [],
    connectionStatus: 'disconnected',

    // Connexion WebSocket
    async connect() {
        if (!Auth.authToken) return;

        this.connectionStatus = 'connecting';

        const wsUrl = `ws://localhost:3000/cable?token=${Auth.authToken}`;
        this.connection = new WebSocket(wsUrl);

        this.connection.onopen = () => {
            this.connectionStatus = 'connected';
        }

        // afficher en console ce que envois le serveur
        this.connection.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('📨 Message reçu:', data);
        };

        // si la connexion est fermée, on se reconnecte
        this.connection.onclose = () => {
            this.connectionStatus = 'disconnected';
            setTimeout(() => this.connect(), 2000); 
        };
    },
    // Envoyer un message
    send(data) {
        if (this.connection && this.connection.readyState === WebSocket.OPEN) {
            this.connection.send(JSON.stringify(data));
            return true;
        }
        return false;
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
        if (!this.gameSubscriptions.has(gameId)) return;

        const unsubscribeMessage = {
            command: 'unsubscribe',
            identifier: JSON.stringify({ channel: 'GameChannel', game_id: gameId })
        };
        
        if (this.send(unsubscribeMessage)) {
            this.gameSubscriptions = this.gameSubscriptions.filter(id => id !== gameId);

        }
    },
}