// Gestionnaire de l'interface utilisateur
export class UIManager {
    constructor() {
        this.gameUI = null;
        this.infoPanel = null;
        this.playerActionBar = null;
        this.validationBar = null;
        this.biddingBar = null;
        this.currentActionBar = null; // Référence vers la barre actuellement affichée
        
        // Variables pour le bidding
        this.currentBid = 0; // Valeur actuelle du numérateur
        this.maxBid = 6; // Valeur maximale du dénominateur
    }

    // Charger l'interface UI du jeu
    async loadGameUI() {
        try {
            // Charger le HTML de l'interface avec un paramètre pour éviter le cache
            const response = await fetch(`./partials/game-ui.html?v=${Date.now()}`);
            const htmlContent = await response.text();
            
            // Injecter l'interface dans le body
            const uiContainer = document.createElement('div');
            uiContainer.innerHTML = htmlContent;
            document.body.appendChild(uiContainer.firstElementChild);
            
            // Charger le CSS de l'interface avec un paramètre pour éviter le cache
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `./css/game-ui.css?v=${Date.now()}`;
            document.head.appendChild(link);
            
            // Références vers les éléments UI
            this.gameUI = document.getElementById('game-ui-overlay');
            this.infoPanel = document.getElementById('info-panel');
            this.playerActionBar = document.getElementById('player-action-bar');
            this.validationBar = document.getElementById('validation-bar');
            this.biddingBar = document.getElementById('rectangle-action-bar');
            
            // Configuration des event listeners
            this.setupUIEventListeners();
            
            console.log('🎨 Interface UI chargée avec succès');
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
        }
    }

    // Configuration des event listeners pour l'UI
    setupUIEventListeners() {
        // Event listeners partagés pour toutes les barres d'actions
        this.setupSharedActionListeners();
    }

    // Configuration des event listeners partagés (settings et check)
    setupSharedActionListeners() {
        // Supprimer les anciens listeners s'ils existent pour éviter les doublons
        this.removeExistingListeners();
        
        // Tous les boutons settings dans toutes les interfaces
        const settingsButtons = document.querySelectorAll('.action-menu');
        settingsButtons.forEach(button => {
            button.addEventListener('click', this.handleSettingsClick.bind(this));
        });

        // Tous les boutons de validation dans toutes les interfaces
        const validateButtons = document.querySelectorAll('.action-validate');
        validateButtons.forEach(button => {
            button.addEventListener('click', this.handleValidateClick.bind(this));
        });

        // Boutons bidding (moins et plus)
        const lessButton = document.querySelector('.bidding-less');
        if (lessButton) {
            lessButton.addEventListener('click', this.handleBiddingLessClick.bind(this));
        }

        const moreButton = document.querySelector('.bidding-more');
        if (moreButton) {
            moreButton.addEventListener('click', this.handleBiddingMoreClick.bind(this));
        }
    }

    // Supprimer les event listeners existants pour éviter les doublons
    removeExistingListeners() {
        // Cloner et remplacer les éléments pour supprimer tous les event listeners
        const elementsToClean = [
            ...document.querySelectorAll('.action-menu'),
            ...document.querySelectorAll('.action-validate'),
            ...document.querySelectorAll('.bidding-less'),
            ...document.querySelectorAll('.bidding-more')
        ];

        elementsToClean.forEach(element => {
            if (element && element.parentNode) {
                const newElement = element.cloneNode(true);
                element.parentNode.replaceChild(newElement, element);
            }
        });
    }

    // Action du bouton settings (partagée par toutes les interfaces)
    handleSettingsClick() {
        console.log('🔧 Ouverture du menu settings...');
        // TODO: Implémenter l'ouverture du menu settings
    }

    // Action du bouton validation (partagée par toutes les interfaces)
    handleValidateClick() {
        // Déterminer quelle action de validation exécuter selon le contexte
        const gameStatus = window.gameState?.game?.game_status;
        
        if (gameStatus === 'initial_placement') {
            this.handleInitialPlacementValidation();
        } else if (gameStatus === 'bidding_phase') {
            this.handleBiddingValidation();
        } else {
            console.log('📝 Validation générique - contexte non défini');
            // TODO: Ajouter d'autres types de validation selon le contexte
        }
    }

    // Validation spécifique pour la phase de placement initial
    handleInitialPlacementValidation() {
        // Importer dynamiquement pour éviter les dépendances circulaires
        import('../gameApi.js').then(apiModule => {
            const gameBoard = apiModule.gameApi.gameBoard;
            
            if (gameBoard) {
                // Récupérer toutes les villes placées avec leurs positions actuelles
                const clansData = [];
                gameBoard.workplane.traverse((child) => {
                    if (child.userData && child.userData.type === 'clan_city') {
                        clansData.push({
                            start_q: child.userData.position.q,
                            start_r: child.userData.position.r,
                            color: child.userData.color,
                            name: child.userData.clanName
                        });
                    }
                });
                
                if (clansData.length > 0) {
                    // Appeler la fonction d'envoi de l'API
                    apiModule.gameApi.sendClansToApi(clansData);
                } else {
                    console.warn('⚠️ Aucune ville trouvée pour validation');
                }
            } else {
                console.error('❌ GameBoard3D non disponible');
            }
        });
    }

