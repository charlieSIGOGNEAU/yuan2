// Gestionnaire de l'interface utilisateur
import { gameApi } from '../gameApi.js';
import { gameState } from '../gameState.js';
import { initializeHelpSystem } from '../../core/HelpSystem.js';
import { optionsMenu } from '../../core/OptionsMenu.js';
import { i18n } from '../../core/i18n.js';

export class UIManager {
    constructor() {
        this.gameUI = null;
        this.infoPanel = null;
        this.playerActionBar = null;
        this.validationBar = null;
        this.biddingBar = null;
        this.menuOnlyBar = null; // Nouvelle barre avec seulement le menu
        this.nextBar = null; // Nouvelle barre avec bouton next
        this.currentActionBar = null; // Référence vers la barre actuellement affichée
        this.helpSystem = null; // Système d'aide (sera initialisé plus tard)
        
        // Variables pour le bidding
        this.currentBid = 0; // Valeur actuelle du numérateur
        this.maxBid = 6; // Valeur maximale du dénominateur
        
        // Détection smartphone et gestion des dimensions
        this.isSmartphone = this.detectSmartphone();
        this.setupResponsiveDimensions();
    }

    // Détecter si on est sur un smartphone
    detectSmartphone() {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|android|iphone|ipad|blackberry|windows phone/i.test(userAgent);
        const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isSmallScreen = window.innerWidth < 768;
        const hasHighDPR = window.devicePixelRatio > 1;
        
        const isSmartphone = isMobile && isTouch && (isSmallScreen || hasHighDPR);
        
        return isSmartphone;
    }

