// Gestionnaire de session pour reset complet de l'application
// Garde uniquement le token et la langue, puis recharge tout

export const SessionManager = {
    STORAGE_KEY_TOKEN: 'yuan_auth_token',
    STORAGE_KEY_USER: 'yuan_user_data',
    STORAGE_KEY_REDIRECT: 'yuan_redirect_to',

    /**
     * Reset complet de l'application en gardant l'authentification
     * Sauvegarde token + user, puis recharge la page complètement
     * Utilisé pour: quitter une partie, retour menu après victoire, etc.
     */
    resetToGameMenu() {
        console.log('🔄 Reset complet de l\'application...');
        
        // Importer Auth dynamiquement pour éviter la dépendance circulaire
        import('./auth.js').then(({ Auth }) => {
            if (Auth.authToken && Auth.currentUser) {
                // Sauvegarder les données d'authentification
                sessionStorage.setItem(this.STORAGE_KEY_TOKEN, Auth.authToken);
                sessionStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(Auth.currentUser));
                sessionStorage.setItem(this.STORAGE_KEY_REDIRECT, 'game-menu');
                
                console.log('✅ Session sauvegardée, rechargement...');
                
                // Recharger complètement la page (nettoie tout: Three.js, WebSocket, mémoire, etc.)
                window.location.href = '/';
            } else {
                console.error('❌ Aucune session active à sauvegarder');
                // Rediriger vers landing si pas de session
                window.location.href = '/';
            }
        });
    },

    /**
     * Vérifie s'il y a une session sauvegardée à restaurer
     * À appeler au démarrage de l'app
     * @returns {Object|null} { token, user, redirectTo } ou null
     */
    checkSavedSession() {
        const token = sessionStorage.getItem(this.STORAGE_KEY_TOKEN);
        const userJson = sessionStorage.getItem(this.STORAGE_KEY_USER);
        const redirectTo = sessionStorage.getItem(this.STORAGE_KEY_REDIRECT);
        
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                
                // Nettoyer le storage (one-time use)
                sessionStorage.removeItem(this.STORAGE_KEY_TOKEN);
                sessionStorage.removeItem(this.STORAGE_KEY_USER);
                sessionStorage.removeItem(this.STORAGE_KEY_REDIRECT);
                
                console.log('✅ Session restaurée depuis sessionStorage');
                
                return {
                    token,
                    user,
                    redirectTo: redirectTo || 'game-menu'
                };
            } catch (e) {
                console.error('❌ Erreur lors de la restauration de session:', e);
                this.clearSavedSession();
                return null;
            }
        }
        
        return null;
    },

    /**
     * Nettoie toutes les données de session sauvegardées
     */
    clearSavedSession() {
        sessionStorage.removeItem(this.STORAGE_KEY_TOKEN);
        sessionStorage.removeItem(this.STORAGE_KEY_USER);
        sessionStorage.removeItem(this.STORAGE_KEY_REDIRECT);
    }
};



