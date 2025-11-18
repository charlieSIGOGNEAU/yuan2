// Système de navigation avec gestion de l'historique du navigateur
const RouterInstance = {
    currentPage: null,
    pages: {}, // Sera rempli par les modules de pages
    disableBack: false, // true pour empêcher le retour en arrière
    // Initialiser le router
    init() {
        console.log('🔧 Router.init() appelé, pages disponibles:', Object.keys(this.pages));
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
            console.error(`❌ Pages enregistrées: ${Object.keys(this.pages).join(', ')}`);
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

// Réutiliser l'instance existante si elle existe (pour survivre au HMR)
let Router;
if (typeof window !== 'undefined' && window.Router) {
    console.log('🔄 Réutilisation de l\'instance Router existante');
    console.log('💾 Pages préservées:', Object.keys(window.Router.pages).length);
    Router = window.Router;
} else {
    console.log('🆕 Création d\'une nouvelle instance Router');
    Router = RouterInstance;
    // Exposer Router globalement
    if (typeof window !== 'undefined') {
        window.Router = Router;
        console.log('🌐 Router exposé globalement via window.Router');
    }
}

export { Router };

// Support du HMR de Vite
if (import.meta.hot) {
    import.meta.hot.accept(() => {
        console.log('🔥 Router module rechargé par HMR, instance préservée');
    });
}

