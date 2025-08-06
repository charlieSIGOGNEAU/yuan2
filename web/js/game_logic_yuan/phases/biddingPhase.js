import { gameState } from '../gameState.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';

export const biddingPhase = {
    // Stockage des cercles créés avec leurs clans associés
    createdCircles: [], // [{ circle: THREE.Mesh, clan: Clan }]
    // Éviter les appels multiples
    isRunning: false,
    lastRunTime: 0, // Timestamp du dernier lancement
    
    // Retourner une référence avec méthode cleanup
    createPhaseInstance() {
        return {
            cleanup: () => this.cleanupPhase(),
            isActive: () => this.isRunning
        };
    },
    
    // Références pour le nettoyage
    currentGameBoard: null,
    clickHandler: null,
    selectedClan: null,
    
    // Fonction principale pour gérer la phase de bidding
    async biddingPhase(gameBoard) {
        // Éviter les appels multiples avec sécurité temporelle
        console.log('🎯 Démarrage de la phase bidding');
        const now = Date.now();
        if (this.isRunning) {
            console.log('⚠️ Phase bidding déjà en cours, ignoré');
            return;
        }
        
        // Éviter les appels trop rapprochés (moins d'1 seconde)
        if (now - this.lastRunTime < 1000) {
            console.log('⚠️ Phase bidding appelée trop rapidement, ignoré');
            return;
        }
        
        this.isRunning = true;
        this.lastRunTime = now;
        console.log('🎯 Démarrage de la phase bidding_phase');
        this.removeAllCircles(gameBoard);


        // Mettre à jour les territories et placer les villes
        await this.setupClanTerritories(gameBoard);
        
        // Récupérer le joueur actuel
        const myGameUserId = gameState.myGameUserId;
        const myGameUser = gameState.game?.game_users?.find(gu => gu.id === myGameUserId);
        
        console.log(`👤 Joueur actuel: ${myGameUserId}`);
        console.log(`🏛️ Clan sélectionné: ${myGameUser?.clan_id || 'aucun'}`);
        
        // Vérifier s'il existe déjà un bidding pour ce joueur avec le même turn
        const existingBidding = gameState.game.biddings.find(bidding => 
            bidding.game_user_id === myGameUserId && 
            bidding.turn === gameState.game.biddings_turn
        );
        
        // Vérifier si le joueur a déjà gagné une enchère (victory) à n'importe quel tour
        const victoryBidding = gameState.game.biddings.find(bidding => 
            bidding.game_user_id === myGameUserId && 
            bidding.victory === true
        );
        
        console.log(existingBidding ? '⏳ Bidding déjà existant pour ce joueur et ce turn' : '🎯 Joueur n\'a pas encore fait d\'enchère');
        console.log(victoryBidding ? '🏆 Joueur a déjà gagné une enchère' : '🎯 Joueur n\'a pas encore gagné d\'enchère');
        
        // Si le joueur a déjà gagné une enchère, afficher le message d'attente
        if (victoryBidding) {
            console.log('🏆 Joueur a déjà gagné une enchère, affichage du message d\'attente');
            uiManager.updateInfoPanel(i18n.t('game.phases.bidding.waiting_for_others'));
            uiManager.showMenuOnlyBar();
            return;
        }
        
        try {
            await this.handlePlayerBidding(gameBoard, existingBidding);
        } catch (error) {
            console.error('❌ Erreur dans handlePlayerBidding:', error);
        } finally {
            // Réinitialiser le flag à la fin (même en cas d'erreur)
            this.isRunning = false;
        }
    },

    // Fonction unifiée pour gérer la phase de bidding
    async handlePlayerBidding(gameBoard, existingBidding) {
        console.log('🎯 Gestion de la phase de bidding');
        

        // Placer des cercles sur les clans non utilisés
        await this.placeUnusedClanCircles(gameBoard);
        
        // Vérifier s'il n'y a qu'un seul clan disponible
        if (this.createdCircles.length === 1) {
            console.log('🎯 Un seul clan disponible, sélection automatique');
            
            // Sélectionner automatiquement le clan
            this.selectedClan = this.createdCircles[0].clan;
            
            // Mettre l'enchère à 0
            uiManager.currentBid = 0;
            
            // // Afficher les instructions
            // uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            
            // Mettre l'enchère à 0 sans afficher la barre de bidding
            uiManager.currentBid = 0;
            
            // Envoyer automatiquement à l'API
            console.log(`🚀 Envoi automatique: clan ${this.selectedClan.name} avec enchère 0`);
            import('../gameApi.js').then(module => {
                module.gameApi.sendClanBiddingToApi(this.selectedClan.id, 0);
            });
            
            return;
        }

        // Afficher le message approprié selon l'existence d'une enchère
        const message = existingBidding 
            ? i18n.t('game.phases.bidding.bid_confirmed')
            : i18n.t('game.phases.bidding.instructions');
        uiManager.updateInfoPanel(message);
        
        // Afficher la barre de bidding
        uiManager.showBiddingBar();
        // setTimeout(() => uiManager.updateBiddingText(0, 6), 200);
        
        // Variables pour le suivi de la sélection
        this.selectedClan = null;
        this.currentBid = 0;
        
        // Définir le callback pour les clics
        const handleClick = (hexCoords, worldPoint) => {
            // Vérifier si on a cliqué sur un cercle (clan non utilisé)
            const clickedCircle = this.createdCircles.find(({ circle, clan }) => {
                const clanHexCoords = { q: clan.start_q, r: clan.start_r };
                return clanHexCoords.q === hexCoords.q && clanHexCoords.r === hexCoords.r;
            });
            
            if (clickedCircle) {
                console.log(`✅ Clic sur le cercle du clan ${clickedCircle.clan.name} (${clickedCircle.clan.color})`);
                
                // Mettre à jour l'apparence des cercles
                this.updateCircleSelection(clickedCircle);
                
                // Stocker le clan sélectionné
                this.selectedClan = clickedCircle.clan;
                
                // Mettre à jour le message avec la sélection actuelle
                this.updateBiddingMessage();
                
            } else {
                // Si on clique en dehors, on peut désélectionner
                this.selectedClan = null;
                this.resetAllCircles();
                uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            }
        };

        // Utiliser le système de callback de GameBoard3D
        gameBoard.detectClickOnly(handleClick);
        
        // Stocker la référence pour pouvoir la supprimer plus tard
        this.clickHandler = handleClick;
        this.currentGameBoard = gameBoard;
        
        console.log('✅ Interface de sélection + enchère initialisée');
    },

    // Fonction pour mettre à jour le message de bidding
    updateBiddingMessage() {
        if (!this.selectedClan) {
            uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions'));
            return;
        }
        
        const currentBid = uiManager.currentBid || 0;
        const message = i18n.t('game.phases.bidding.bid_on_clan', {
            color: i18n.t(`colors.${this.selectedClan.color_name}`),
            chao: currentBid
        });
        
        uiManager.updateInfoPanel(message);
    },

    // Mettre à jour les territories avec les clans et placer les villes
    async setupClanTerritories(gameBoard) {
        const clans = gameState.game?.clans || [];
        const territories = gameState.game?.territories || [];
        
        for (const clan of clans) {
            // Trouver le territoire correspondant
            const territory = territories.find(t => 
                t.position.q === clan.start_q && t.position.r === clan.start_r
            );
            
            if (territory && territory.construction_type !== 'ville') {
                // Mettre à jour le territoire
                territory.clan_id = clan.id;
                territory.construction_type = 'ville';
                
                // Créer la ville si gameBoard disponible (version asynchrone)
                if (gameBoard?.meepleManager) {
                    await territory.createConstruction(gameBoard, gameBoard.meepleManager);
                }
            }
        }
    },

    // Placer des cercles sur les positions des clans non utilisés
    async placeUnusedClanCircles(gameBoard) {
        if (!gameBoard) return;
        
        // Éviter la création en double si des cercles existent déjà
        if (this.createdCircles.length > 0) {
            console.log('⚠️ Cercles déjà créés, suppression avant recréation');
            this.removeAllCircles(gameBoard);
        }        
        // Récupérer tous les game_users du jeu
        const gameUsers = gameState.game?.game_users || [];
        
        // Récupérer tous les clans du jeu
        const allClans = gameState.game?.clans || [];
        
        // Récupérer les clan_id qui sont renseignés dans les game_users
        const usedClanIds = gameUsers
            .map(user => user.clan_id)
            .filter(clanId => clanId !== null && clanId !== undefined);
        
        // Filtrer les clans non utilisés (ceux qui ne sont pas dans usedClanIds)
        const unusedClans = allClans.filter(clan => !usedClanIds.includes(clan.id));
        
        // Créer un cercle pour chaque clan non utilisé
        for (const clan of unusedClans) {
            const circle = await this.createClanCircle(gameBoard, { q: clan.start_q, r: clan.start_r });
            if (circle) {
                // Stocker le cercle avec son clan associé
                this.createdCircles.push({
                    circle: circle,
                    clan: clan
                });
            } else {
                console.error(`❌ Échec de création du cercle pour le clan ${clan.name}`);
            }
        }
    },

    // Supprimer tous les cercles créés
    removeAllCircles(gameBoard) {
        if (!gameBoard) return;
        
        this.createdCircles.forEach(({ circle, clan }) => {
            if (circle) {
                gameBoard.workplane.remove(circle);
                // Supprimer aussi du tableau circles de GameBoard3D
                const index = gameBoard.circles.indexOf(circle);
                if (index > -1) {
                    gameBoard.circles.splice(index, 1);
                }
            }
        });
        
        this.createdCircles = [];
    },

    // Créer un cercle sur une position donnée (version instance)
    async createClanCircle(gameBoard, position) {
        try {
            // Utiliser le système d'instances pour créer le cercle
            const circleInstance = await gameBoard.meepleManager.createCircleInstance(
                'selection', 
                position, 
                1.0, 
                0.1
            );
            
            if (circleInstance) {
                // Convertir les coordonnées hexagonales en cartésiennes pour le positionnement
                const cartesianPos = gameBoard.hexToCartesian(position);
                circleInstance.position.set(cartesianPos.x, 0.1, cartesianPos.z);
                
                // Cloner le matériau pour éviter les conflits d'opacité entre instances
                if (circleInstance.material) {
                    circleInstance.material = circleInstance.material.clone();
                    circleInstance.material.opacity = 0.8;
                    circleInstance.material.needsUpdate = true;
                }
                circleInstance.scale.set(0.8, 0.8, 0.8);
                
                // Ajouter au workplane et au tableau des cercles de GameBoard3D
                gameBoard.workplane.add(circleInstance);
                gameBoard.circles.push(circleInstance);
                
                return circleInstance;
            } else {
                console.error('❌ Impossible de créer l\'instance de cercle');
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur lors de la création du cercle d\'instance:', error);
            return null;
        }
    },

    // Mettre à jour la sélection visuelle des cercles
    updateCircleSelection(selectedCircle) {
        // Étape 1 : Mettre tous les cercles à scale 0.8 
        this.createdCircles.forEach(({ circle, clan }) => {
            if (circle && circle.material) {
                circle.material.opacity = 0.8;
                circle.scale.set(0.8, 0.8, 0.8);
                circle.material.needsUpdate = true;
            }
        });
        
        // Étape 2 : Mettre le cercle sélectionné à scale 1.5 
        if (selectedCircle && selectedCircle.circle && selectedCircle.circle.material) {
            selectedCircle.circle.material.opacity = 0.8;
            selectedCircle.circle.scale.set(1.5, 1.5, 1.5);
            selectedCircle.circle.material.needsUpdate = true;
        }
    },

    // Remettre tous les cercles à leur état par défaut
    resetAllCircles() {
        this.createdCircles.forEach(({ circle, clan }) => {
            if (circle && circle.material) {
                circle.material.opacity = 0.8;
                circle.scale.set(0.8, 0.8, 0.8);
                circle.material.needsUpdate = true;
            }
        });
    },

    // Fonction pour nettoyer les ressources de la phase
    cleanupPhase() {
        console.log('🧹 Nettoyage de la phase bidding');
        if (this.currentGameBoard) {
            this.currentGameBoard.disableClickCallback();
            this.currentGameBoard = null;
        }
        this.clickHandler = null;
        this.selectedClan = null;
    }
};