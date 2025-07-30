// Gestionnaire de l'interface utilisateur
import { gameApi } from '../gameApi.js';
import { gameState } from '../gameState.js';

export class UIManager {
    constructor() {
        this.gameUI = null;
        this.infoPanel = null;
        this.playerActionBar = null;
        this.validationBar = null;
        this.biddingBar = null;
        this.menuOnlyBar = null; // Nouvelle barre avec seulement le menu
        this.currentActionBar = null; // Référence vers la barre actuellement affichée
        
        // Variables pour le bidding
        this.currentBid = 0; // Valeur actuelle du numérateur
        this.maxBid = 6; // Valeur maximale du dénominateur
    }

    // Charger l'interface UI du jeu
    async loadGameUI() {
        // Vérifier si l'interface est déjà chargée
        if (this.gameUI) {
            console.log('⏭️ Interface UI déjà chargée, skip');
            return;
        }
        
        // Vérifier si un chargement est déjà en cours
        if (this._loadingPromise) {
            console.log('⏳ Interface UI en cours de chargement, attente...');
            return this._loadingPromise;
        }
        
        console.log('🎨 Début du chargement de l\'interface UI...');
        this._loadingPromise = this._loadGameUIInternal();
        
        try {
            await this._loadingPromise;
            console.log('✅ Interface UI chargée avec succès');
        } finally {
            this._loadingPromise = null;
        }
    }
    
    // Méthode interne pour le chargement
    async _loadGameUIInternal() {
        try {
            // Supprimer la div app si elle existe
            const appDiv = document.getElementById('app');
            if (appDiv) {
                appDiv.remove();
                console.log('🗑️ Div app supprimée');
            }
            
            // Charger le HTML de l'interface avec un paramètre pour éviter le cache
            const response = await fetch(`./partials/game-ui.html?v=${Date.now()}`);
            const htmlContent = await response.text();
            
            // Injecter l'interface dans le body
            const uiContainer = document.createElement('div');
            uiContainer.innerHTML = htmlContent;
            
            // Injecter tous les éléments enfants (barre d'info + overlay)
            while (uiContainer.firstChild) {
                document.body.appendChild(uiContainer.firstChild);
            }
            
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
            this.menuOnlyBar = document.getElementById('menu-only-bar');
            this.gameBoardContainer = document.getElementById('game-board-container');
            
            // Configuration des event listeners
            this.setupUIEventListeners();
            
            // Charger le GameBoard3D si pas déjà chargé
            await this.loadGameBoard3D();
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
            throw error;
        }
    }

