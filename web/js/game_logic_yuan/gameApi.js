import { gameState } from './gameState.js';
import { Game } from '../app/game.js';
import { installationPhase } from './phases/installationPhase.js';
import { initialPlacement } from './phases/initial_placement.js';
import { biddingPhase } from './phases/biddingPhase.js';
import { Auth } from '../app/auth.js';
import { startingSpotSelectionPhase } from './phases/startingSpotSelectionPhase.js';
import { uiManager } from './ui/UIManager.js';
import { i18n } from '../core/i18n.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,

    async handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        }  
        
        // Gestion du message d'attente des autres joueurs
        if (data.message && data.message.type === 'waiting_for_other_players') {
            console.log('⏳ Message d\'attente reçu:', data);
            uiManager.updateInfoPanel(i18n.t('game.ui.waiting_for_others'));
            return;
        }
        
        
        if (data.message && data.message.type === 'game_details') {
            // Mettre à jour le gameState avec les nouvelles données
            gameState.update(data.message);
            console.log('🎮 GameState mis à jour:', gameState);
            
            // Lancer le GameBoard3D si on est en phase de jeu et qu'il n'existe pas encore
            if (gameState.game.game_status !== 'waiting_for_players' && !this.gameBoard) {
                this.gameBoard = Game.showGameBoard();
                
                // Charger l'interface UI après la création du gameboard
                if (!uiManager.gameUI) {
                    await uiManager.loadGameUI();
                    
                    // S'assurer que les traductions sont initialisées avec la langue de l'utilisateur
                    if (Auth.currentUser && Auth.currentUser.language && !i18n.loadedLanguages.has(Auth.currentUser.language)) {
                        await i18n.initialize(Auth.currentUser.language);
                    }
                    
                    // ici on peut rajouter des information entre les guimets qui s'aficheron par decu le game board3d
                    uiManager.updateInfoPanel('');
                }
            }
            
            // Exécuter la phase de placement initial APRÈS création du gameBoard
            // Seul le joueur avec l'ID le plus bas peut exécuter cette phase
            if (gameState.game.game_status === 'initial_placement' && this.gameBoard && gameState.isLowestIdPlayer()) {
                console.log('🎯 Exécution de la phase de placement initial (joueur ID le plus bas)');
                initialPlacement.execute(this.gameBoard);
            }
            
            // Exécuter la phase de bidding
            if (gameState.game.game_status === 'bidding_phase' && this.gameBoard) {
                console.log('🎯 Exécution de la phase de bidding');
                biddingPhase.execute(this.gameBoard);
            }
            
            // Mise à jour des tiles 3D
            if (gameState.game.game_status !== 'waiting_for_players' && this.gameBoard) {
                installationPhase.updateTile3d();
            }

            // Ajout de la premiere tile ou choix de la tile a ajouter
            if (gameState.game.game_status === 'installation_phase') {
                installationPhase.addTiles(gameState);
            }

            if (gameState.game.game_status === 'starting_spot_selection') {
                startingSpotSelectionPhase.execute(gameState,this.gameBoard);
            }

        } 
    },

    // Envoyer une tile à l'API
    async sendTileToApi(tileData) {
        try {
            console.log('📤 Envoi tile à l\'API:', tileData);
            
            // Déterminer si c'est la dernière tuile
            const tilesWithoutName = gameState.game.tiles.filter(tile => tile.name === null);
            console.log('🔍 Tiles sans nom:', tilesWithoutName);
            const isLastTile = tilesWithoutName.length === 1;
            console.log('🔍 isLastTile:', isLastTile);
            
            const response = await fetch(`http://localhost:3000/api/v1/games/${tileData.game_id}/tiles/${tileData.tile_id}/place`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    name: tileData.name,
                    rotation: tileData.rotation,
                    position_q: tileData.position.q,
                    position_r: tileData.position.r,
                    is_last_tile: isLastTile
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Tile envoyée avec succès:', data);
            } else {
                console.error('❌ Erreur lors de l\'envoi de la tile:', data);
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi de la tile:', error);
        }
    },

    // Envoyer les positions des clans à l'API
    async sendClansToApi(clansData) {
        try {
            console.log('📤 Envoi des clans à l\'API:', clansData);
            
            const gameId = gameState.game.id;
            if (!gameId) {
                console.error('❌ ID de jeu manquant');
                return;
            }
            
            const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/clans`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    clans: clansData
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Clans envoyés avec succès:', data);
                
                // Désactiver le drag & drop des villes (phase terminée)
                if (this.gameBoard) {
                    this.gameBoard.disableCityDrag();
                    // Optionnel: supprimer les villes du placement initial
                    this.gameBoard.removeInitialPlacementCities();
                }
                
            } else {
                console.error('❌ Erreur lors de l\'envoi des clans:', data);
                uiManager.updateInfoPanel('Erreur lors de la validation');
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi des clans:', error);
            uiManager.updateInfoPanel('Erreur de connexion');
        }
    },

    // Envoyer les données de bidding à l'API
    async sendBiddingToApi(chao, turn = 0) {
        try {
            
            const gameId = gameState.game.id;
            const myGameUser = gameState.getMyGameUser();
            
            const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/bidding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    game_user_id: myGameUser.id,
                    chao: chao,
                    turn: turn
                })
            });
            console.log('📤 Envoi des données de bidding à l\'API:', { chao, turn });


            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Bidding envoyé avec succès:', data);
                
            } else {
                console.error('❌ Erreur lors de l\'envoi du bidding:', data);
                uiManager.updateInfoPanel('Erreur lors de l\'envoi de la mise');
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi du bidding:', error);
            uiManager.updateInfoPanel('Erreur de connexion');
        }
    }
};
 