    // Validation spécifique pour la phase de bidding
    handleBiddingValidation() {
        // Importer dynamiquement pour éviter les dépendances circulaires
        import('../gameApi.js').then(apiModule => {
            // Envoyer la valeur actuelle du numérateur (chao) avec turn par défaut à 0
            apiModule.gameApi.sendBiddingToApi(this.currentBid, 0);
        });
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

    // Fonction générale pour masquer toutes les barres d'actions
    hideAllActionBars() {
        if (this.playerActionBar) this.playerActionBar.style.display = 'none';
        if (this.validationBar) this.validationBar.style.display = 'none';
        if (this.biddingBar) this.biddingBar.style.display = 'none';
        this.currentActionBar = null;
    }

    // Fonction pour afficher la barre d'actions complète (6 cases)
    showPlayerActionBar() {
        this.hideAllActionBars();
        if (this.playerActionBar) {
            this.playerActionBar.style.display = 'flex';
            this.currentActionBar = this.playerActionBar;
        } else {
            console.warn('⚠️ Barre d\'actions complète non initialisée');
        }
    }

    // Fonction pour afficher la barre de validation simple (settings + check)
    showValidationBar() {
        this.hideAllActionBars();
        if (this.validationBar) {
            this.validationBar.style.display = 'flex';
            this.currentActionBar = this.validationBar;
        } else {
            console.warn('⚠️ Barre de validation non initialisée');
        }
    }

    // Fonction pour afficher la barre de bidding (settings + info + boutons + check)
    showBiddingBar() {
        this.hideAllActionBars();
        if (this.biddingBar) {
            this.biddingBar.style.display = 'flex';
            this.currentActionBar = this.biddingBar;
        } else {
            console.warn('⚠️ Barre de bidding non initialisée');
        }
    }

    // Fonction pour masquer toutes les barres (alias pour compatibilité)
    hidePlayerActionBar() {
        this.hideAllActionBars();
    }

    // Fonction pour mettre à jour la fraction de bidding (numérateur/dénominateur)
    updateBiddingText(current = this.currentBid, max = this.maxBid) {
        // Stocker les valeurs pour les boutons
        this.currentBid = current;
        this.maxBid = max;
        
        const updateFraction = () => {
            // Essayer plusieurs sélecteurs pour trouver les éléments
            let numerator = document.querySelector('.chao-numerator') || 
                           document.querySelector('.numerator') ||
                           document.querySelector('#rectangle-action-bar .chao-numerator');
                           
            let denominator = document.querySelector('.chao-denominator') || 
                             document.querySelector('.denominator') ||
                             document.querySelector('#rectangle-action-bar .chao-denominator');
            
            if (numerator && denominator) {
                numerator.textContent = current.toString();
                denominator.textContent = max.toString();
                return true;
            }
            return false;
        };

        const tryUpdate = (attempt = 1, maxAttempts = 5) => {
            if (updateFraction()) {
                return; // Succès
            }
            
            if (attempt < maxAttempts) {
                const delay = attempt * 100; // Délai progressif: 100, 200, 300, 400ms
                setTimeout(() => tryUpdate(attempt + 1, maxAttempts), delay);
            } else {
                console.warn(`⚠️ Éléments de fraction non trouvés après ${maxAttempts} tentatives`);
                // Si la barre est visible mais les éléments fraction manquent, forcer une recréation
                const rectangleBar = document.querySelector('#rectangle-action-bar');
                if (rectangleBar && rectangleBar.style.display !== 'none') {
                    this.createFallbackFraction(current, max);
                }
            }
        };

        // Commencer les tentatives
        tryUpdate();
    }

    // Gestion du clic sur le bouton moins
    handleBiddingLessClick() {
        if (this.currentBid > 0) {
            this.currentBid--;
            this.updateBiddingText();
            console.log(`➖ Mise diminuée: ${this.currentBid}/${this.maxBid}`);
        } else {
            console.log('➖ Impossible de diminuer: valeur minimale atteinte (0)');
        }
    }

    // Gestion du clic sur le bouton plus  
    handleBiddingMoreClick() {
        if (this.currentBid < this.maxBid) {
            this.currentBid++;
            this.updateBiddingText();
            console.log(`➕ Mise augmentée: ${this.currentBid}/${this.maxBid}`);
        } else {
            console.log(`➕ Impossible d'augmenter: valeur maximale atteinte (${this.maxBid})`);
        }
    }

    // Méthode de fallback pour créer les éléments de fraction manquants
    createFallbackFraction(current, max) {
        const biddingBar = document.querySelector('.bidding-info-case');
        if (!biddingBar) {
            console.error('❌ Barre de bidding introuvable pour le fallback');
            return;
        }

        // Chercher ou créer les éléments manquants
        let numerator = biddingBar.querySelector('.chao-numerator');
        let denominator = biddingBar.querySelector('.chao-denominator');
        
        if (!numerator || !denominator) {
            // Créer la structure manquante comme fallback
            const fractionContainer = biddingBar.querySelector('.chao-fraction') || 
                                    biddingBar.querySelector('.diagonal-fraction');
            
            if (fractionContainer) {
                fractionContainer.innerHTML = `
                    <span class="chao-numerator numerator">${current}</span>
                    <span class="slash">/</span>
                    <span class="chao-denominator denominator">${max}</span>
                `;
                console.log('✅ Éléments de fraction recréés par fallback');
            } else {
                console.error('❌ Container de fraction introuvable');
            }
        }
    }
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager(); 