// Service API pour les appels HTTP
const ApiService = {
    baseUrl: 'http://localhost:3000/api/v1',

    // Méthode générique pour les appels API
    async call(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': Auth.authToken ? `Bearer ${Auth.authToken}` : ''
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, finalOptions);
            const data = await response.json();
            return { success: response.ok, data, status: response.status };
        } catch (error) {
            console.error('❌ Erreur API:', error);
            return { success: false, error: error.message };
        }
    },

    // Partie rapide
    async quickGame() {
        return this.call('/games/quick_game', {
            method: 'POST'
        });
    }
}; 