    // Configurer les dimensions responsives pour les barres d'action
    setupResponsiveDimensions() {
        // Fonction pour mettre à jour les dimensions
        const updateDimensions = () => {
            const isPortrait = window.innerHeight > window.innerWidth;
            
            // Ajouter/supprimer la classe smartphone/desktop sur le body
            if (this.isSmartphone) {
                document.body.classList.add('smartphone');
                document.body.classList.remove('desktop');
                
                // Sur smartphone, ajouter aussi la classe d'orientation
                if (isPortrait) {
                    document.body.classList.add('portrait');
                    document.body.classList.remove('landscape');
                } else {
                    document.body.classList.add('landscape');
                    document.body.classList.remove('portrait');
                }
            } else {
                document.body.classList.add('desktop');
                document.body.classList.remove('smartphone');
                // Sur desktop, toujours en mode portrait
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
            
            let barHeight, barWidth;
            
            if (this.isSmartphone) {
                // Smartphone
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                
                if (isPortrait) {
                    // Mode portrait : height = 1/5 de la largeur, width = largeur de l'écran
                    barHeight = screenWidth / 5;
                    barWidth = screenWidth;
                } else {
                    // Mode paysage : height = hauteur de l'écran, width = 1/5 de la hauteur
                    barHeight = screenHeight;
                    barWidth = screenHeight / 5;


                }
            } else {
                // Desktop
                
                    barHeight = 70;
                    barWidth = 350;
                
                
            }
            
            // Appliquer les dimensions à toutes les barres d'action
            const actionBars = document.querySelectorAll('.player-action-bar');
            actionBars.forEach(bar => {
                if (bar) {
                    bar.style.width = `${barWidth}px`;
                    bar.style.height = `${barHeight}px`;
                }
            });
            // Ajouter des marges à l'info panel en mode smartphone paysage
            if (this.isSmartphone && gameState.game.game_status === 'simultaneous_play') {
                if (!isPortrait) {
                    // Mode smartphone paysage : ajouter barHeight aux marges gauche et droite de l'info panel
                    const infoPanel = document.querySelector('#info-panel');
                    if (infoPanel) {
                        infoPanel.style.marginLeft = `${barWidth}px`;
                        infoPanel.style.marginRight = `${barWidth}px`;
                        infoPanel.style.marginTop = `0px`;
                    }
                } else {
                    // Réinitialiser les marges pour les autres modes
                    const infoPanel = document.querySelector('#info-panel');
                    if (infoPanel) {
                        infoPanel.style.marginLeft = '0px';
                        infoPanel.style.marginRight = '0px';
                        infoPanel.style.marginTop = `${barHeight}px`;
                    }
                }
            }
            
            // Appliquer les mêmes dimensions à la barre d'information (seulement sur desktop)
            if (!this.isSmartphone) {
                const infoBar = document.querySelector('#simultaneous-play-info-bar');
                if (infoBar) {
                    infoBar.style.width = `${barWidth}px`;
                    infoBar.style.height = `${barHeight}px`;
                    
                    // Styles communs
                    infoBar.style.position = 'absolute';
                    infoBar.style.zIndex = '10005'; // Au-dessus de tout
                    infoBar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'; // Ombre portée
                    infoBar.style.border = '2px solid rgba(255, 255, 255, 0.2)'; // Bordure subtile
                    infoBar.style.backdropFilter = 'blur(10px)'; // Effet de flou en arrière-plan
                    infoBar.style.backgroundColor = 'rgba(0, 0, 0, 0.80)'; // Fond semi-transparent
                    

                    infoBar.style.left = '50%'; // Centrer horizontalement
                    infoBar.style.top = '0px'; // Position en haut, 0 px obligatoire
                    infoBar.style.transform = 'translateX(-50%)'; // Centrer horizontalement
                    infoBar.style.right = 'auto';
                    infoBar.style.bottom = 'auto';
                    infoBar.style.borderTopLeftRadius = '0px'; // Pas d'arrondi haut gauche
                    infoBar.style.borderTopRightRadius = '0px'; // Pas d'arrondi haut droit
                    infoBar.style.borderBottomLeftRadius = '20px'; // Coins arrondis bas gauche
                    infoBar.style.borderBottomRightRadius = '20px'; // Coins arrondis bas droit

                    const infoPanel = document.querySelector('#info-panel');
                    if (infoPanel) {
                        if (gameState.game.game_status === 'simultaneous_play') {
                            infoPanel.style.top = '100px';
                        } else {
                            infoPanel.style.top = '30px';
                        }
                        infoPanel.style.left = '30px';
                        infoPanel.style.right = '30px';

                    }                              
                }
                

            }
        };

        // Appliquer les dimensions initiales
        updateDimensions();
        
        // Écouter les changements d'orientation et de taille
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('orientationchange', () => {
            // Attendre que l'orientation soit complètement changée
            setTimeout(updateDimensions, 100);
        });
        

    }

    // Charger l'interface UI du jeu
    async loadGameUI() {
        // Vérifier si l'interface est déjà chargée
        if (this.gameUI) {
            return;
        }
        
        // Vérifier si un chargement est déjà en cours
        if (this._loadingPromise) {
            return this._loadingPromise;
        }
        
        this._loadingPromise = this._loadGameUIInternal();
        
        try {
            await this._loadingPromise;
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
            link.href = `./css/game-ui.css?v=${Date.now()}&force=${Math.random()}`;
            document.head.appendChild(link);
            
            // Charger le CSS du menu d'options
            const optionsLink = document.createElement('link');
            optionsLink.rel = 'stylesheet';
            optionsLink.href = `./css/options-menu.css?v=${Date.now()}&force=${Math.random()}`;
            document.head.appendChild(optionsLink);
            
            // Références vers les éléments UI
            this.gameUI = document.getElementById('game-ui-overlay');
            this.infoPanel = document.getElementById('info-panel');
            this.playerActionBar = document.getElementById('player-action-bar');
            this.validationBar = document.getElementById('validation-bar');
            this.biddingBar = document.getElementById('rectangle-action-bar');
            this.menuOnlyBar = document.getElementById('menu-only-bar');
            this.nextBar = document.getElementById('next-bar');
            this.gameBoardContainer = document.getElementById('game-board-container');
            
            // Configuration des event listeners
            this.setupUIEventListeners();
            
            // Réappliquer les dimensions responsives après le chargement
            this.setupResponsiveDimensions();
            
            // Charger le GameBoard3D si pas déjà chargé
            await this.loadGameBoard3D();
            
        } catch (error) {
            throw error;
        }
    }

    // Charger le GameBoard3D
    async loadGameBoard3D() {
        try {
            // Vérifier si le GameBoard3D n'est pas déjà chargé
            if (!window.gameBoard) {
                // Importer et créer le GameBoard3D
                const { GameBoard3D } = await import('../ui/GameBoard3D.js');
                this.gameBoard = new GameBoard3D('game-board-container');
                window.gameBoard =this.gameBoard;
                // Attendre que l'initialisation asynchrone soit terminée
                await window.gameBoard.ready;
            } else if (window.gameBoard.ready) {
                // Si gameBoard existe déjà, s'assurer qu'il est prêt
                await window.gameBoard.ready;
            }
        } catch (error) {
            console.error('Erreur lors du chargement de GameBoard3D:', error);
        }
    }

    // Configuration des event listeners pour l'UI
    setupUIEventListeners() {
        // Event listeners partagés pour toutes les barres d'actions
        this.setupSharedActionListeners();
        
        // Event listener pour le panneau d'information
        this.setupInfoPanelListener();
        
        // Event listeners pour les cases de la barre d'information
        this.setupInfoBarListeners();
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

        // Tous les boutons next dans toutes les interfaces
        const nextButtons = document.querySelectorAll('.action-next');
        nextButtons.forEach(button => {
            button.addEventListener('click', this.handleNextClick.bind(this));
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

            // Configuration de l'event listener pour le panneau d'information
        setupInfoPanelListener() {
            if (this.infoPanel) {
                this.infoPanel.addEventListener('click', (event) => {
                    // Vider le texte de l'info panel
                    this.infoPanel.textContent = '';
                });
            }
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

    // Fonction pour mettre les choix des actions à zero
    setActionChoicesToZero() {
        console.log('🔄 Remise à zéro des choix d\'actions');
        
        // Récupérer la barre d'action
        const actionBar = document.getElementById('player-action-bar');
        if (!actionBar) {
            console.error('❌ Barre d\'action non trouvée');
            return;
        }
        
        // Remettre à vide les cases 2, 3 et 4
        const case2Element = actionBar.querySelector('.action-slot:nth-child(2) .action-slot-text');
        const case3Element = actionBar.querySelector('.action-slot:nth-child(3) .action-slot-text');
        const case4Element = actionBar.querySelector('.action-slot:nth-child(4) .action-slot-text');
        
        if (case2Element) {
            case2Element.value = '';
            console.log('✅ Case 2 (développement) remise à vide');
        }
        
        if (case3Element) {
            case3Element.value = '';
            console.log('✅ Case 3 (fortification) remise à vide');
        }
        
        if (case4Element) {
            case4Element.value = '';
            console.log('✅ Case 4 (militarisation) remise à vide');
        }
        
        console.log('🎯 Remise à zéro terminée');
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



        if (gameState.game.myChaoTemp === undefined) {
            gameState.game.myChaoTemp = gameState.game.myClan.available_chao;
          }

        let chaoModification = gameState.game.myClan.available_chao - totalAdjustedCost - gameState.game.myChaoTemp;


        gameState.game.myChaoTemp = gameState.game.myClan.available_chao - totalAdjustedCost ;


        // console.log(`💰 Coût total ajusté: ${totalAdjustedCost}`);
        
        this.createChaoModificationAnimation(chaoModification);
        
    }

    // Fonction pour créer l'animation de modification des chao
    createChaoModificationAnimation(chaoModification) {
        // Ne pas créer de cercle si la modification est 0
        if (chaoModification === 0) {
    
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
            console.log('⚙️ Clic sur le bouton options');
            optionsMenu.open();
        }

            // Action du bouton validation (partagée par toutes les interfaces)
        handleValidateClick() {
            // Vérifier le statut du jeu pour déterminer l'action
            if (gameState.game.game_status === 'initial_placement') {
                this.handleInitialPlacementValidation();
            } else if (gameState.game.game_status === 'bidding_phase') {
                this.handleBiddingValidation();
            } else if (gameState.game.game_status === 'starting_spot_selection') {
                this.handleStartingSpotSelectionValidation();
            } else if (gameState.game.game_status === 'simultaneous_play') {
                this.handleSimultaneousPlayValidation();
            }
        }

        // Action du bouton next (partagée par toutes les interfaces)
        handleNextClick() {
            // Émettre un événement personnalisé que l'utilisateur pourra écouter
            const nextEvent = new CustomEvent('nextButtonClicked', {
                detail: {
                    currentActionBar: this.currentActionBar?.id || null,
                    timestamp: Date.now()
                }
            });
            document.dispatchEvent(nextEvent);
            
            // Log pour debug
            console.log('Bouton Next cliqué', nextEvent.detail);
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
                }
            }
        });
    }

    // Validation spécifique pour la phase de bidding
    handleBiddingValidation() {
        // Importer biddingPhase pour accéder au clan sélectionné
        import('../phases/biddingPhase.js').then(module => {
            const biddingPhase = module.biddingPhase;
            
            // Vérifier si un clan est sélectionné
            if (!biddingPhase.selectedClan) {
                uiManager.updateInfoPanel(i18n.t('game.phases.bidding.selection_clan'));
                return;
            }
            
            // Récupérer la valeur actuelle de l'enchère
            const currentBid = this.currentBid;
            
            // Envoyer le clan et l'enchère à l'API
            gameApi.sendClanBiddingToApi(biddingPhase.selectedClan.id, currentBid);
        });
    }

    handleStartingSpotSelectionValidation() {
        // Appeler la fonction de validation via gameApi
        gameApi.sendClanSelectionToApi();
    }

    // Validation spécifique pour la phase de jeu simultané
    handleSimultaneousPlayValidation() {
        // Importer simultaneousPlayPhase pour accéder à la fonction de validation
        import('../phases/simultaneous-play-phase/simultaneous-play-phase.js').then(module => {
            const simultaneousPlayPhase = module.simultaneousPlayPhase;
            
            // Appeler la fonction de validation de l'action
            simultaneousPlayPhase.handleActionValidation();
        });
    }

    // Fonction pour mettre à jour le panneau d'informations
    updateInfoPanel(text, processHelp = true) {
        if (this.infoPanel) {
            // Si le système d'aide est actif et processHelp est true, traiter le texte
            if (this.helpSystem && processHelp) {
                this.infoPanel.innerHTML = this.helpSystem.processText(text) || '';
            } else {
                this.infoPanel.innerHTML = text || '';
            }
        }
    }

    // Initialiser le système d'aide (appelé après l'initialisation de i18n)
    initializeHelpSystem(i18n) {
        this.helpSystem = initializeHelpSystem(i18n, this);
        console.log('✅ Système d\'aide initialisé dans UIManager');
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
        if (this.nextBar) this.nextBar.style.display = 'none';
        
        this.currentActionBar = null;
    }

        // Fonction pour afficher la barre d'actions complète (5 cases)
    showPlayerActionBar() {
        this.hideAllActionBars();
        if (this.playerActionBar) {
            this.playerActionBar.style.display = 'flex';
            this.currentActionBar = this.playerActionBar;
            
            // Forcer la mise à jour des dimensions après affichage
            requestAnimationFrame(() => {
                this.setupResponsiveDimensions();
            });
            
            // Appliquer la couleur du clan au bouton de validation
            this.applyClanColorToValidateButton();

                        
            // Mettre à jour la fraction des temples (4ème case)
            this.updateTempleFraction();
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
        }
    }

        // Fonction pour afficher la barre de validation simple (settings + check)
    showValidationBar() {
        this.hideAllActionBars();
        if (this.validationBar) {
            this.validationBar.style.display = 'flex';
            this.currentActionBar = this.validationBar;
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
        }
    }

        // Fonction pour afficher la barre de bidding (settings + info + boutons + check)
    showBiddingBar() {
        this.hideAllActionBars();
        if (this.biddingBar) {
            this.biddingBar.style.display = 'flex';
            this.currentActionBar = this.biddingBar;
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
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
        }
    }

    // Fonction pour afficher la barre de navigation avec next (settings + next)
    showNextBar() {
        this.hideAllActionBars();
        if (this.nextBar) {
            this.nextBar.style.display = 'flex';
            this.currentActionBar = this.nextBar;
            
            // Forcer la mise à jour des dimensions après affichage
            requestAnimationFrame(() => {
                this.setupResponsiveDimensions();
            });
            
            // Désactiver la sélection de texte
            this.disableTextSelection();
        }
    }

    // Configuration des event listeners spécifiques à la barre next
    setupNextBarEventListeners() {
        // Les event listeners sont déjà configurés dans setupSharedActionListeners()
        // Cette méthode peut être utilisée pour des configurations supplémentaires si nécessaire
        console.log('Event listeners configurés pour la barre next');
    }

    // Configuration des event listeners pour les cases de la barre d'information
    setupInfoBarListeners() {
        // Attendre que la barre d'information soit chargée
        const setupListeners = () => {
            const infoBar = document.getElementById('simultaneous-play-info-bar');
            if (!infoBar) {
                // Réessayer après un délai si la barre n'est pas encore chargée
                setTimeout(setupListeners, 100);
                return;
            }

            // Supprimer les anciens listeners pour éviter les doublons
            const existingSquares = infoBar.querySelectorAll('.info-square');
            existingSquares.forEach(square => {
                // Cloner et remplacer pour supprimer tous les event listeners
                const newSquare = square.cloneNode(true);
                square.parentNode.replaceChild(newSquare, square);
            });

            // Récupérer les 5 cases de la barre d'information (après nettoyage)
            const infoSquares = infoBar.querySelectorAll('.info-square');
            
            infoSquares.forEach((square, index) => {
                // Noms des cases pour le log
                const caseNames = ['Riz', 'Forêt', 'Mine', 'Temples', 'Chao'];
                const caseName = caseNames[index] || `Case ${index + 1}`;
                
                // Fonction de gestion du clic
                const handleClick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    
                    // Messages pour l'info panel selon la case
                    let infoMessage = '';
                    switch(index) {
                        case 0: // Riz
                            const riceText = square.querySelector('.home-text');
                            infoMessage = 'game.help.Developpement';
                            break;
                        case 1: // Forêt
                            const forestText = square.querySelector('.shield-text');
                            infoMessage = 'game.help.Fortification';
                            break;
                        case 2: // Mine
                            const mineText = square.querySelector('.sword-text');
                            infoMessage = 'game.help.Militarisation';
                            break;
                        case 3: // Temples
                            const numerator = square.querySelector('.fraction-numerator');
                            const denominator = square.querySelector('.fraction-denominator');
                            infoMessage = 'game.help.Temple';
                            break;
                        case 4: // Chao
                            const chaoText = square.querySelector('.chao-text');
                            infoMessage = 'game.help.Chao';
                            break;
                    }
                    
                    // Afficher le message dans l'info panel
                    if (infoMessage) {
                        // Importer le système de traduction et afficher le message
                        import('../../core/i18n.js').then(module => {
                            const i18n = module.i18n;
                            const message = i18n.t(infoMessage);
                            this.updateInfoPanel(message);
                        }).catch(error => {
                            // Fallback : afficher le message directement
                            this.updateInfoPanel(infoMessage);
                        });
                    }
                };
                
                // Ajouter UN SEUL listener pour éviter les doublons
                square.addEventListener('click', handleClick, { once: false });
                
                // Rendre la case cliquable visuellement
                square.style.cursor = 'pointer';
                square.style.pointerEvents = 'auto';
            });
        };
        
        // Démarrer la configuration des listeners
        setupListeners();
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

        }
        
        // Désactiver la sélection de texte
        this.disableTextSelection();
        
        // Afficher la barre
        infoBar.style.display = 'flex';

        
        // Réappliquer les event listeners après l'affichage
        this.setupInfoBarListeners();
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
            // this.updateBiddingText();
            
            // Mettre à jour le message de bidding
            this.updateBiddingMessage();
        }
    }

    // Gestion du clic sur le bouton plus  
    handleBiddingMoreClick() {
        if (this.currentBid < this.maxBid) {
            this.currentBid++;
            // this.updateBiddingText();
            
            // Mettre à jour le message de bidding
            this.updateBiddingMessage();
        }
    }

    // Mettre à jour le message de bidding
    updateBiddingMessage() {
        // Importer et appeler la fonction de biddingPhase
        import('../phases/biddingPhase.js').then(module => {
            module.biddingPhase.updateBiddingMessage();
        }).catch(error => {
        });
    }

    // Méthode de fallback pour créer les éléments de fraction manquants
    createFallbackFraction(current, max) {
        const biddingBar = document.querySelector('.bidding-info-case');
        if (!biddingBar) {
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
            }
        }
    }

    // Fonction pour mettre à jour le texte du chao avec available_chao du clan du joueur
    updateChaoText() {
        // Utiliser directement le clan du joueur actuel
        const playerClan = gameState.game.myClan;
        if (!playerClan) {
            return;
        }

        // Mettre à jour le texte du chao dans le 5ème carré
        const chaoText = document.querySelector('#simultaneous-play-info-bar .chao-text');
        if (chaoText) {
            chaoText.value = playerClan.available_chao.toString();
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
            return;
        }

        // Utiliser les compteurs pré-calculés du clan (mis à jour par simultaneousPlayPhase.updateAllClansResources())
        const riceCount = playerClan.numRices || 0;
        const forestCount = playerClan.numForests || 0;
        const mineCount = playerClan.numMines || 0;

        // Mettre à jour les textes dans les 3 premières cases
        const homeText = document.querySelector('#simultaneous-play-info-bar .home-text');
        const shieldText = document.querySelector('#simultaneous-play-info-bar .shield-text');
        const swordText = document.querySelector('#simultaneous-play-info-bar .sword-text');

        if (homeText) {
            homeText.value = riceCount.toString();
        }
        if (shieldText) {
            shieldText.value = forestCount.toString();
        }
        if (swordText) {
            swordText.value = mineCount.toString();
        }

        // Mettre à jour la fraction des temples (4ème case)
        this.updateTempleFraction();
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

        // Utiliser le compteur pré-calculé du clan (mis à jour par simultaneousPlayPhase.updateAllClansResources())
        const templeCount = playerClan.numTemples || 0;

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

                    }
                };
                
                requestAnimationFrame(expandAnimation);
            }
        };
        
        requestAnimationFrame(shrinkAnimation);
    }

    // Méthode pour attendre le clic sur le bouton next
    async waitForNext() {
        this.showNextBar();
    
        await new Promise((resolve) => {
            const handleNext = () => {
                document.removeEventListener('nextButtonClicked', handleNext);
                resolve();
            };
            document.addEventListener('nextButtonClicked', handleNext);
        });
        this.showMenuOnlyBar();
        this.updateInfoPanel('');
    }

    // Afficher le message de victoire avec tableau de classement
    showVictoryMessage(rankedClans, myClan, i18n) {
        // Créer le tableau de classement
        let tableHTML = `
            <div class="victory-container">
                <h2>${i18n.t('game.phases.simultaneous_play.victory_table.title')}</h2>
                <table class="victory-table">
                    <thead>
                        <tr>
                            <th>${i18n.t('game.phases.simultaneous_play.victory_table.rank')}</th>
                            <th>${i18n.t('game.phases.simultaneous_play.victory_table.clan')}</th>
                            <th>${i18n.t('game.phases.simultaneous_play.victory_table.temples')}</th>
                            <th>${i18n.t('game.phases.simultaneous_play.victory_table.honor')}</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        rankedClans.forEach((clan, index) => {
            const rank = index + 1;
            const clanColorName = i18n.t(`colors.${clan.color_name}`);
            const isMyRow = clan === myClan ? 'my-clan-row' : '';
            
            tableHTML += `
                <tr class="${isMyRow}">
                    <td>${rank}</td>
                    <td>Clan ${clanColorName}</td>
                    <td class="temples-column">${clan.numTemples}</td>
                    <td class="honneur-column">${clan.honneur}</td>
                </tr>
            `;
        });

        tableHTML += `
                    </tbody>
                </table>
        `;

        // Ajouter le message personnalisé
        const winner = rankedClans[0];
        const templeLeader = rankedClans.reduce((max, clan) => 
            clan.numTemples > max.numTemples ? clan : max
        );

        let personalMessage = '';
        if (winner === myClan) {
            personalMessage = i18n.t('game.phases.simultaneous_play.victory_table.winner_congratulations');
        } else if (templeLeader === myClan && winner !== myClan) {
            personalMessage = i18n.t('game.phases.simultaneous_play.victory_table.temple_leader_message');
        } else {
            const winnerColorName = i18n.t(`colors.${winner.color_name}`);
            personalMessage = i18n.t('game.phases.simultaneous_play.victory_table.game_over_message', {
                winnerClan: winnerColorName
            });
        }

        tableHTML += `
                <div class="victory-message">
                    <p>${personalMessage}</p>
                </div>
                <div class="victory-message">
                    <p>${i18n.t('game.phases.simultaneous_play.victory_table.lien_bgg')}</p>
                </div>
            </div>
        `;

        // Ajouter les styles CSS
        const styles = `
            <style>
                .temples-column {
                    font-weight: bold;
                    font-size: 150%;
                }
                .honneur-column {
                }
                p {
                    color: white;
                }

                .victory-container {

                    color: white;
                    padding: 0px;
                    border-radius: 10px;
                    margin: 0px;
                    text-align: center;
                }
                .victory-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .victory-table th, .victory-table td {
                    border: 1px solid #555;
                    padding: 8px;
                    text-align: center;
                }
                .victory-table th {
                    background-color: #333;
                    font-weight: bold;
                }
                .my-clan-row {
                    background-color: rgba(255, 215, 0, 0.3) !important;
                    font-weight: bold;
                }
                .victory-message {
                    margin-top: 15px;
                    font-size: 1.1em;
                    font-weight: bold;
                }
            </style>
        `;

        // Afficher le contenu dans l'info panel
        this.updateInfoPanel(styles + tableHTML);
    }
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager();

// Exposer uiManager globalement pour l'accès depuis d'autres modules
window.uiManager = uiManager; 