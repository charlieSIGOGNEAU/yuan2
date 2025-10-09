// Système de navigation avec gestion de l'historique du navigateur
export const Router = {
    currentPage: null,
    pages: {}, // Sera rempli par les modules de pages
    
    // Initialiser le router
    init() {
        // Écouter les événements de navigation (bouton précédent/suivant)
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, e.state.data, false); // false = ne pas ajouter à l'historique
            }
        });
    },
    
    // Enregistrer une page
    registerPage(name, pageModule) {
        this.pages[name] = pageModule;
    },
    
    // Naviguer vers une page
    async navigateTo(pageName, data = {}, addToHistory = true) {
        if (!this.pages[pageName]) {
            console.error(`❌ Page non trouvée: ${pageName}`);
            return;
        }
        
        // Ajouter à l'historique du navigateur
        if (addToHistory) {
            history.pushState(
                { page: pageName, data: data },
                '',
                `#${pageName}`
            );
        }
        
        // Afficher la page
        await this.showPage(pageName, data, false);
    },
    
    // Afficher une page (utilisé en interne)
    async showPage(pageName, data = {}, addToHistory = true) {
        if (!this.pages[pageName]) {
            console.error(`❌ Page non trouvée: ${pageName}`);
            return;
        }
        
        this.currentPage = pageName;
        await this.pages[pageName].show(data);
    },
    
    // Retour en arrière
    goBack() {
        history.back();
    }
};

