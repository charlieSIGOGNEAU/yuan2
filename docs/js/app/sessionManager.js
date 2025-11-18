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
                
                console.log('✅ Session sauvegardée dans sessionStorage');
                console.log('💾 Token:', Auth.authToken ? 'présent' : 'absent');
                console.log('💾 User:', Auth.currentUser.name);
                console.log('💾 Redirect:', 'game-menu');
                
                // Vérification immédiate
                console.log('🔍 Vérification immédiate:');
                console.log('  - Token:', sessionStorage.getItem(this.STORAGE_KEY_TOKEN) ? 'OK' : 'MANQUANT');
                console.log('  - User:', sessionStorage.getItem(this.STORAGE_KEY_USER) ? 'OK' : 'MANQUANT');
                
                console.log('🔄 Rechargement de la page...');
                
                // Recharger complètement la page (nettoie tout: Three.js, WebSocket, mémoire, etc.)
                window.location.href = window.location.origin;
            } else {
                console.error('❌ Aucune session active à sauvegarder');
                console.log('  - authToken:', Auth.authToken);
                console.log('  - currentUser:', Auth.currentUser);
                // Rediriger vers landing si pas de session
                window.location.href = window.location.origin;
            }
        });
    },

    /**
     * Vérifie s'il y a une session sauvegardée à restaurer
     * À appeler au démarrage de l'app
     * @returns {Object|null} { token, user, redirectTo } ou null
     */
    checkSavedSession() {
        console.log('🔍 Vérification de session sauvegardée...');
        const token = sessionStorage.getItem(this.STORAGE_KEY_TOKEN);
        const userJson = sessionStorage.getItem(this.STORAGE_KEY_USER);
        const redirectTo = sessionStorage.getItem(this.STORAGE_KEY_REDIRECT);
        
        console.log('🔍 Token trouvé:', token ? 'OUI' : 'NON');
        console.log('🔍 User trouvé:', userJson ? 'OUI' : 'NON');
        console.log('🔍 Redirect:', redirectTo);
        
        if (token && userJson) {
            try {
                const user = JSON.parse(userJson);
                
                // Nettoyer le storage (one-time use)
                sessionStorage.removeItem(this.STORAGE_KEY_TOKEN);
                sessionStorage.removeItem(this.STORAGE_KEY_USER);
                sessionStorage.removeItem(this.STORAGE_KEY_REDIRECT);
                
                console.log('✅ Session restaurée depuis sessionStorage');
                console.log('✅ User restauré:', user.name);
                
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
        
        console.log('❌ Aucune session sauvegardée trouvée');
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



