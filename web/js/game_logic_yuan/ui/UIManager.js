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
            this.menuOnlyBar = document.getElementById('menu-only-bar'); // Nouvelle barre
            
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
        console.log('🔘 Bouton de validation cliqué');
        
        // Vérifier le statut du jeu pour déterminer l'action
        if (gameState.game.game_status === 'initial_placement') {
            this.handleInitialPlacementValidation();
        } else if (gameState.game.game_status === 'bidding_phase') {
            this.handleBiddingValidation();
        } else if (gameState.game.game_status === 'starting_spot_selection') {
            this.handleStartingSpotSelectionValidation();
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
        } else {
            console.warn('⚠️ Barre menu-only non initialisée');
        }
    }

    // Fonction pour afficher la barre d'information de la phase simultaneous_play
    showSimultaneousPlayInfoBar() {
        // Masquer toutes les autres barres
        this.hideAllActionBars();
        
        // Créer la barre d'information si elle n'existe pas
        let infoBar = document.getElementById('simultaneous-play-info-bar');
        if (!infoBar) {
            infoBar = this.createSimultaneousPlayInfoBar();
        }
        
        // Mettre à jour le texte du 5ème carré (chao) avec available_chao du clan du joueur
        this.updateChaoText();
        
        // Mettre à jour les ressources (3 premières cases)
        this.updateResources();
        
        // Afficher la barre
        if (infoBar) {
            infoBar.style.display = 'flex';
            console.log('🎯 Barre d\'information simultaneous_play affichée');
        }
    }

    // Fonction pour créer la barre d'information de la phase simultaneous_play
    createSimultaneousPlayInfoBar() {
        // Créer le conteneur principal
        const infoBar = document.createElement('div');
        infoBar.id = 'simultaneous-play-info-bar';
        infoBar.className = 'simultaneous-play-info-bar';
        
        // Créer les 5 carrés
        for (let i = 0; i < 5; i++) {
            const square = document.createElement('div');
            square.className = 'info-square';
            
            // Premier carré avec l'icône de riz, le cercle et l'icône de maison
            if (i === 0) {
                const riceIcon = document.createElement('img');
                riceIcon.src = './images/icon/riceIcon.webp';
                riceIcon.alt = 'Riz';
                riceIcon.className = 'rice-icon';
                square.appendChild(riceIcon);
                
                const homeCircle = document.createElement('div');
                homeCircle.className = 'home-circle';
                square.appendChild(homeCircle);
                
                const homeText = document.createElement('input');
                homeText.type = 'text';
                homeText.className = 'home-text';
                homeText.value = '2';
                square.appendChild(homeText);
                
                const homeIcon = document.createElement('img');
                homeIcon.src = './images/icon/homeIcon.webp';
                homeIcon.alt = 'Maison';
                homeIcon.className = 'home-icon';
                square.appendChild(homeIcon);
            }
            // Deuxième carré avec l'icône de forêt, le cercle et l'icône de bouclier
            else if (i === 1) {
                const forestIcon = document.createElement('img');
                forestIcon.src = './images/icon/forestIcon.webp';
                forestIcon.alt = 'Forêt';
                forestIcon.className = 'forest-icon';
                square.appendChild(forestIcon);
                
                const shieldCircle = document.createElement('div');
                shieldCircle.className = 'shield-circle';
                square.appendChild(shieldCircle);
                
                const shieldText = document.createElement('input');
                shieldText.type = 'text';
                shieldText.className = 'shield-text';
                shieldText.value = '0';
                square.appendChild(shieldText);
                
                const shieldIcon = document.createElement('img');
                shieldIcon.src = './images/icon/shieldIcon.webp';
                shieldIcon.alt = 'Bouclier';
                shieldIcon.className = 'shield-icon';
                square.appendChild(shieldIcon);
            }
            // Troisième carré avec l'icône de mine, le cercle et l'icône d'épée
            else if (i === 2) {
                const mineIcon = document.createElement('img');
                mineIcon.src = './images/icon/mineIcon.webp';
                mineIcon.alt = 'Mine';
                mineIcon.className = 'mine-icon';
                square.appendChild(mineIcon);
                
                const swordCircle = document.createElement('div');
                swordCircle.className = 'sword-circle';
                square.appendChild(swordCircle);
                
                const swordText = document.createElement('input');
                swordText.type = 'text';
                swordText.className = 'sword-text';
                swordText.value = '0';
                swordText.maxLength = 3;
                square.appendChild(swordText);
                
                const swordIcon = document.createElement('img');
                swordIcon.src = './images/icon/swordsIcon.webp';
                swordIcon.alt = 'Épée';
                swordIcon.className = 'sword-icon';
                square.appendChild(swordIcon);
            }
            // Quatrième carré avec l'icône de pagode, le cercle et une fraction modifiable
            else if (i === 3) {
                const pagodaIcon = document.createElement('img');
                pagodaIcon.src = './images/icon/pagodaIcon.webp';
                pagodaIcon.alt = 'Pagode';
                pagodaIcon.className = 'pagoda-icon';
                square.appendChild(pagodaIcon);
                
                const fractionCircle = document.createElement('div');
                fractionCircle.className = 'fraction-circle';
                square.appendChild(fractionCircle);
                
                const numeratorInput = document.createElement('input');
                numeratorInput.type = 'text';
                numeratorInput.className = 'fraction-numerator';
                numeratorInput.value = '0';
                square.appendChild(numeratorInput);
                
                const slash = document.createElement('input');
                slash.type = 'text';
                slash.className = 'fraction-slash';
                slash.value = '/';
                square.appendChild(slash);
                
                const denominatorInput = document.createElement('input');
                denominatorInput.type = 'text';
                denominatorInput.className = 'fraction-denominator';
                denominatorInput.value = '6';
                square.appendChild(denominatorInput);
            }
            // Cinquième carré avec l'icône de chao et le cercle
            else if (i === 4) {
                const chaoIcon = document.createElement('img');
                chaoIcon.src = './images/icon/chaoIcon.webp';
                chaoIcon.alt = 'Chao';
                chaoIcon.className = 'chao-icon';
                square.appendChild(chaoIcon);
                
                const chaoCircle = document.createElement('div');
                chaoCircle.className = 'chao-circle';
                square.appendChild(chaoCircle);
                
                const chaoText = document.createElement('input');
                chaoText.type = 'text';
                chaoText.className = 'chao-text';
                chaoText.value = '0';
                square.appendChild(chaoText);
            }
            
            infoBar.appendChild(square);
        }
        
        // Ajouter la barre au body
        document.body.appendChild(infoBar);
        
        console.log('🎯 Barre d\'information simultaneous_play créée');
        return infoBar;
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
        // Récupérer le gameUser du joueur actuel
        const myGameUser = gameState.getMyGameUser();
        if (!myGameUser) {
            console.warn('⚠️ GameUser du joueur actuel non trouvé');
            return;
        }

        // Récupérer le clan du joueur
        const playerClan = gameState.game.clans.find(clan => clan.id === myGameUser.clan_id);
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur non trouvé');
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

    // Fonction pour mettre à jour les ressources (3 premières cases)
    updateResources() {
        // Récupérer le gameUser du joueur actuel
        const myGameUser = gameState.getMyGameUser();
        if (!myGameUser) {
            console.warn('⚠️ GameUser du joueur actuel non trouvé');
            return;
        }

        // Récupérer le clan du joueur
        const playerClan = gameState.game.clans.find(clan => clan.id === myGameUser.clan_id);
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur non trouvé');
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

        console.log(`📊 Ressources mises à jour pour le clan ${playerClan.name}: Riz=${riceCount}, Forêt=${forestCount}, Mine=${mineCount}`);
    }

    // Fonction pour récupérer la couleur du clan du joueur actuel
    getPlayerClanColor() {
        // Récupérer le gameUser du joueur actuel
        const myGameUser = gameState.getMyGameUser();
        if (!myGameUser) {
            console.warn('⚠️ GameUser du joueur actuel non trouvé pour la couleur');
            return null;
        }

        // Récupérer le clan du joueur
        const playerClan = gameState.game.clans.find(clan => clan.id === myGameUser.clan_id);
        if (!playerClan) {
            console.warn('⚠️ Clan du joueur non trouvé pour la couleur');
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
}

// Instance unique du gestionnaire UI
export const uiManager = new UIManager(); 