// Fonctions pour l'API
const gameApi = {
    // Futures fonctions pour envoyer à l'API
    handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        } 
    } 
};

// Fonction pour recevoir les données WebSocket
