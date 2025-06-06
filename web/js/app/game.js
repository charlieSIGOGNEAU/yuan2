// Module de gestion des jeux
const Game = {
    // Démarrer une partie rapide
    async startQuickGame() {
        const response = await fetch('http://localhost:3000/api/v1/games/quick_game', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            WebSocketClient.subscribeToGameChannel(data.game_id);
        }
    }
}; 