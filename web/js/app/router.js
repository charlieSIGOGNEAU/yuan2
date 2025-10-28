// Système de navigation avec gestion de l'historique du navigateur
export const Router = {
    currentPage: null,
    pages: {}, // Sera rempli par les modules de pages
    disableBack: false, // true pour empêcher le retour en arrière
    // Initialiser le router
    init() {
        this.disableBack = false;
        // Écouter les événements de navigation (bouton précédent/suivant)
        window.addEventListener('popstate', (e) => {
            if (Router.disableBack) {
                history.pushState(e.state, '', window.location.href); // reste sur la même page
                return;
            }
            if (e.state && e.state.page) {
                Router.showPage(e.state.page, e.state.data, false);
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