    // Charger le GameBoard3D
    async loadGameBoard3D() {
        try {
            // Vérifier si le GameBoard3D n'est pas déjà chargé
            if (!window.gameBoard) {
                console.log('🎮 Chargement du GameBoard3D...');
                
                // Importer et créer le GameBoard3D
                const { GameBoard3D } = await import('../ui/GameBoard3D.js');
                window.gameBoard = new GameBoard3D('game-board-container');
                
                console.log('✅ GameBoard3D chargé avec succès');
            } else {
                console.log('⏭️ GameBoard3D déjà chargé, skip');
            }
        } catch (error) {
            console.error('❌ Erreur lors du chargement du GameBoard3D:', error);
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

        // Gestion des champs de texte des boutons d'action (2, 3, 4)
        this.setupActionSlotTextListeners();
    }

    // Configuration des listeners pour les champs de texte des boutons d'action
    setupActionSlotTextListeners() {
        const actionSlots = document.querySelectorAll('.action-slot');
        actionSlots.forEach((slot, index) => {
            const textInput = slot.querySelector('.action-slot-text');
            if (textInput) {
                // Initialiser le champ à vide
                textInput.value = '';
                
                // Désactiver la sélection sur le champ de texte
                textInput.style.userSelect = 'none';
                textInput.style.webkitUserSelect = 'none';
                textInput.style.mozUserSelect = 'none';
                textInput.style.msUserSelect = 'none';
                
                // Flag pour éviter le double déclenchement
                let isProcessing = false;
                
                // Fonction de gestion du clic/tactile
                const handleInteraction = (event) => {
                    if (isProcessing) return; // Éviter le double déclenchement
                    
                    event.preventDefault();
                    isProcessing = true;
                    
                    this.handleActionSlotTextClick(textInput, index + 2); // index + 2 car on commence par le bouton 2
                    
                    // Réinitialiser le flag après un court délai
                    setTimeout(() => {
                        isProcessing = false;
                    }, 100);
                };
                
                // Ajouter les listeners pour souris et tactile
                slot.addEventListener('mousedown', handleInteraction);
                slot.addEventListener('touchstart', handleInteraction);
            }
        });
    }

    // Fonction pour calculer le niveau d'action et son coût
    getActionLevelAndCost(value) {
        switch (value) {
            case '':
                return { level: 0, cost: 0 };
            case 'I':
                return { level: 1, cost: 0 };
            case 'II':
                return { level: 2, cost: 4 };
            case 'III':
                return { level: 3, cost: 7 };
            default:
                return { level: 0, cost: 0 };
        }
    }

    // Gestion du clic sur un champ de texte d'action
    handleActionSlotTextClick(textInput, buttonNumber) {
        const currentValue = textInput.value;
        let newValue = '';
        
        // Cycle : vide → I → II → III → vide
        if (currentValue === '') {
            newValue = 'I';
        } else if (currentValue === 'I') {
            newValue = 'II';
        } else if (currentValue === 'II') {
            newValue = 'III';
        } else if (currentValue === 'III') {
            newValue = '';
        } else {
            // Si la valeur n'est pas reconnue, repartir de vide
            newValue = 'I';
        }
        
        textInput.value = newValue;
        
        // Boucle sur les 3 cases d'action (2, 3, 4)
        const actionCases = [
            { number: 2, name: 'Riz', infoSelector: '.home-text' },
            { number: 3, name: 'Forêt', infoSelector: '.shield-text' },
            { number: 4, name: 'Mine', infoSelector: '.sword-text' }
        ];
        
        let totalAdjustedCost = 0;
        
        actionCases.forEach(caseInfo => {
            const actionSlot = document.querySelector(`.action-slot:nth-child(${caseInfo.number}) .action-slot-text`);
            const currentLevel = actionSlot ? actionSlot.value : '';
            
            // Récupérer la valeur de la case d'information correspondante
            const infoElement = document.querySelector(`#simultaneous-play-info-bar ${caseInfo.infoSelector}`);
            const infoValue = infoElement ? parseInt(infoElement.value) || 0 : 0;
            
            // Calculer le coût de base selon le niveau de l'action
            const { cost: baseCost } = this.getActionLevelAndCost(currentLevel);
            
            // Calculer le coût ajusté : coût_base - valeur_case avec minimum 0
            const adjustedCost = Math.max(0, baseCost - infoValue);
            
            totalAdjustedCost += adjustedCost;
        });
        console.log(`💰 totalAdjustedCost: ${totalAdjustedCost}`);


        if (gameState.game.myChaoTemp === undefined) {
            gameState.game.myChaoTemp = gameState.game.myClan.available_chao;
          }

        let chaoModification = gameState.game.myClan.available_chao - totalAdjustedCost - gameState.game.myChaoTemp;
        console.log(`💰 chaoModification: ${chaoModification}`);

        gameState.game.myChaoTemp = gameState.game.myClan.available_chao - totalAdjustedCost ;
        console.log(`💰 gameState.game.myChaoTemp: ${gameState.game.myChaoTemp}`);
        console.log(" -------------------------------- ")
        // console.log(`💰 Coût total ajusté: ${totalAdjustedCost}`);
        
        this.createChaoModificationAnimation(chaoModification);
        
    }

    // Fonction pour créer l'animation de modification des chao
    createChaoModificationAnimation(chaoModification) {
        // Ne pas créer de cercle si la modification est 0
        if (chaoModification === 0) {
            console.log('🎬 Pas d\'animation créée car modification = 0');
            return;
        }

        // Récupérer le cercle de la 5ème case de la barre d'information
        const originalCircle = document.querySelector('#simultaneous-play-info-bar .chao-circle');
        if (!originalCircle) {
            console.warn('⚠️ Cercle chao non trouvé pour l\'animation');
            return;
        }

        // Créer un cercle temporaire avec la même apparence
        const tempCircle = document.createElement('div');
        tempCircle.className = 'chao-circle temp-chao-modification';
        tempCircle.style.position = 'absolute';
        tempCircle.style.zIndex = '1000';
        
        // Copier les styles du cercle original
        const originalStyles = window.getComputedStyle(originalCircle);
        tempCircle.style.width = originalStyles.width;
        tempCircle.style.height = originalStyles.height;
        tempCircle.style.borderRadius = originalStyles.borderRadius;
        tempCircle.style.border = originalStyles.border;
        tempCircle.style.display = 'flex';
        tempCircle.style.alignItems = 'center';
        tempCircle.style.justifyContent = 'center';
        tempCircle.style.fontSize = originalStyles.fontSize;
        tempCircle.style.fontWeight = originalStyles.fontWeight;
        
        // Changer la couleur de fond selon le signe
        if (chaoModification > 0) {
            tempCircle.style.backgroundColor = '#00ff00'; // Vert si positif
        } else {
            tempCircle.style.backgroundColor = '#ff0000'; // Rouge si négatif
        }
        
        // Créer le texte avec la modification des chao (noir)
        const tempText = document.createElement('span');
        tempText.textContent = chaoModification.toString();
        tempText.style.color = '#000000'; // Noir
        tempCircle.appendChild(tempText);
        
        // Positionner le cercle temporaire au même endroit que l'original mais décalé vers le bas
        const originalRect = originalCircle.getBoundingClientRect();
        const parentRect = originalCircle.parentElement.getBoundingClientRect();
        
        tempCircle.style.left = (originalRect.left - parentRect.left) + 'px';
        tempCircle.style.top = (originalRect.top - parentRect.top + originalRect.height * 3) + 'px'; // Décalage de 300% vers le bas
        
        // Ajouter le cercle temporaire au parent du cercle original
        originalCircle.parentElement.appendChild(tempCircle);
        
        // Lancer l'animation de remontée
        this.animateChaoModificationRemoval(tempCircle, originalRect, parentRect);
        
        // Lancer l'animation de mise à jour du cercle chao après 500ms
        setTimeout(() => {
            this.animateChaoCircleUpdate();
        }, 500);
        
        console.log(`🎬 Animation créée: cercle temporaire avec valeur ${chaoModification} positionné en dessous du cercle chao`);
    }

    // Fonction pour animer la remontée du cercle temporaire
    animateChaoModificationRemoval(tempCircle, originalRect, parentRect) {
        const startTop = originalRect.top - parentRect.top + originalRect.height * 3; // Position de départ (-300%)
        const endTop = originalRect.top - parentRect.top; // Position finale (originale)
        const duration = 800; // 1 seconde exacte
        const fadeStartTime = 500; // Commencer le fondu à 800ms (80% de l'animation)
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Fonction d'easing linéaire pour la position
            const currentTop = startTop + (endTop - startTop) * progress;
            tempCircle.style.top = currentTop + 'px';
            
            // Gestion du fondu vers la fin
            if (elapsed >= fadeStartTime) {
                const fadeProgress = (elapsed - fadeStartTime) / (duration - fadeStartTime);
                const opacity = 1 - fadeProgress;
                tempCircle.style.opacity = opacity;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Animation terminée, supprimer le cercle temporaire
                if (tempCircle.parentElement) {
                    tempCircle.parentElement.removeChild(tempCircle);
                }
                console.log('🎬 Animation de remontée terminée, cercle temporaire supprimé');
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Supprimer les event listeners existants pour éviter les doublons
    removeExistingListeners() {
        // Cloner et remplacer les éléments pour supprimer tous les event listeners
        const elementsToClean = [
            ...document.querySelectorAll('.action-menu'),
            ...document.querySelectorAll('.action-validate'),
            ...document.querySelectorAll('.bidding-less'),
            ...document.querySelectorAll('.bidding-more'),
            ...document.querySelectorAll('.action-slot') // Ajouter les action-slot pour nettoyer les mousedown
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
        console.log('🔘 Bouton de validation cliqué');
        
        // Vérifier le statut du jeu pour déterminer l'action
        if (gameState.game.game_status === 'initial_placement') {
            this.handleInitialPlacementValidation();
        } else if (gameState.game.game_status === 'bidding_phase') {
            this.handleBiddingValidation();
        } else if (gameState.game.game_status === 'starting_spot_selection') {
            this.handleStartingSpotSelectionValidation();
        } else if (gameState.game.game_status === 'simultaneous_play') {
            this.handleSimultaneousPlayValidation();
        } else {
            console.log('⚠️ Statut de jeu non géré pour la validation:', gameState.game.game_status);
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
        console.log('💰 Validation de l\'enchère');
        
        // Importer biddingPhase pour accéder au clan sélectionné
        import('../phases/biddingPhase.js').then(module => {
            const biddingPhase = module.biddingPhase;
            
            // Vérifier si un clan est sélectionné
            if (!biddingPhase.selectedClan) {
                console.log('❌ Aucun clan sélectionné');
                uiManager.updateInfoPanel('Veuillez sélectionner un clan');
                return;
            }
            
            // Récupérer la valeur actuelle de l'enchère
            const currentBid = this.currentBid;
            console.log(`💰 Envoi de l'enchère: ${currentBid} chao pour le clan ${biddingPhase.selectedClan.name}`);
            
            // Envoyer le clan et l'enchère à l'API
            gameApi.sendClanBiddingToApi(biddingPhase.selectedClan.id, currentBid);
        });
    }

    handleStartingSpotSelectionValidation() {
        console.log('🎯 Validation de la sélection de position de départ');
        
        // Appeler la fonction de validation via gameApi
        gameApi.sendClanSelectionToApi();
    }

    // Validation spécifique pour la phase de jeu simultané
    handleSimultaneousPlayValidation() {
        console.log('🎯 Validation de l\'action en jeu simultané');
        
        // Importer simultaneousPlayPhase pour accéder à la fonction de validation
        import('../phases/simultaneous-play-phase/simultaneous-play-phase.js').then(module => {
            const simultaneousPlayPhase = module.simultaneousPlayPhase;
            
            // Appeler la fonction de validation de l'action
            simultaneousPlayPhase.handleActionValidation();
        });
    }

    // Fonction pour mettre à jour le panneau d'informations
    updateInfoPanel(text) {
        if (this.infoPanel) {
            this.infoPanel.innerHTML = text || '';
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
        if (this.menuOnlyBar) this.menuOnlyBar.style.display = 'none';
        
        this.currentActionBar = null;
    }

    // Fonction pour afficher la barre d'actions complète (5 cases)
    showPlayerActionBar() {
        this.hideAllActionBars();
        if (this.playerActionBar) {
            this.playerActionBar.style.display = 'flex';
            this.currentActionBar = this.playerActionBar;
            
            // Appliquer la couleur du clan au bouton de validation
            this.applyClanColorToValidateButton();
            
            // Mettre à jour la fraction des temples (4ème case)
            this.updateTempleFraction();
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
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
            
            // Appliquer la couleur du clan au bouton de validation
            this.applyClanColorToValidateButton();
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
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
            
            // Appliquer la couleur du clan au bouton de validation
            this.applyClanColorToValidateButton();
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
        } else {
            console.warn('⚠️ Barre de bidding non initialisée');
        }
    }

    // Fonction pour afficher la barre avec seulement le menu
    showMenuOnlyBar() {
        this.hideAllActionBars();
        if (this.menuOnlyBar) {
            this.menuOnlyBar.style.display = 'flex';
            this.currentActionBar = this.menuOnlyBar;
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
        } else {
            console.warn('⚠️ Barre menu-only non initialisée');
        }
    }

    // Fonction pour afficher la barre d'information de la phase simultaneous_play
    showSimultaneousPlayInfoBar() {
        // Masquer toutes les autres barres
        this.hideAllActionBars();
        
        // Récupérer la barre d'information
        const infoBar = document.getElementById('simultaneous-play-info-bar');
        if (!infoBar) {
            console.warn('⚠️ Barre d\'information simultaneous_play non trouvée');
            return;
        }
        
        // Mettre à jour le texte du 5ème carré (chao) avec available_chao du clan du joueur
        this.updateChaoText();
        
        // Mettre à jour les ressources (3 premières cases)
        this.updateResources();
        
        // Mettre à jour la fraction des temples (4ème case)
        this.updateTempleFraction();
        
        // Actualiser myChaoTemp avec la valeur affichée dans la 5ème case
        const chaoTextElement = document.querySelector('#simultaneous-play-info-bar .chao-text');
        if (chaoTextElement) {
            const displayedChao = parseInt(chaoTextElement.value) || 0;
            gameState.game.myChaoTemp = displayedChao;
            console.log(`💰 myChaoTemp actualisé: ${displayedChao}`);
        }
        
        // Désactiver la sélection de texte
        this.disableTextSelection();
        
        // Afficher la barre
        infoBar.style.display = 'flex';
        console.log('🎯 Barre d\'information simultaneous_play affichée');
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
        
        // Mettre à jour le message de bidding si un clan est sélectionné
        import('../phases/biddingPhase.js').then(module => {
            if (module.biddingPhase.updateBiddingMessage) {
                module.biddingPhase.updateBiddingMessage();
            }
        });
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

    // Fonction pour mettre à jour le texte du chao avec available_chao du clan du joueur
    updateChaoText() {
        // Utiliser directement le clan du joueur actuel
        const playerClan = gameState.game.myClan;
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur actuel non trouvé');
            return;
        }

        // Mettre à jour le texte du chao dans le 5ème carré
        const chaoText = document.querySelector('#simultaneous-play-info-bar .chao-text');
        if (chaoText) {
            chaoText.value = playerClan.available_chao.toString();
            console.log(`💰 Texte chao mis à jour: ${playerClan.available_chao} pour le clan ${playerClan.name}`);
        } else {
            console.warn('⚠️ Élément chao-text non trouvé dans la barre d\'information');
        }
    }

    // Fonction pour mettre à jour toutes les cases de la barre d'information simultaneous_play
    updateSimultaneousPlayInfoBar() {
        this.updateResources();      // Cases 1, 2, 3
        this.updateTempleFraction(); // Case 4
        this.updateChaoText();       // Case 5
    }

    // Fonction pour mettre à jour les ressources (3 premières cases)
    updateResources() {
        // Utiliser directement le clan du joueur actuel
        const playerClan = gameState.game.myClan;
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur actuel non trouvé');
            return;
        }

        // Compter les territoires du clan selon les critères
        const territories = gameState.game.territories.filter(territory => 
            territory.clan_id === playerClan.id
        );

        // Case 1: Riz (type 'rice' avec construction_type 'ville' ou '2villes')
        const riceTerritories = territories.filter(territory => 
            territory.type === 'rice' && 
            (territory.construction_type === 'ville' || territory.construction_type === '2villes')
        );
        let riceCount = 0;
        riceTerritories.forEach(territory => {
            riceCount += territory.construction_type === '2villes' ? 2 : 1;
        });

        // Case 2: Forêt (type 'forest' avec construction_type 'ville' ou '2villes')
        const forestTerritories = territories.filter(territory => 
            territory.type === 'forest' && 
            (territory.construction_type === 'ville' || territory.construction_type === '2villes')
        );
        let forestCount = 0;
        forestTerritories.forEach(territory => {
            forestCount += territory.construction_type === '2villes' ? 2 : 1;
        });

        // Case 3: Mine (type 'mine' avec construction_type 'ville' ou '2villes')
        const mineTerritories = territories.filter(territory => 
            territory.type === 'mine' && 
            (territory.construction_type === 'ville' || territory.construction_type === '2villes')
        );
        let mineCount = 0;
        mineTerritories.forEach(territory => {
            mineCount += territory.construction_type === '2villes' ? 2 : 1;
        });

        // Mettre à jour les textes dans les 3 premières cases
        const homeText = document.querySelector('#simultaneous-play-info-bar .home-text');
        const shieldText = document.querySelector('#simultaneous-play-info-bar .shield-text');
        const swordText = document.querySelector('#simultaneous-play-info-bar .sword-text');

        if (homeText) {
            homeText.value = riceCount.toString();
            console.log(`🌾 Riz mis à jour: ${riceCount} territoires`);
        }
        if (shieldText) {
            shieldText.value = forestCount.toString();
            console.log(`🌲 Forêt mis à jour: ${forestCount} territoires`);
        }
        if (swordText) {
            swordText.value = mineCount.toString();
            console.log(`⛏️ Mine mis à jour: ${mineCount} territoires`);
        }

        // Mettre à jour la fraction des temples (4ème case)
        this.updateTempleFraction();

        console.log(`📊 Ressources mises à jour pour le clan ${playerClan.name}: Riz=${riceCount}, Forêt=${forestCount}, Mine=${mineCount}`);
    }

    // Fonction pour calculer le dénominateur selon le tour
    calculateDenominator(turn) {
        const denominators = {
            1: '9',
            2: '9',
            3: '9',
            4: '9⁻',
            5: '8',
            6: '7⁻',
            7: '6',
            8: '6⁻',
            9: '5',
            10: '5⁻',
            11: '4',
            12: '4⁻',
            13: '3'
        };
        
        return denominators[turn] || '3'; // Par défaut 3 si le tour dépasse 13
    }

    // Fonction pour mettre à jour la fraction des temples (4ème case)
    updateTempleFraction() {
        // Utiliser directement le clan du joueur actuel
        const playerClan = gameState.game.myClan;
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur actuel non trouvé pour les temples');
            return;
        }

        // Compter les territoires avec hasTemple = true et le même clan_id
        const templeTerritories = gameState.game.territories.filter(territory => 
            territory.clan_id === playerClan.id && territory.hasTemple === true
        );
        const templeCount = templeTerritories.length;

        // Calculer le dénominateur selon le tour
        const currentTurn = gameState.game.simultaneous_play_turn || 1;
        const denominator = this.calculateDenominator(currentTurn);

        // Mettre à jour le numérateur et le dénominateur de la fraction dans la barre d'information
        const numeratorInput = document.querySelector('#simultaneous-play-info-bar .fraction-numerator');
        const denominatorInput = document.querySelector('#simultaneous-play-info-bar .fraction-denominator');
        
        if (numeratorInput) {
            numeratorInput.value = templeCount.toString();
        } else {
            console.warn('⚠️ Élément fraction-numerator non trouvé dans la barre d\'information');
        }
        
        if (denominatorInput) {
            denominatorInput.value = denominator;
        } else {
            console.warn('⚠️ Élément fraction-denominator non trouvé dans la barre d\'information');
        }

        // Si aucun temple trouvé, réessayer après un délai (pour les cas de rechargement de page)
        if (templeCount === 0) {
            setTimeout(() => {
                this.updateTempleFraction();
            }, 2000);
        }
    }

    // Fonction pour récupérer la couleur du clan du joueur actuel
    getPlayerClanColor() {
        // Utiliser directement le clan du joueur actuel
        const playerClan = gameState.game.myClan;
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur actuel non trouvé pour la couleur');
            return null;
        }

        console.log(`🎨 Couleur du clan ${playerClan.name} récupérée: ${playerClan.color}`);
        return playerClan.color;
    }

    // Fonction pour appliquer la couleur du clan au bouton de validation
    applyClanColorToValidateButton() {
        const clanColor = this.getPlayerClanColor();
        if (!clanColor) {
            console.warn('⚠️ Impossible d\'appliquer la couleur du clan au bouton de validation');
            return;
        }

        // Appliquer la couleur via CSS custom property
        document.documentElement.style.setProperty('--player-clan-color', clanColor);
        console.log(`🎨 Couleur du clan appliquée au bouton de validation: ${clanColor}`);
    }

    // Fonction pour désactiver la sélection sur tous les éléments des barres
    disableTextSelection() {
        // Désactiver la sélection sur les barres d'action
        const actionBars = document.querySelectorAll('.player-action-bar, .simultaneous-play-info-bar');
        actionBars.forEach(bar => {
            // Désactiver la sélection sur la barre elle-même
            bar.style.userSelect = 'none';
            bar.style.webkitUserSelect = 'none';
            bar.style.mozUserSelect = 'none';
            bar.style.msUserSelect = 'none';
            bar.style.pointerEvents = 'auto';
            
            // Désactiver le drag sur les images
            const images = bar.querySelectorAll('img');
            images.forEach(img => {
                img.draggable = false;
                img.style.pointerEvents = 'none';
            });
        });
    }

    // Fonction pour animer la mise à jour du cercle chao
    animateChaoCircleUpdate() {
        const chaoCircle = document.querySelector('#simultaneous-play-info-bar .chao-circle');
        const chaoText = document.querySelector('#simultaneous-play-info-bar .chao-text');
        
        if (!chaoCircle || !chaoText) {
            console.warn('⚠️ Éléments chao non trouvés pour l\'animation de mise à jour');
            return;
        }

        // Sauvegarder les tailles originales
        const originalCircleWidth = chaoCircle.offsetWidth;
        const originalTextWidth = chaoText.offsetWidth;
        const originalCircleHeight = chaoCircle.offsetHeight;
        const originalTextHeight = chaoText.offsetHeight;

        // Animation de réduction à 0 (50ms)
        const shrinkDuration = 50;
        const shrinkStartTime = performance.now();
        
        const shrinkAnimation = (currentTime) => {
            const elapsed = currentTime - shrinkStartTime;
            const progress = Math.min(elapsed / shrinkDuration, 1);
            
            // Réduire progressivement la largeur
            const currentWidth = originalCircleWidth * (1 - progress);
            chaoCircle.style.width = currentWidth + 'px';
            chaoText.style.width = currentWidth + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(shrinkAnimation);
            } else {
                // Réduction terminée, changer le texte et commencer l'expansion
                chaoText.value = gameState.game.myChaoTemp.toString();
                
                // Animation d'expansion (50ms)
                const expandStartTime = performance.now();
                const expandDuration = 50;
                
                const expandAnimation = (currentTime) => {
                    const elapsed = currentTime - expandStartTime;
                    const progress = Math.min(elapsed / expandDuration, 1);
                    
                    // Remettre progressivement la largeur
                    const currentWidth = originalCircleWidth * progress;
                    chaoCircle.style.width = currentWidth + 'px';
                    chaoText.style.width = currentWidth + 'px';
                    
                    if (progress < 1) {
                        requestAnimationFrame(expandAnimation);
                    } else {
                        // Animation terminée, remettre les styles par défaut
                        chaoCircle.style.width = '';
                        chaoText.style.width = '';
                        console.log('🎬 Animation de mise à jour du cercle chao terminée');
                    }
                };
                
                requestAnimationFrame(expandAnimation);
            }
        };
        
        requestAnimationFrame(shrinkAnimation);
    }
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager(); 