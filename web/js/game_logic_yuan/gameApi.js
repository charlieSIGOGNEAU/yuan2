import { gameState } from './gameState.js';
import { Game } from '../app/game.js';
import { installationPhase } from './phases/installationPhase.js';
import { initialPlacement } from './phases/initial_placement.js';
import { biddingPhase } from './phases/biddingPhase.js';
import { Auth } from '../app/auth.js';
import { uiManager } from './ui/UIManager.js';
import { i18n } from '../core/i18n.js';
import { simultaneousPlayPhase } from './phases/simultaneous-play-phase/simultaneous-play-phase.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,
    executedPhases: new Set(), // Pour éviter les exécutions multiples
    uiLoadingPromise: null, // Pour éviter les chargements multiples de l'UI
    currentPhaseInstance: null, // Référence vers l'instance de phase active

    async handleGameMessage(data) {
        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        }  
        
        // Gestion du message d'attente des autres joueurs
        if (data.message && data.message.type === 'waiting_for_other_players') {
            // uiManager.updateInfoPanel(i18n.t('game.ui.waiting_for_others'));
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
                    
                } catch (error) {
                    console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
                } finally {
                    this.uiLoadingPromise = null;
                }
            } else if (this.uiLoadingPromise) {
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
                    this.executedPhases.add(phaseKey);
                    initialPlacement.execute(window.gameBoard);
                } else {
                    console.log('⏭️ Phase initial_placement déjà exécutée, skip');
                }
            }

            // Exécuter la phase de bidding
            if (gameState.game.game_status === 'bidding_phase' && window.gameBoard) {
                
                // Nettoyer la phase précédente si elle existe
                if (this.currentPhaseInstance) {
                    console.log('🧹 Nettoyage de la phase précédente...');
                    this.currentPhaseInstance.cleanup();
                    this.currentPhaseInstance = null;
                }
                
                // Créer une nouvelle instance de phase
                this.currentPhaseInstance = biddingPhase.createPhaseInstance();
                
                biddingPhase.biddingPhase(window.gameBoard);
            }

            // exécuter la phasse de simultaneous_play
            if (gameState.game.game_status === 'simultaneous_play' && window.gameBoard) {
                console.log('🎯🎯🎯 ');
                // Nettoyer la phase précédente si elle existe
                if (this.currentPhaseInstance) {
                    console.log('🧹 Nettoyage de la phase précédente...');
                    this.currentPhaseInstance.cleanup();
                    this.currentPhaseInstance = null;
                }
                
                // Créer une nouvelle instance de phase (si simultaneousPlayPhase a aussi createPhaseInstance)
                // this.currentPhaseInstance = simultaneousPlayPhase.createPhaseInstance();
                
                simultaneousPlayPhase.simultaneousPlayPhase(window.gameBoard);
            }

        } 
    },

    // Envoyer une tile à l'API
    async sendTileToApi(tileData) {
        try {          
            // Déterminer si c'est la dernière tuile
            const tilesWithoutName = gameState.game.tiles.filter(tile => tile.name === null);
            const isLastTile = tilesWithoutName.length === 1;
            
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
            const gameId = gameState.game.id;

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

                uiManager.updateInfoPanel(i18n.t('game.phases.bidding.bid_confirmed'));
                
                // Masquer la barre de bidding après envoi réussi
                uiManager.hideAllActionBars();
                
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
    async sendActionToApi(actionData, saveMessage) {
        try {
            const gameId = gameState.game.id;
            const myGameUserId = gameState.myGameUserId;
            const turn = gameState.game.simultaneous_play_turn;

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
                    development_level: actionData.development_level,
                    fortification_level: actionData.fortification_level,
                    militarisation_level: actionData.militarisation_level
                })
            });

            const data = await response.json();
            
            if (data.success) {
                if (!saveMessage) {
                    uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.action_validated'));
                }
                
            } else {
                console.error('❌ Erreur lors de l\'envoi de l\'action:', data);
                uiManager.updateInfoPanel('Erreur lors de l\'envoi de l\'action');
            }
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi de l\'action:', error);
            uiManager.updateInfoPanel('Erreur de connexion');
        }
    },

    // Envoyer la victoire à l'API
    async sendVictoryGameToApi(gameUsers) {
        try {
            const gameId = gameState.game.id;
            
            // Transformer le tableau ordonné de gameUsers en format rankings
            const rankings = gameUsers.map((gameUser, index) => ({
                game_user_id: gameUser.id,
                rank: index + 1  // Le rang commence à 1
            }));

            const response = await fetch(`${this.baseUrl}/games/${gameId}/submit_victory`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    rankings: rankings
                })
            });

            const result = await response.json();
            
            if (result.success) {
                console.log('✅ Résultats de victoire envoyés avec succès:', result.message);
                uiManager.updateInfoPanel(result.message);
            } else {
                console.error('❌ Erreur lors de l\'envoi des résultats:', result.message);
                uiManager.updateInfoPanel(`Erreur: ${result.message}`);
            }
            
            return result;
        } catch (error) {
            console.error('❌ Erreur réseau lors de l\'envoi des résultats de victoire:', error);
            uiManager.updateInfoPanel('Erreur de connexion lors de l\'envoi des résultats');
            return { success: false, error: error.message };
        }
    },
};
 