import { uiManager } from '../ui/UIManager.js';
import { gameState } from '../gameState.js';
import { biddingPhase } from './biddingPhase.js';
import { i18n } from '../../core/i18n.js';
import * as THREE from 'three';

export const simultaneousPlayPhase = {
    // Stockage du cercle actuel (un seul à la fois)
    currentCircle: null, // { circle: THREE.Mesh, territory: Territory }
    
    simultaneousPlayPhase(gameBoard) {
        console.log('🎯 Exécution de la phase de simultaneous_play');

        // Récupérer le clan du joueur actuel
        gameState.game.setMyClanFromVictoryBidding(gameState.myGameUserId);
        
        // Afficher la barre d'information spécifique à cette phase
        uiManager.showSimultaneousPlayInfoBar();
        
        // Afficher la barre d'action à 6 cases
        uiManager.showPlayerActionBar();
        
        // Activer la détection de clic sur les territoires
        this.setupTerritoryClickDetection(gameBoard);
        
        // si premier tour
        if (gameState.game.simultaneous_play_turn = 1) {
            this.processVictoryBiddings(gameBoard);
        }

    },

    // Configuration de la détection de clic sur les territoires
    setupTerritoryClickDetection(gameBoard) {
        console.log('🎯 Configuration de la détection de clic sur les territoires');
        
        // Définir le callback pour les clics
        const handleTerritoryClick = async (hexCoords, worldPoint) => {
            console.log(`🎯 Clic détecté à (${hexCoords.q}, ${hexCoords.r})`);
            
            // Trouver le territoire à cette position
            const territory = gameState.game.territories.find(t => 
                t.position.q === hexCoords.q && t.position.r === hexCoords.r
            );
            
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

    // Créer un cercle sur un territoire
    async createTerritoryCircle(gameBoard, territory) {
        if (!gameBoard) return;
        
        console.log(`🔵 Création d'un cercle pour le territoire ${territory.type} à (${territory.position.q}, ${territory.position.r})`);
        
        const circle = await this.createCircle(gameBoard, territory.position, 1.0, 0.1);
        
        if (!circle) {
            console.error('❌ Impossible de créer le cercle pour le territoire');
            return;
        }
        
        // Stocker le cercle avec son territoire associé
        this.currentCircle = {
            circle: circle,
            territory: territory
        };
        
        console.log(`✅ Cercle créé pour le territoire ${territory.type}`);
    },

    // Créer un cercle sur une position donnée (utilisant le MeepleManager)
    async createCircle(gameBoard, position, scale = 1.0, height = 0) {
        // Utiliser le MeepleManager pour créer l'instance de cercle
        const circle = await gameBoard.meepleManager.createCircleInstance('selection', position, scale, height, 0xffffff, {
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
        
        console.log(`🔵 Cercle créé via MeepleManager à (${position.q}, ${position.r}) avec scale ${scale}`);
        return circle;
    },

    // Supprimer le cercle actuel
    removeCurrentCircle(gameBoard) {
        if (!gameBoard || !this.currentCircle) return;
        
        gameBoard.workplane.remove(this.currentCircle.circle);
        
        // Supprimer aussi du tableau circles de GameBoard3D si présent
        const index = gameBoard.circles.indexOf(this.currentCircle.circle);
        if (index > -1) {
            gameBoard.circles.splice(index, 1);
        }
        
        console.log(`🗑️ Cercle supprimé pour le territoire ${this.currentCircle.territory.type}`);
        
        this.currentCircle = null;
    },

    // Obtenir le territoire du cercle actuel
    getCurrentTerritory() {
        return this.currentCircle ? this.currentCircle.territory : null;
    },

    // Fonction pour gérer la validation de l'action
    handleActionValidation() {
        console.log('🎯 Validation de l\'action dans simultaneous_play_phase');
        
        // Vérifier qu'un cercle est sélectionné
        if (!this.currentCircle) {
            console.warn('⚠️ Aucun territoire sélectionné');
            uiManager.updateInfoPanel('Veuillez sélectionner un territoire');
            return;
        }
        
        const territory = this.currentCircle.territory;
        console.log(`📍 Territoire sélectionné: ${territory.type} à (${territory.position.q}, ${territory.position.r})`);
        
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
            position_q: territory.position.q,
            position_r: territory.position.r,
            developpement_level: developpementLevel,
            fortification_level: fortificationLevel,
            militarisation_level: militarisationLevel
        };
        
        console.log('📤 Envoi de l\'action à l\'API:', actionData);
        
        // Importer et appeler gameApi
        import('../gameApi.js').then(module => {
            module.gameApi.sendActionToApi(actionData);
        });
    },

    // Nettoyer les ressources de la phase
    cleanupPhase() {
        if (this.currentGameBoard) {
            this.currentGameBoard.disableClickCallback();
            this.currentGameBoard = null;
        }
        this.clickHandler = null;
        
        // Supprimer le cercle actuel
        if (this.currentCircle) {
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
    },

    // Fonction pour afficher les messages d'aide de la phase simultaneous_play
    showSimultaneousPlayHelpMessage(message) {
        console.log('🔍 Debug - showSimultaneousPlayHelpMessage appelée avec:', message);
        
        // Créer ou récupérer la div d'aide
        let helpDiv = document.getElementById('simultaneous-play-help');
        console.log('🔍 Debug - helpDiv existante:', helpDiv);
        
        if (!helpDiv) {
            console.log('🔍 Debug - Création de la nouvelle div d\'aide');
            helpDiv = document.createElement('div');
            helpDiv.id = 'simultaneous-play-help';
            helpDiv.className = 'simultaneous-play-help';
            helpDiv.style.cssText = `
                position: fixed;
                top: 120px;
                left: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                font-size: 14px;
                text-align: center;
                max-width: 600px;
                z-index: 20;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
                border: 2px solid white;
            `;
            document.body.appendChild(helpDiv);
            console.log('🔍 Debug - Div d\'aide ajoutée au body');
        }
        
        // Mettre à jour le message avec support HTML
        helpDiv.innerHTML = message;
        helpDiv.style.display = 'block';
        
        // Ajouter le CSS pour les cercles de clan
        if (!document.getElementById('clan-circle-style')) {
            const style = document.createElement('style');
            style.id = 'clan-circle-style';
            style.textContent = `
                .clan-circle {
                    display: inline-block;
                    width: 1em;
                    height: 1em;
                    border-radius: 50%;
                    margin: 0 0.2em;
                    vertical-align: middle;
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log('💡 Message d\'aide simultaneous_play affiché:', message);
        console.log('🔍 Debug - helpDiv.style.display:', helpDiv.style.display);
        console.log('🔍 Debug - helpDiv.offsetHeight:', helpDiv.offsetHeight);
    },

    // Fonction pour masquer les messages d'aide
    hideSimultaneousPlayHelpMessage() {
        const helpDiv = document.getElementById('simultaneous-play-help');
        if (helpDiv) {
            helpDiv.style.display = 'none';
        }
    }
}