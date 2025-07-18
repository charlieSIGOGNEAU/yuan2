// Gestionnaire de l'interface utilisateur
export class UIManager {
    constructor() {
        this.gameUI = null;
        this.infoPanel = null;
        this.playerActionBar = null;
        this.validationBar = null;
        this.biddingBar = null;
        this.currentActionBar = null; // Référence vers la barre actuellement affichée
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
            this.playerActionBar = document.getElementById('player-action-bar');
            this.validationBar = document.getElementById('validation-bar');
            this.biddingBar = document.getElementById('rectangle-action-bar');
            
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
                
                if (this.playerActionBar) {
                    console.log('🎮 Barre d\'actions du joueur trouvée');
                } else {
                    console.error('❌ Barre d\'actions du joueur non trouvée');
                }
                
                if (this.validationBar) {
                    console.log('✅ Barre de validation trouvée');
                } else {
                    console.error('❌ Barre de validation non trouvée');
                }
                
                if (this.biddingBar) {
                    console.log('🎯 Barre de bidding trouvée');
                } else {
                    console.error('❌ Barre de bidding non trouvée');
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
        // Event listeners partagés pour toutes les barres d'actions
        this.setupSharedActionListeners();
    }

    // Configuration des event listeners partagés (settings et check)
    setupSharedActionListeners() {
        // Tous les boutons settings dans toutes les interfaces
        const settingsButtons = document.querySelectorAll('.action-menu');
        settingsButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('⚙️ Bouton settings cliqué');
                this.handleSettingsClick();
            });
        });

        // Tous les boutons de validation dans toutes les interfaces
        const validateButtons = document.querySelectorAll('.action-validate');
        validateButtons.forEach(button => {
            button.addEventListener('click', () => {
                console.log('✅ Bouton validation cliqué');
                this.handleValidateClick();
            });
        });

        // Boutons bidding (moins et plus)
        const lessButton = document.querySelector('.bidding-less');
        if (lessButton) {
            lessButton.addEventListener('click', () => {
                console.log('➖ Bouton moins cliqué');
                this.handleBiddingLessClick();
            });
        }

        const moreButton = document.querySelector('.bidding-more');
        if (moreButton) {
            moreButton.addEventListener('click', () => {
                console.log('➕ Bouton plus cliqué');
                this.handleBiddingMoreClick();
            });
        }
    }

    // Action du bouton settings (partagée par toutes les interfaces)
    handleSettingsClick() {
        console.log('🔧 Ouverture du menu settings...');
        // TODO: Implémenter l'ouverture du menu settings
    }

    // Action du bouton validation (partagée par toutes les interfaces)
    handleValidateClick() {
        console.log('✔️ Validation de l\'action...');
        
        // Déterminer quelle action de validation exécuter selon le contexte
        // Pour l'instant, on va détecter si on est en phase initial_placement
        const gameStatus = window.gameState?.game?.game_status;
        
        if (gameStatus === 'initial_placement') {
            this.handleInitialPlacementValidation();
        } else {
            console.log('📝 Validation générique - contexte non défini');
            // TODO: Ajouter d'autres types de validation selon le contexte
        }
    }

    // Validation spécifique pour la phase de placement initial
    handleInitialPlacementValidation() {
        console.log('🏘️ Validation du placement initial des villes');
        
        // Importer dynamiquement pour éviter les dépendances circulaires
        import('../gameApi.js').then(apiModule => {
            const gameBoard = apiModule.gameApi.gameBoard;
            
            if (gameBoard) {
                console.log('📍 Récupération des positions actuelles des villes depuis GameBoard3D...');
                
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
                    console.log('🏛️ Données actuelles des clans à envoyer:', clansData);
                    
                    // Appeler la fonction d'envoi de l'API
                    apiModule.gameApi.sendClansToApi(clansData);
                } else {
                    console.warn('⚠️ Aucune ville trouvée dans GameBoard3D');
                }
            } else {
                console.error('❌ GameBoard3D non disponible');
            }
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
            console.log('🎮 Barre d\'actions complète affichée');
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
            console.log('✅ Barre de validation affichée');
        } else {
            console.warn('⚠️ Barre de validation non initialisée');
        }
    }

    // Fonction pour afficher la barre de bidding (settings + 2 rectangles + check)
    showBiddingBar() {
        this.hideAllActionBars();
        if (this.biddingBar) {
            this.biddingBar.style.display = 'flex';
            this.currentActionBar = this.biddingBar;
            console.log('🎯 Barre de bidding affichée');
        } else {
            console.warn('⚠️ Barre de bidding non initialisée');
        }
    }

    // Fonction pour masquer toutes les barres (alias pour compatibilité)
    hidePlayerActionBar() {
        this.hideAllActionBars();
        console.log('🎮 Toutes les barres d\'actions masquées');
    }

    // Fonction pour mettre à jour le texte de bidding (x/y)
    updateBiddingText(current, max) {
        const chaoText = document.querySelector('.chao-text');
        if (chaoText) {
            chaoText.textContent = `: ${current}/${max}`;
            console.log(`🎯 Texte de bidding mis à jour: ${current}/${max}`);
        } else {
            console.warn('⚠️ Élément chao-text non trouvé');
        }
    }

    // Gestion du clic sur le bouton moins
    handleBiddingLessClick() {
        console.log('➖ Action: Diminuer la mise');
        // TODO: Implémenter la logique de diminution
        // Pour l'instant, juste un placeholder
    }

    // Gestion du clic sur le bouton plus  
    handleBiddingMoreClick() {
        console.log('➕ Action: Augmenter la mise');
        // TODO: Implémenter la logique d'augmentation
        // Pour l'instant, juste un placeholder
    }
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager(); 