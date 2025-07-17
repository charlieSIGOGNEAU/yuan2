// Gestionnaire de l'interface utilisateur
export class UIManager {
    constructor() {
        this.gameUI = null;
        this.infoPanel = null;
    }

    // Charger l'interface UI du jeu
    async loadGameUI() {
        try {
            // Charger le HTML de l'interface
            const response = await fetch('./partials/game-ui.html');
            const htmlContent = await response.text();
            
            // Injecter l'interface dans le body
            const uiContainer = document.createElement('div');
            uiContainer.innerHTML = htmlContent;
            document.body.appendChild(uiContainer.firstElementChild);
            
            // Charger le CSS de l'interface
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './css/game-ui.css';
            document.head.appendChild(link);
            
            // Références vers les éléments UI
            this.gameUI = document.getElementById('game-ui-overlay');
            this.infoPanel = document.getElementById('info-panel');
            
            // Vérifier que l'interface est bien présente
            if (this.gameUI) {
                console.log('🎨 Interface UI trouvée dans le DOM');
                console.log('📏 Dimensions overlay:', this.gameUI.offsetWidth, 'x', this.gameUI.offsetHeight);
                
                if (this.infoPanel) {
                    console.log('ℹ️ Panneau info trouvé');
                    console.log('📝 Contenu panneau:', this.infoPanel.textContent);
                } else {
                    console.error('❌ Panneau info non trouvé');
                }
            } else {
                console.error('❌ Interface UI non trouvée dans le DOM');
            }
            
            // Configuration des event listeners
            this.setupUIEventListeners();
            
            console.log('🎨 Interface UI chargée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
        }
    }

    // Configuration des event listeners pour l'UI
    setupUIEventListeners() {
        // Pas d'event listeners pour le moment
        // Ici on pourra ajouter les listeners pour les futurs éléments UI
    }

    // Fonction pour mettre à jour le panneau d'informations
    updateInfoPanel(text) {
        if (this.infoPanel) {
            this.infoPanel.textContent = text || '';
        } else {
            console.warn('⚠️ Panneau d\'informations non initialisé');
        }
    }

    // Fonction pour masquer le panneau d'informations
    hideInfoPanel() {
        this.updateInfoPanel('');
    }

    // Fonction pour afficher un message temporaire
    showTemporaryMessage(text, duration = 3000) {
        this.updateInfoPanel(text);
        
        if (duration > 0) {
            setTimeout(() => {
                this.hideInfoPanel();
            }, duration);
        }
    }
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager(); 