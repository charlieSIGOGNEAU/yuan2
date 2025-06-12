// Fonctions pour l'API
export const gameApi = {
    // Futures fonctions pour envoyer à l'API
    handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        } 
        // if (data.type === 'game_state' && data.game.game_status === 'installation') {
    } 
};

// Fonction pour recevoir les données WebSocket
