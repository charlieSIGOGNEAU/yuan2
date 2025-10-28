import { uiManager } from '../../ui/UIManager.js';
import { gameState, Lake } from '../../gameState.js';
import { biddingPhase } from '../biddingPhase.js';
import { i18n } from '../../../core/i18n.js';
import * as THREE from 'three';
import { developpementAndMore } from './developpement.js';
import { fortification } from './fortification.js';
import { militarisation } from './militarisation.js';
import { arrowManager } from '../../gameplay/arrowManager.js';



export const simultaneousPlayPhase = {
    // Stockage des cercles actuels (plusieurs cercles pour les actions)
    currentCircle: null, // { circle: THREE.Mesh, territory: Territory } - pour la sélection
    currentCircles: [], // [{ circle: THREE.Mesh, action: Action, territory: Territory }] - pour les actions
    processedTurns: 1,
    gameBoard: null,
    inProgress: false,

    

    simultaneousPlayPhase(gameBoard) {
        if (this.inProgress) {
            return;
        }
        this.gameBoard = gameBoard;
        this.inProgress = true;
        this.simultaneousPlayPhaseRecursive();
    },

    async simultaneousPlayPhaseRecursive(){
        if (this.processedTurns === 1) {

            // Exécuter getAdjacentTerritories pour tous les territoires
            console.log('🔄 Initialisation des territoires adjacents...');
            for (const territory of gameState.game.territories) {
                territory.updateProvinceTerritories();
            }
            console.log('✅ Territoires adjacents initialisés');

            // Initialiser tous les lacs
            Lake.initializeAllLakes();

            // Exécuter getConnectedTerritories pour tous les territoires
            console.log('🔄 Initialisation des territoires connectes...');
            for (const territory of gameState.game.territories) {
                territory.updateConnectedProvinces();
            }
            console.log('✅ Territoires connectes initialisés');

            // Récupérer le clan du joueur actuel
            gameState.game.setMyClanFromVictoryBidding(gameState.myGameUserId);

            // Afficher la barre d'information spécifique à cette phase
            uiManager.showSimultaneousPlayInfoBar();

            arrowManager.initialize(gameBoard);

            //  repositionner tout, pour repositioner infopanel
            uiManager.setupResponsiveDimensions();

            await this.processVictoryBiddings(gameBoard);
            // Mettre à jour les compteurs de ressources de tous les clans
            this.updateAllClansResources();
            uiManager.updateSimultaneousPlayInfoBar();

        }


        if (this.processedTurns + 1 === gameState.game.simultaneous_play_turn) {

            developpementAndMore.animation = true;
            fortification.animation = true;
            militarisation.animation = true;
            // message de debut de tour au cas ou tout les joueurs auraient passer leur tour
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.tour_debut', {tour: this.processedTurns + 1}));
            // uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.attaque_free_urbanization'));
        }
        else {
            developpementAndMore.animation = false;
            fortification.animation = false;
            militarisation.animation = false;
        }

        if (this.processedTurns === gameState.game.simultaneous_play_turn) {
            this.actionsOfPlayer()
        }
        else {
            
            // Désactiver la détection des clics sur les territoires
            this.disableTerritoryClickDetection(gameBoard);

            this.removeCurrentCircle(gameBoard) ;

            // Mettre à jour les chaos disponibles avec le coût des actions
            this.updateAvailableChao(this.processedTurns);
            uiManager.updateSimultaneousPlayInfoBar();
            
            // Créer des cercles pour toutes les actions du tour actuel
            await this.createActionCircles(gameBoard);

            uiManager.showNextBar();

            console.log('🔄 debut developpement');
            await developpementAndMore.developpement(gameBoard, this.processedTurns);
            console.log('🔄 fin developpement');

            console.log('🔄 debut fortification');
            await fortification.setupFortification(gameBoard, this.processedTurns, true); //true pour preMilitarization
            console.log('🔄 fin fortification');
            console.log('🔄 debut militarisation');
            await militarisation.setupMilitarisation(gameBoard, this.processedTurns);
            console.log('🔄 fin militarisation');
            console.log('🔄 debut fortification');
            await fortification.setupFortification(gameBoard, this.processedTurns, false); //false pour postMilitarization
            console.log('🔄 fin fortification');
            await this.tooManyWarriors();


            // Mettre à jour les compteurs de ressources de tous les clans
            this.updateAllClansResources();
            uiManager.updateSimultaneousPlayInfoBar();

            // Vérifier si la partie est terminée
            await this.isGameOver(false);

            // tester les chao
            this.chaoTest();

            console.log('🔄 fin du processedTurns:', this.processedTurns);
            this.removeAllActionCircles(gameBoard);
            this.processedTurns +=1;
            console.log('🔄 processedTurns:', this.processedTurns);
            console.log('🔄 gameState.game.simultaneous_play_turn:', gameState.game.simultaneous_play_turn);
            await this.simultaneousPlayPhaseRecursive();
        }

    },

    actionsOfPlayer(){
        this.inProgress = false;

        // affiche la barre d'action a 6 cases
        uiManager.showPlayerActionBar();

        // Activer la détection de clic sur les territoires
        this.setupTerritoryClickDetection(gameBoard);

        // mes le chois des action a zero
        uiManager.setActionChoicesToZero();
    },


    chaoTest(){
        const clansError = gameState.game.clans.filter(clan => clan.available_chao < 0);
        if (clansError.length > 0) {
        //creer une string qui comporte tout les coulor des clansError
            const clansErrorString = clansError.map(clan => clan.color_name).join(', ');
            console.log(`💰 clansErrorString: ${clansErrorString}`);
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.chao_error', {clansErrorString: clansErrorString}));
        }
    },


    async tooManyWarriors(){
        const actions = gameState.game.actions.filter(action => action.turn === this.processedTurns);
        const territories = actions.map(action => action.getTerritory()).filter(territory => territory !== null);
        console.log("territories:", territories);

        if (territories.filter(territory => territory.warriors > 3).length > 0) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.too_many_warriors'));
            await uiManager.waitForNext();
        }

        for (const action of actions) {
            const territory = action.getTerritory();
            if (territory && territory.warriors > 3) {
                const toDelete = territory.warriors - 3;
                for (let i = 0; i < toDelete; i++) {
                    const mesh = territory.warriors_mesh.pop();
                    if (mesh) {
                        arrowManager.animateAndRemoveMesh(mesh);
                    }
                }
                territory.warriors = 3;


            }
        }
    },



    isActionPossible(actionData){
        let territory = null;
        if (actionData.position_q !== null && actionData.position_r !== null) {
            territory = gameState.getTerritoryByPosition(actionData.position_q, actionData.position_r);
        }
        const development_level = actionData.development_level;
        const fortification_level = actionData.fortification_level;
        const militarisation_level = actionData.militarisation_level;
        const playerClan = gameState.game.myClan;

        if (gameState.game.myChaoTemp < 0) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.not_chao'));
            return {possible: false, saveMessage: true};
        }


        // si le territoire n'est pas trouvé et qu'il y a une action, alors l'action est impossible
        if (!territory && (development_level > 0 || fortification_level > 0 || militarisation_level > 0)) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.territory_not_found'));
            return {possible: false, saveMessage: true};
        }

        // si pas d'action
        if (development_level === 0 && fortification_level === 0 && militarisation_level === 0) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.not_action'));
            return {possible: true, saveMessage: true};
        }

        if (territory) {
            // development province ennemie
            if ((territory.clan_id !== null && territory.clan_id !== playerClan.id && development_level) > 0) {
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.development_not_possible'));
                return {possible: false, saveMessage: true};
            }
            // development province non connectee
            if ((territory.clan_id === null) && (development_level === 1 || development_level === 2) ) {
                if (territory.connectedProvinces.every(province => province.clan_id !== playerClan.id)) {
                    uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.development_not_connected'));
                    return {possible: false, saveMessage: true};
                }
            }
            // possible urbanization gratuite, enlever le cas ou la province est une plaine
            if (territory.clan_id === null && development_level > 0 && fortification_level === 0 && territory.type !== 'plain') {
                // Étape 1 : récupérer les territoires adjacents libres
                let freeAdjacent = territory.adjacentProvinces.filter(t => t.clan_id === null);
                freeAdjacent.push(territory);
                console.log("freeAdjacent:", freeAdjacent);

                // Étape 2 : récupérer tous les territoires du joueur adjacents à ces libres
                const playerAdjacent = freeAdjacent.flatMap(t => 
                    t.adjacentProvinces.filter(adj => adj.clan_id === playerClan)
                )
                console.log("playerAdjacent:", playerAdjacent);
                if (playerAdjacent.length === 0) {
                    uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.possible_urbanization'));
                    return {possible: true, saveMessage: true};
                }
            }

            if ( development_level === null && fortification_level > 0 && militarisation_level === 0) {
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.enemy_fortification'));
                return {possible: false, saveMessage: true};
            }
            if ( territory.clan_id === playerClan.id && territory.construction_type === 'village' && [null, 0, 1].includes(fortification_level) && militarisation_level > 0) {
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.recruitment_impossible'));
                return {possible: false, saveMessage: true};
            }

            // vous avez assez de province pour faire un niveau 2 de développement gratuitement a la place d'un niveau 1

        }
        return {possible: true, saveMessage: false};
        
    },

    isGameOver(force = false) {
        const objective = {
            0: 9,
            1: 9,
            2: 9,
            3: 9,
            4: 9,
            5: 8,
            6: 7,
            7: 6,
            8: 6,
            9: 5,
            10: 5,
            11: 4,
            12: 4,
            13: 3
        }
        
        // Vérifier s'il y a des gagnants potentiels
        let potentialWinner = [];
        for (const clan of gameState.game.clans) {
            const numTemples = clan.numTemples;
            if (numTemples >= objective[gameState.game.simultaneous_play_turn-1]) {
                potentialWinner.push(clan);
            }
        }
        console.log("potentialWinner:", potentialWinner);

        // S'il n'y a pas de gagnant, ne rien faire
        if (potentialWinner.length === 0 && !force) {
            return;
        }


        // Créer le classement complet de tous les joueurs
        // Priorité 1: nombre de temples (descendant)
        // Priorité 2: honneur (descendant) en cas d'égalité de temples
        let rankedClans = gameState.game.clans.sort((a, b) => {
            if (a.numTemples !== b.numTemples) {
                return b.numTemples - a.numTemples; // Plus de temples = meilleur rang
            }
            return b.honneur - a.honneur; // Plus d'honneur = meilleur rang en cas d'égalité
        });
        // si force est true, donc victoire par forfait des autre joueurs, donc on met le clan du joueur actuel en premier
        if (force) {
            rankedClans.sort((a, b) => {
                if  (a.id === gameState.game.myClan.id) {
                    return -1;
                }
                else {
                    return 0;
                }
            });
        }


        // Afficher le tableau de classement avec le message personnalisé
        import('../../../core/i18n.js').then(i18nModule => {
            const i18n = i18nModule.i18n;
            uiManager.showVictoryMessage(rankedClans, gameState.game.myClan, i18n);
        });

        // Convertir les clans classés en gameUsers classés pour l'API
        const rankedGameUsers = rankedClans.map(clan => {
            return gameState.game.game_users.find(gameUser => gameUser.clan_id === clan.id);
        });
        console.log("rankedGameUsers:", rankedGameUsers);

        // Envoyer les résultats à l'API
        import('../../gameApi.js').then(module => {
            module.gameApi.sendVictoryGameToApi(rankedGameUsers);
        });

        // changer l'action du bouton valide par le fais de quiter la partie et enlever la bar d'action
    },



    // Configuration de la détection de clic sur les territoires
    setupTerritoryClickDetection(gameBoard) {
        console.log('🎯 Configuration de la détection de clic sur les territoires');
        
        // Définir le callback pour les clics
        const handleTerritoryClick = async (hexCoords, worldPoint) => {
            console.log(`🎯 Clic détecté à (${hexCoords.q}, ${hexCoords.r})`);
         
            
            // Trouver le territoire à cette position
            const territory = gameState.getTerritoryByPosition(hexCoords.q, hexCoords.r);
            console.log("territory trouve :", territory);
            
            if (!territory) {
                console.log('⚠️ Aucun territoire trouvé à cette position');
                return;
            }
            
            console.log(`📍 Territoire trouvé: type=${territory.type}, clan_id=${territory.clan_id}`);
            
            // Vérifier si le territoire est du bon type
            const validTypes = ['rice', 'plain', 'mine', 'forest'];
            
            if (validTypes.includes(territory.type)) {
                console.log(`✅ Territoire valide: ${territory.type}`);
                
                // Supprimer l'ancien cercle s'il existe
                if (this.currentCircle) {
                    console.log('🗑️ Suppression de l\'ancien cercle');
                    this.removeCurrentCircle(gameBoard);
                }
                
                // Créer le nouveau cercle
                console.log('🔵 Création d\'un nouveau cercle');
                await this.createTerritoryCircle(gameBoard, territory);
                
            } else {
                console.log(`❌ Territoire invalide: type=${territory.type}`);
            }
        };

        // Utiliser le système de callback de GameBoard3D
        gameBoard.detectClickOnly(handleTerritoryClick);
        
        // Stocker la référence pour pouvoir la supprimer plus tard
        this.clickHandler = handleTerritoryClick;
        this.currentGameBoard = gameBoard;
        
        console.log('✅ Détection de clic sur les territoires activée');
    },

    // Désactiver la détection de clic sur les territoires
    disableTerritoryClickDetection(gameBoard) {
        gameBoard.disableClickCallback();
        
        // Nettoyer les références
        this.clickHandler = null;
        this.currentGameBoard = null;
        
        console.log('✅ Détection de clic sur les territoires désactivée');
    },

    // Créer un cercle sur un territoire
    async createTerritoryCircle(gameBoard, territory) {
        if (!gameBoard) return;
        
        console.log(`🔵 Création d'un cercle pour le territoire ${territory.type} à (${territory.position.q}, ${territory.position.r})`);
        
        // Récupérer la couleur du clan du joueur
        const playerClan = gameState.game.myClan;
        const clanColor = playerClan ? playerClan.color : 0xffffff; // Blanc par défaut si pas de clan
        
        console.log(`🎨 Couleur du clan du joueur: ${clanColor} (${playerClan ? playerClan.name : 'aucun clan'})`);
        
        const circle = await this.createCircle(gameBoard, territory.position, 1.0, 0.1, clanColor);
        
        if (!circle) {
            console.error('❌ Impossible de créer le cercle pour le territoire');
            return;
        }
        
        // Stocker le cercle avec son territoire associé
        this.currentCircle = {
            circle: circle,
            territory: territory
        };
        
        console.log(`✅ Cercle créé pour le territoire ${territory.type} avec la couleur du clan`);
    },

    // Créer un cercle sur une position donnée (utilisant le MeepleManager)
    async createCircle(gameBoard, position, scale = 1.0, height = 0, color = 0xffffff) {
        // Utiliser le MeepleManager pour créer l'instance de cercle
        const circle = await gameBoard.meepleManager.createCircleInstance('selection', position, scale, height, color, {
            position: position
        });
        
        if (!circle) {
            console.error('❌ Impossible de créer l\'instance de cercle');
            return null;
        }
        
        // Convertir les coordonnées hexagonales en cartésiennes pour le positionnement
        const cartesianPos = gameBoard.hexToCartesian(position);
        circle.position.set(cartesianPos.x, height, cartesianPos.z);
        
        // Ajouter au workplane et au tableau des cercles de GameBoard3D
        gameBoard.workplane.add(circle);
        gameBoard.circles.push(circle);
        
        console.log(`🔵 Cercle créé via MeepleManager à (${position.q}, ${position.r}) avec scale ${scale} et couleur ${color}`);
        return circle;
    },

    // Supprimer le cercle actuel (et tous les cercles d'actions)
    removeCurrentCircle(gameBoard) {
        if (!gameBoard) return;
        
        // Supprimer le cercle de sélection s'il existe
        if (this.currentCircle) {
            gameBoard.workplane.remove(this.currentCircle.circle);
            
            // Supprimer aussi du tableau circles de GameBoard3D si présent
            const index = gameBoard.circles.indexOf(this.currentCircle.circle);
            if (index > -1) {
                gameBoard.circles.splice(index, 1);
            }
            
            console.log(`🗑️ Cercle de sélection supprimé pour le territoire ${this.currentCircle.territory.type}`);
            this.currentCircle = null;
        }
        
        // Supprimer tous les cercles d'actions
        this.removeAllActionCircles(gameBoard);
    },

    // Créer des cercles pour toutes les actions du tour actuel
    async createActionCircles(gameBoard) {
        if (!gameBoard) {
            console.error('❌ gameBoard non disponible pour créer les cercles d\'actions');
            return;
        }

        console.log(`🔵 Création des cercles pour les actions du tour ${this.processedTurns}`);
        
        // Récupérer toutes les actions du tour actuel
        const actions = gameState.game.actions.filter(action => action.turn === this.processedTurns);
        console.log(`📋 ${actions.length} actions trouvées pour le tour ${this.processedTurns}`);

        // Supprimer les anciens cercles d'actions s'ils existent
        this.removeAllActionCircles(gameBoard);

        // Grouper les actions par position pour gérer les cercles multiples
        const actionsByPosition = new Map();
        
        for (const action of actions) {
            try {
                const territory = action.getTerritory();
                const clan = action.getClan();
                
                if (!territory || !clan) {
                    console.warn(`⚠️ Territoire ou clan non trouvé pour l'action ID ${action.id}`);
                    continue;
                }

                // Créer une clé unique pour la position
                const positionKey = `${territory.position.q},${territory.position.r}`;
                
                if (!actionsByPosition.has(positionKey)) {
                    actionsByPosition.set(positionKey, []);
                }
                
                actionsByPosition.get(positionKey).push({
                    action: action,
                    territory: territory,
                    clan: clan
                });
                
            } catch (error) {
                console.error(`❌ Erreur lors du traitement de l'action ID ${action.id}:`, error);
            }
        }

        // Créer les cercles pour chaque position
        for (const [positionKey, actionGroup] of actionsByPosition) {
            const firstAction = actionGroup[0];
            const territory = firstAction.territory;
            const cartesianPos = territory.getCartesianPosition(gameBoard);
            
            console.log(`📍 Position (${territory.position.q}, ${territory.position.r}): ${actionGroup.length} action(s)`);
            
            // Créer un cercle pour chaque action à cette position, avec des tailles croissantes
            for (let i = 0; i < actionGroup.length; i++) {
                const actionData = actionGroup[i];
                const scale = 1.0 + (i * 0.15); // Premier cercle: 1.0, puis 1.15, 1.30, etc.
                const height = 0.1; // Hauteur fixe pour tous les cercles
                const isMultiple = actionGroup.length > 1; // Vérifier s'il y a plusieurs cercles
                
                try {
                    const circle = await this.createActionCircle(gameBoard, cartesianPos, actionData.clan.color, scale, height, isMultiple);
                    
                    if (circle) {
                        // Configurer le rendu pour éviter les problèmes de transparence
                        circle.frustumCulled = false; // Désactiver le culling
                        
                        // Stocker le cercle avec ses informations
                        this.currentCircles.push({
                            circle: circle,
                            action: actionData.action,
                            territory: actionData.territory,
                            clan: actionData.clan,
                            scale: scale,
                            height: height
                        });
                        
                        console.log(`🔵 Cercle créé pour l'action du clan ${actionData.clan.name} (${actionData.clan.color}) sur territoire (${territory.position.q}, ${territory.position.r}) avec scale ${scale} (multiple: ${isMultiple})`);
                    }
                } catch (error) {
                    console.error(`❌ Erreur lors de la création du cercle pour l'action ID ${actionData.action.id}:`, error);
                }
            }
        }

        console.log(`✅ ${this.currentCircles.length} cercles d'actions créés`);
        
        // Trier les cercles par profondeur pour un rendu correct
        this.sortCirclesByDepth();
    },

    // Trier les cercles par profondeur pour éviter les problèmes de transparence
    sortCirclesByDepth() {
        // Trier par scale décroissant (plus petit = rendu en dernier = au-dessus)
        this.currentCircles.sort((a, b) => {
            return b.scale - a.scale; // Plus grand scale = rendu en premier (en dessous)
        });
        
        // Mettre à jour les renderOrder selon le tri
        this.currentCircles.forEach((circleData, index) => {
            circleData.circle.renderOrder = 1000 + index;
            console.log(`🔄 Cercle ${index}: scale=${circleData.scale}, renderOrder=${1000 + index} (plus petit = plus haut renderOrder)`);
        });
    },

    // Créer un cercle pour une action spécifique
    async createActionCircle(gameBoard, position, color, scale = 1.0, height = 0.1, isMultiple = false) {
        try {
            // Utiliser le MeepleManager pour créer l'instance de cercle
            const circle = await gameBoard.meepleManager.createCircleInstance('selection', position, scale, height, color, {
                position: position
            });
            
            if (!circle) {
                console.error('❌ Impossible de créer l\'instance de cercle d\'action');
                return null;
            }
            
            // Positionner le cercle à la hauteur spécifiée
            circle.position.set(position.x, height, position.z);
            
            // Configurer le matériau pour éviter les problèmes de transparence
            circle.traverse((child) => {
                if (child.isMesh && child.material) {
                    // Cloner le matériau pour éviter les conflits
                    const material = child.material.clone();
                    
                    // Configuration pour éviter les problèmes de transparence
                    material.transparent = true;
                    material.alphaTest = 0.1; // Seuil d'alpha test pour éviter les artefacts
                    material.depthWrite = false; // Important pour la transparence
                    material.depthTest = true;
                    material.side = THREE.DoubleSide;
                    
                    // Ajuster l'opacité selon le contexte
                    if (isMultiple) {
                        material.opacity = 1.0; // Opacité complète pour les cercles multiples
                    } else {
                        material.opacity = 0.8; // Opacité normale pour les cercles simples
                    }
                    
                    // Configuration du blending pour éviter les artefacts
                    material.blending = THREE.NormalBlending;
                    
                    child.material = material;
                }
            });
            
            // Ajouter au workplane et au tableau des cercles de GameBoard3D
            gameBoard.workplane.add(circle);
            gameBoard.circles.push(circle);
            
            return circle;
        } catch (error) {
            console.error('❌ Erreur lors de la création du cercle d\'action:', error);
            return null;
        }
    },

    // Supprimer tous les cercles d'actions
    removeAllActionCircles(gameBoard) {
        if (!gameBoard || this.currentCircles.length === 0) return;
        
        console.log(`🗑️ Suppression de ${this.currentCircles.length} cercles d'actions`);
        
        for (const circleData of this.currentCircles) {
            gameBoard.workplane.remove(circleData.circle);
            
            // Supprimer aussi du tableau circles de GameBoard3D si présent
            const index = gameBoard.circles.indexOf(circleData.circle);
            if (index > -1) {
                gameBoard.circles.splice(index, 1);
            }
        }
        
        this.currentCircles = [];
        console.log(`✅ Tous les cercles d'actions supprimés`);
    },

    // Obtenir le territoire du cercle actuel
    getCurrentTerritory() {
        return this.currentCircle ? this.currentCircle.territory : null;
    },

    // Fonction pour gérer la validation de l'action
    handleActionValidation() {
        console.log('🎯 Validation de l\'action dans simultaneous_play_phase');
        

        let territory = null;
        if (this.currentCircle) {        
            territory = this.currentCircle.territory;
            console.log(`📍 Territoire sélectionné: ${territory.type} à (${territory.position.q}, ${territory.position.r})`);
        }
        
        // Récupérer les niveaux depuis la barre d'action
        const actionBar = document.getElementById('player-action-bar');
        if (!actionBar) {
            console.error('❌ Barre d\'action non trouvée');
            return;
        }
        
        // Fonction pour convertir le texte en niveau
        const textToLevel = (text) => {
            switch (text.trim()) {
                case '': return 0;
                case 'I': return 1;
                case 'II': return 2;
                case 'III': return 3;
                default: return 0;
            }
        };
        
        // Récupérer les niveaux des cases 2, 3 et 4
        const case2Element = actionBar.querySelector('.action-slot:nth-child(2) .action-slot-text');
        const case3Element = actionBar.querySelector('.action-slot:nth-child(3) .action-slot-text');
        const case4Element = actionBar.querySelector('.action-slot:nth-child(4) .action-slot-text');
        
        const case2Text = case2Element ? case2Element.value : '';
        const case3Text = case3Element ? case3Element.value : '';
        const case4Text = case4Element ? case4Element.value : '';
        
        const developpementLevel = textToLevel(case2Text);
        const fortificationLevel = textToLevel(case3Text);
        const militarisationLevel = textToLevel(case4Text);
        
        console.log(`📊 Textes récupérés: case2="${case2Text}", case3="${case3Text}", case4="${case4Text}"`);
        console.log(`📊 Niveaux récupérés: développement=${developpementLevel}, fortification=${fortificationLevel}, militarisation=${militarisationLevel}`);
        
        // Préparer les données de l'action
        const actionData = {
            position_q: territory?.position?.q ?? null,
            position_r: territory?.position?.r ?? null,
            development_level: developpementLevel,
            fortification_level: fortificationLevel,
            militarisation_level: militarisationLevel
          };
          
        
        console.log('📤 Envoi de l\'action à l\'API:', actionData);

        // Vérifier si l'action est possible
        const isActionPossible = this.isActionPossible(actionData).possible;
        const saveMessage = this.isActionPossible(actionData).saveMessage;

        if (!isActionPossible) {
            return;
        }
        // Importer et appeler gameApi
        import('../../gameApi.js').then(module => {
            module.gameApi.sendActionToApi(actionData, saveMessage);
        });
    },

    // Mettre à jour les compteurs de ressources pour tous les clans
    updateAllClansResources() {
        console.log('📊 Mise à jour des compteurs de ressources pour tous les clans');
        
        // Réinitialiser tous les compteurs des clans
        gameState.game.clans.forEach(clan => {
            clan.numForests = 0;
            clan.numRices = 0;
            clan.numMines = 0;
            clan.numTemples = 0;
        });
        
        // Parcourir tous les territoires pour compter les ressources
        gameState.game.territories.forEach(territory => {
            if (!territory.clan_id) return;
            
            const clan = gameState.game.clans.find(c => c.id === territory.clan_id);
            if (!clan) return;
            
            // Compter les forêts
            if (territory.type === 'forest' && 
                (territory.construction_type === 'ville' || territory.construction_type === '2villes' || territory.construction_type === 'village')) {
                clan.numForests += territory.construction_type === '2villes' ? 2 : 1;
            }
            
            // Compter les riz
            if (territory.type === 'rice' && 
                (territory.construction_type === 'ville' || territory.construction_type === '2villes'|| territory.construction_type === 'village')) {
                clan.numRices += territory.construction_type === '2villes' ? 2 : 1;
            }
            
            // Compter les mines
            if (territory.type === 'mine' && 
                (territory.construction_type === 'ville' || territory.construction_type === '2villes'|| territory.construction_type === 'village')) {
                clan.numMines += territory.construction_type === '2villes' ? 2 : 1;
            }
            
            // Compter les temples (pas de compte double)
            if (territory.hasTemple) {
                clan.numTemples += 1;
            }
        });
        
        // Log des résultats pour debug
        gameState.game.clans.forEach(clan => {
            console.log(`📊 Clan ${clan.name}: Forêts=${clan.numForests}, Riz=${clan.numRices}, Mines=${clan.numMines}, Temples=${clan.numTemples}`);
        });
    },

    // Mettre à jour les chaos disponibles en fonction des coûts des actions
    updateAvailableChao(processedTurns) {
        console.log(`💰 Mise à jour des chaos disponibles pour le tour ${processedTurns}`);
        
        // Récupérer toutes les actions pour le tour traité
        const actionsForTurn = gameState.game.actions.filter(action => action.turn === processedTurns);
        console.log(`📋 ${actionsForTurn.length} actions trouvées pour le tour ${processedTurns}`);
        
        // Traiter chaque action
        actionsForTurn.forEach(action => {
            // Récupérer le clan associé à l'action
            const clan = action.getClan();
            
            if (!clan) {
                console.warn(`⚠️ Aucun clan trouvé pour l'action ID ${action.id}`);
                return;
            }
            
            // Calculer le coût de l'action
            const actionCost = this.calculateActionCost(action, clan);
            console.log(`💰 Action ID ${action.id} - Clan ${clan.name}: coût calculé = ${actionCost}`);
            
            // Soustraire le coût du chao disponible
            clan.available_chao = clan.available_chao - actionCost;
            console.log(`💰 Clan ${clan.name}: available_chao mis à jour à ${clan.available_chao}`);
        });

        gameState.game.myChaoTemp = gameState.game.myClan.available_chao;
        console.log('✅ Mise à jour des chaos disponibles terminée');
    },

    // Calculer le coût d'une action en fonction des niveaux et des ressources du clan
    calculateActionCost(action, clan) {
        let totalCost = 0;
        
        // Coût du développement
        if (action.development_level === 2) {
            totalCost += Math.max(0, 4 - clan.numRices);
        } else if (action.development_level === 3) {
            totalCost += Math.max(0, 7 - clan.numRices);
        }
        // Niveaux 0 et 1 ne coûtent rien
        
        // Coût de la fortification (utilise numForests)
        if (action.fortification_level === 2) {
            totalCost += Math.max(0, 4 - clan.numForests);
        } else if (action.fortification_level === 3) {
            totalCost += Math.max(0, 7 - clan.numForests);
        }
        // Niveaux 0 et 1 ne coûtent rien
        
        // Coût de la militarisation (utilise numRices)
        if (action.militarisation_level === 2) {
            totalCost += Math.max(0, 4 - clan.numRices);
        } else if (action.militarisation_level === 3) {
            totalCost += Math.max(0, 7 - clan.numRices);
        }
        // Niveaux 0 et 1 ne coûtent rien
        
        return totalCost;
    },

    // Nettoyer les ressources de la phase
    cleanupPhase() {
        if (this.currentGameBoard) {
            this.currentGameBoard.disableClickCallback();
            this.currentGameBoard = null;
        }
        this.clickHandler = null;
        
        // Supprimer tous les cercles (sélection et actions)
        if (this.currentCircle || this.currentCircles.length > 0) {
            this.removeCurrentCircle(this.currentGameBoard);
        }
    },

    async processVictoryBiddings(gameBoard) {
        console.log('🏆 Traitement des biddings victorieux');
        
        // 1. Supprimer les cercles de bidding
        biddingPhase.removeAllCircles(gameBoard);
        
        // 2. Récupérer tous les biddings victorieux
        const victoryBiddings = gameState.game.biddings.filter(bidding => bidding.victory === true);
        console.log(`🏆 ${victoryBiddings.length} biddings victorieux trouvés`);
        
        for (const bidding of victoryBiddings) {
            console.log(`🏆 Traitement du bidding victorieux: clan_id=${bidding.clan_id}, game_user_id=${bidding.game_user_id}`);
            
            // 3. Récupérer le clan correspondant
            const clan = gameState.game.clans.find(c => c.id === bidding.clan_id);
            if (!clan) {
                console.warn(`⚠️ Clan non trouvé pour clan_id=${bidding.clan_id}`);
                continue;
            }
            
            console.log(`🎨 Clan trouvé: ${clan.name} avec couleur ${clan.color}`);
            
            // 4. Mettre à jour available_chao du clan
            clan.available_chao = 6 - bidding.chao;
            console.log(`💰 Clan ${clan.name}: available_chao mis à jour à ${clan.available_chao} (6 - ${bidding.chao})`);
            
            // 5. Récupérer le territoire correspondant à la position du clan
            const territory = gameState.game.territories.find(t => 
                t.position.q === clan.start_q && 
                t.position.r === clan.start_r
            );
            
            if (!territory) {
                console.warn(`⚠️ Territoire non trouvé pour position (${clan.start_q}, ${clan.start_r})`);
                continue;
            }
            
            console.log(`📍 Territoire trouvé à (${territory.position.q}, ${territory.position.r})`);
            
            // 6. Mettre à jour le territoire
            territory.clan_id = clan.id;
            territory.construction_type = 'ville';
            territory.user_id = bidding.game_user_id;
            
            // 7. Créer la construction si gameBoard disponible
            if (gameBoard?.meepleManager) {
                console.log(`🏗️ Création de la ville pour le clan ${clan.name}`);
                await territory.createConstruction(gameBoard, gameBoard.meepleManager);
            } else {
                console.warn(`⚠️ gameBoard ou meepleManager non disponible pour créer la ville`);
            }
        }
        
        console.log('✅ Traitement des biddings victorieux terminé');
        
        // Incrémenter le tour de jeu simultané
        // gameState.game.simultaneous_play_turn = 1;
        
        // Mettre à jour toutes les cases de la barre d'information
        uiManager.updateSimultaneousPlayInfoBar();
        
        // Afficher le message d'accueil avec la couleur du clan du joueur
        if (gameState.game.simultaneous_play_turn === 1) {
            const playerClan = gameState.game.myClan;
            console.log('🔍 Debug - playerClan:', playerClan);
            
            if (playerClan) {
                console.log('🔍 Debug - playerClan.color_name:', playerClan.color_name);
                
                // Récupérer le nom du joueur
                const myGameUser = gameState.getMyGameUser();
                const playerName = myGameUser ? myGameUser.user_name : 'Joueur';
                
                const welcomeMessage = i18n.t('game.phases.simultaneous_play.welcome_message', {
                    playerName: playerName,
                    color: i18n.t(`colors.${playerClan.color_name}`),
                    colorHex: playerClan.color
                });
                console.log('🔍 Debug - welcomeMessage:', welcomeMessage);
                this.showSimultaneousPlayHelpMessage(welcomeMessage);
            } else {
                console.warn('⚠️ playerClan non trouvé, impossible d\'afficher le message d\'accueil');
            }
        }
    },

    // Fonction pour afficher les messages d'aide de la phase simultaneous_play
    showSimultaneousPlayHelpMessage(message) {
        uiManager.updateInfoPanel(message);
    },
}
// pour le debug
window.simultaneousPlayPhase = simultaneousPlayPhase;