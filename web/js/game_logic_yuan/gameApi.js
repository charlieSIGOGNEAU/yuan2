import { gameState } from './gameState.js';
import { Game } from '../app/game.js';
import { installationPhase } from './phases/installationPhase.js';
import { initialPlacement } from './phases/initial_placement.js';
import { biddingPhase } from './phases/biddingPhase.js';
import { Auth } from '../app/auth.js';
import { uiManager } from './ui/UIManager.js';
import { i18n } from '../core/i18n.js';
import { simultaneousPlayPhase } from './phases/simultaneous-play-phase.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,
    executedPhases: new Set(), // Pour éviter les exécutions multiples
    uiLoadingPromise: null, // Pour éviter les chargements multiples de l'UI

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
            gameState.update({
                ...data.message,
                gameBoard: this.gameBoard // Passer le gameBoard s'il existe
            });
            console.log('🎮 GameState mis à jour:', gameState);
            
            // Charger l'interface UI en premier si pas déjà chargée
            if (!uiManager.gameUI && !this.uiLoadingPromise) {
                console.log('🎨 Début du chargement de l\'interface UI...');
                this.uiLoadingPromise = uiManager.loadGameUI();
                
                try {
                    await this.uiLoadingPromise;
                    
                    // S'assurer que les traductions sont initialisées avec la langue de l'utilisateur
                    if (Auth.currentUser && Auth.currentUser.language && !i18n.loadedLanguages.has(Auth.currentUser.language)) {
                        await i18n.initialize(Auth.currentUser.language);
                    }
                    
                    // Récupérer le GameBoard3D depuis l'interface
                    this.gameBoard = window.gameBoard;
                    
                    // ici on peut rajouter des information entre les guimets qui s'aficheron par decu le game board3d
                    uiManager.updateInfoPanel('');
                    
                    console.log('✅ Interface UI chargée avec succès');
                } catch (error) {
                    console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
                } finally {
                    this.uiLoadingPromise = null;
                }
            } else if (this.uiLoadingPromise) {
                console.log('⏳ Interface UI en cours de chargement, attente...');
                await this.uiLoadingPromise;
            } else {
                console.log('⏭️ Interface UI déjà chargée');
            }
            
            // Mise à jour des tiles 3D
            if (gameState.game.game_status !== 'waiting_for_players' && window.gameBoard) {
                installationPhase.updateTile3d();
            }

            // Ajout de la premiere tile ou choix de la tile a ajouter
            if (gameState.game.game_status === 'installation_phase') {
                installationPhase.addTiles(gameState);
            }

            
            // Exécuter la phase de placement initial APRÈS création du gameBoard
            // Seul le joueur avec l'ID le plus bas peut exécuter cette phase
            if (gameState.game.game_status === 'initial_placement' && window.gameBoard && gameState.isLowestIdPlayer()) {
                const phaseKey = `initial_placement_${gameState.game.id}`;
                if (!this.executedPhases.has(phaseKey)) {
                    console.log('🎯 Exécution de la phase de placement initial (joueur ID le plus bas)');
                    this.executedPhases.add(phaseKey);
                    initialPlacement.execute(window.gameBoard);
                } else {
                    console.log('⏭️ Phase initial_placement déjà exécutée, skip');
                }
            }

            // Exécuter la phase de bidding
            if (gameState.game.game_status === 'bidding_phase' && window.gameBoard) {
                console.log('🎯 Exécution de la phase de bidding');
                biddingPhase.biddingPhase(window.gameBoard);
            }

            // exécuter la phasse de simultaneous_play
            if (gameState.game.game_status === 'simultaneous_play' && window.gameBoard) {
                console.log('🎯 Exécution de la phase de simultaneous_play');
                simultaneousPlayPhase.simultaneousPlayPhase(window.gameBoard);
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

    // Envoyer la sélection de clan et l'enchère à l'API
    async sendClanBiddingToApi(clanId, chao) {
        try {
            const turn = gameState.game.biddings_turn;
            const gameId = gameState.game.id;
            const myGameUser = gameState.getMyGameUser();
            
            console.log(`📤 Envoi clan + enchère à l'API: clan=${clanId}, chao=${chao}, turn=${turn}`);

            // Envoyer clan_id, game_user_id et chao au bidding_controller
            const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/bidding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    game_user_id: myGameUser.id,
                    clan_id: clanId,
                    chao: chao,
                    turn: turn
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Clan et enchère envoyés avec succès:', data);
                
                // Nettoyer la phase
                import('./phases/biddingPhase.js').then(module => {
                    module.biddingPhase.cleanupPhase();
                });
                
                // Masquer toutes les barres d'action
                uiManager.hideAllActionBars();
                
                // Afficher un message de confirmation
                uiManager.updateInfoPanel('Enchère envoyée, en attente des autres joueurs...');
                
            } else {
                console.error('❌ Erreur lors de l\'envoi clan + enchère:', data);
                uiManager.updateInfoPanel('Erreur lors de l\'envoi de la mise');
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi clan + enchère:', error);
            uiManager.updateInfoPanel('Erreur de connexion');
        }
    },

    // Envoyer une action à l'API
    async sendActionToApi(actionData) {
        try {
            const gameId = gameState.game.id;
            const myGameUserId = gameState.myGameUserId;
            const turn = gameState.game.simultaneous_play_turn;
            
            console.log(`📤 Envoi action à l'API:`, actionData);
            console.log(`📤 Données complètes: game_user_id=${myGameUserId}, game_id=${gameId}, turn=${turn}`);

            const response = await fetch(`http://localhost:3000/api/v1/games/${gameId}/actions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    game_user_id: myGameUserId,
                    game_id: gameId,
                    turn: turn,
                    position_q: actionData.position_q,
                    position_r: actionData.position_r,
                    developpement_level: actionData.developpement_level,
                    fortification_level: actionData.fortification_level,
                    militarisation_level: actionData.militarisation_level
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Action envoyée avec succès:', data);
                
                // Nettoyer la phase
                import('./phases/simultaneous-play-phase.js').then(module => {
                    module.simultaneousPlayPhase.cleanupPhase();
                });
                
                // Masquer toutes les barres d'action
                uiManager.hideAllActionBars();
                
                // Afficher un message de confirmation
                uiManager.updateInfoPanel('Action envoyée, en attente des autres joueurs...');
                
            } else {
                console.error('❌ Erreur lors de l\'envoi de l\'action:', data);
                uiManager.updateInfoPanel('Erreur lors de l\'envoi de l\'action');
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi de l\'action:', error);
            uiManager.updateInfoPanel('Erreur de connexion');
        }
    },
};
 