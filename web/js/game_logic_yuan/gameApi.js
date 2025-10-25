import { gameState } from './gameState.js';
// import { Game } from '../app/game a suprimer.js';
import { installationPhase } from './phases/installationPhase.js';
import { initialPlacement } from './phases/initial_placement.js';
import { biddingPhase } from './phases/biddingPhase.js';
import { Auth } from '../app/auth.js';
import { uiManager } from './ui/UIManager.js';
import { i18n } from '../core/i18n.js';
import { simultaneousPlayPhase } from './phases/simultaneous-play-phase/simultaneous-play-phase.js';
import { ServerConfig } from '../app/config.js';
import { Router } from '../app/router.js';
import { SessionManager } from '../app/sessionManager.js';

// Fonctions pour l'API
export const gameApi = {
    gameBoard: null,
    executedPhases: new Set(), // Pour éviter les exécutions multiples
    uiLoadingPromise: null, // Pour éviter les chargements multiples de l'UI
    currentPhaseInstance: null, // Référence vers l'instance de phase active
    baseUrl: ServerConfig.HTTP_BASE,
    timer: null,
    maxRetries: 10,
    timeoutDuration: 10000,


    iAmACreator(data) {
        const message = data.message;
        const userIdCreator = message.game.creator_id;
        const myGameUserId = message.my_game_user_id;
        const gameUser = message.game.game_users.find(gameUser => gameUser.id === myGameUserId);
        return (gameUser.user_id === userIdCreator);
    },

    checkAndRedirectToGameCreation(data) {
        if (this.iAmACreator(data) && data.message.game.game_status == 'waiting_for_players') {
            const data2 = {
                custom_code: data.message?.game?.custom_code,
                waiting_players_count: data.message?.game?.waiting_players_count || 0
              };
            import('../app/router.js').then(module => {
                module.Router.navigateTo('create-quick-game', data2);
            });
            return true;
        }
    },

    startDelay (methode) {
        if (this.timer) {return}
            this.timer = setTimeout(() => {
                methode();
                this.timer = null;
            }, 21000);
    },


    async handleGameMessage(data) {
        if (data.type !== 'ping' ) {
            console.log('🎮 full data:', data);
        }

        if (data.type !== 'ping' && data.type !== 'welcome' && data.type !== 'confirm_subscription') {
            console.log('📨 Message reçu:', data);
        }  

        if (data.message && (data.message.type === 'ready_to_play' || data.message.type === 'waiting_for_players')) {
            console.log('🎮 Message de ready_to_play reçu:', data.message);
            Router.navigateTo('player-waiting',data.message);
        }

        if (data.message && data.message.type === 'ready_to_play') {
            console.log('🎯🎯🎯 ready_to_play test ');
            this.startDelay(() => this.startGameAfterDelay(data.message.game_id));
        }

        if (data.message && data.message.type === 'player_destroyed') {
            console.log('🚫 Joueur détruit:', data.message.game_user_id);
            Router.navigateTo('game-menu');
        }
        
        if (data.message && data.message.type === 'game_details' ) {

            // Envoyer une confirmation de réception à l'API
            const gameId = data.message.game?.id;
            const myGameUserId = data.message.my_game_user_id;
            if (gameId && myGameUserId) {
                this.confirmGameDetailsReception(gameId, myGameUserId);
            }

            // Mettre à jour le gameState avec les nouvelles données
            gameState.update({
                ...data.message,
                gameBoard: this.gameBoard // Passer le gameBoard s'il existe
            });
            console.log('🎮 GameState mis à jour:', gameState);



            this.iAmACreator(data);

            if (this.checkAndRedirectToGameCreation(data)) {
                return;
            }
            
            // Charger l'interface UI en premier si pas déjà chargée
            
            if (!uiManager.gameUI && !this.uiLoadingPromise && !(this.iAmACreator(data) && data.message.game.game_status == 'waiting_for_players')) {
                this.uiLoadingPromise = uiManager.loadGameUI();
                
                try {
                    await this.uiLoadingPromise;
                    
                    // S'assurer que les traductions sont initialisées avec la langue de l'utilisateur
                    if (Auth.currentUser && Auth.currentUser.language && !i18n.loadedLanguages.has(Auth.currentUser.language)) {
                        await i18n.initialize(Auth.currentUser.language);
                    }
                    
                    // Initialiser le système d'aide après i18n
                    uiManager.initializeHelpSystem(i18n);
                    
                    // Récupérer le GameBoard3D depuis l'interface
                    this.gameBoard = uiManager.gameBoard;
                    
                    // Attendre que le GameBoard3D soit complètement initialisé
                    if (this.gameBoard && this.gameBoard.ready) {
                        await this.gameBoard.ready;
                    }
                    
                    // ici on peut rajouter des information entre les guimets qui s'aficheron par decu le game board3d
                    uiManager.updateInfoPanel('');
                    uiManager.showMenuOnlyBar();
                    
                } catch (error) {
                    console.error('❌ Erreur lors du chargement de l\'interface UI:', error);
                } finally {
                    this.uiLoadingPromise = null;
                }

                console.log('🎮 data.message.game.turn_duration :', data.message.game.turn_duration );

                this.gameBoard.shadowManager.turn_duration = data.message.game.turn_duration;
                console.log('🎮 shadowManager.duration mis à jour:', gameBoard.shadowManager.turn_duration);


            } else if (this.uiLoadingPromise) {
                await this.uiLoadingPromise;
                // S'assurer que le gameBoard est prêt après le chargement
                if (window.gameBoard && window.gameBoard.ready) {
                    await window.gameBoard.ready;
                }
            } else {
                console.log('⏭️ Interface UI déjà chargée');
                // S'assurer que le gameBoard est prêt même si l'UI est déjà chargée
                if (window.gameBoard && window.gameBoard.ready) {
                    await window.gameBoard.ready;
                }
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
                console.log('🎯🎯🎯 simultaneous_play ');

                // démarrer le timer pour finir le tour de l'ensemble des joueurs
                this.startDelayedTurnEndTimer();
                // Nettoyer la phase précédente si elle existe
                if (this.currentPhaseInstance) {
                    console.log('🧹 Nettoyage de la phase précédente...');
                    this.currentPhaseInstance.cleanup();
                    this.currentPhaseInstance = null;
                }

                simultaneousPlayPhase.simultaneousPlayPhase(window.gameBoard);

            }

        } 

        if (data.message && data.message.type === 'player_abandoned') {
            if (gameState.game.game_status === 'simultaneous_play') {
                console.log('🚫 Joueur abandonné:', data.message.game_user_id);
                const gameUser = gameState.game.game_users.find(gameUser => gameUser.id === data.message.game_user_id);
                console.log('🔍 GameUser:', gameUser);
                const clan = gameState.game.clans.find(clan => clan.id === gameUser.clan_id);
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.player_abandoned', { colorHex: clan.color }));
            }
        }

        if (data.message && data.message.type === 'game_destroyed') {
            console.log('🚫 Partie détruite');
            uiManager.updateInfoPanel(i18n.t('game.game_destroyed'));
            setTimeout(() => {
                SessionManager.resetToGameMenu();
              }, 5000); // 5000 ms = 5 secondes
            return;
        }

        // Gestion du désabonnement d'un joueur du channel de la game
        // if (data.message && data.message.type === 'unsubscribe_from_game') {
        //     console.log('📤 Désabonnement du game channel:', data.message.game_id);
        //     // Importer WebSocketClient dynamiquement pour éviter la dépendance circulaire
        //     import('../app/websocket.js').then(module => {
        //         module.WebSocketClient.unsubscribeFromGameChannel(data.message.game_id);
        //         console.log('✅ Désabonné du game channel:', data.message.game_id);
        //     });
        // }

        // Gestion de la victoire d'un joueur
        if (data.message && data.message.type === 'game_won') {
            console.log('🏆 Victoire !', data.message);
            simultaneousPlayPhase.isGameOver(true);
            
        }

        // Gestion de la fin de partie par abandon des autres joueurs
    },


    async startDelayedTurnEndTimer() {
        const simultaneous_play_turn = gameState.game.simultaneous_play_turn;
        const turn_duration = gameState.game.turn_duration;
        await new Promise(resolve => setTimeout(resolve, turn_duration * 1000))
        if (simultaneous_play_turn == gameState.game.simultaneous_play_turn && gameState.game.game_status === 'simultaneous_play') {
            this.forceEndTurn(simultaneous_play_turn);
        }
    },

    async forceEndTurn(simultaneous_play_turn) {
        const maxRetries = 10;
            const timeoutDuration = 10000; // 10 secondes
        
            const sendRequest = async (attempt = 1) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutDuration);

                const gameId = gameState.game.id;
                
        
                try {
                    const response = await fetch(`${this.baseUrl}games/${gameId}/force_end_turn`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.authToken}`
                        },
                        body: JSON.stringify({
                            simultaneous_play_turn: simultaneous_play_turn,
                        }),
                        signal: controller.signal
                    });
        
                    clearTimeout(timeout);
                    const data = await response.json();
                    console.log('requette pour finir le tour envoye. 🎯🎯🎯 data:', data);
                    
                    if (!data) throw new Error('Réponse API invalide');
                    return data;
        
                } catch (error) {
                    clearTimeout(timeout);
                    if (attempt < maxRetries && error.message === 'Réponse API invalide') {
                        console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                        return await sendRequest(attempt + 1);
                    } else {
                        console.error('❌ Échec après 10 tentatives:', error);
                        return null;
                    }
                }
            };
      return await sendRequest();
    },

    

    async startGameAfterDelay(game_id) {
        if (gameState && gameState.game && gameState.game.game_status === 'waiting_for_confirmation_players') {
            console.log('🎯🎯🎯 startGameAfterDelay');
            const maxRetries = 10;
            const timeoutDuration = 10000; // 10 secondes
        
            const sendRequest = async (attempt = 1) => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), timeoutDuration);
        
                try {
                    const response = await fetch(`${this.baseUrl}games/startGameAfterDelay`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${Auth.authToken}`
                        },
                        body: JSON.stringify({
                            game_id: game_id,
                        }),
                        signal: controller.signal
                    });
        
                    clearTimeout(timeout);
                    const data = await response.json();
                    console.log('🎯🎯🎯 data:', data);
                    
                    if (!data) throw new Error('Réponse API invalide');
                    return data;
        
                } catch (error) {
                    clearTimeout(timeout);
                    if (attempt < maxRetries && error.message === 'Réponse API invalide') {
                        console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                        return await sendRequest(attempt + 1);
                    } else {
                        console.error('❌ Échec après 10 tentatives:', error);
                        return null;
                    }
                }
            };
        
            return await sendRequest();
        }
    },

    async wait(seconds) {
        return new Promise(resolve => setTimeout(resolve, seconds * 1000));
    },

    // Confirmer la réception d'un broadcast game_details
    async confirmGameDetailsReception(gameId, myGameUserId) {
        console.log('🔍 Confirmation de réception:', gameId, myGameUserId);
        try {
            const response = await fetch(`${this.baseUrl}games/confirm_game_details_reception`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.authToken}`
                },
                body: JSON.stringify({
                    game_id: gameId,
                    game_user_id: myGameUserId
                })
            });

            const data = await response.json();
            
            if (data.success) {
                console.log('✅ Confirmation de réception envoyée:', gameId, myGameUserId);
            } else {
                console.warn('⚠️ Erreur lors de la confirmation:', data.message);
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de la confirmation:', error);
            // On ne fait pas d'alerte à l'utilisateur car ce n'est pas bloquant
            // Le système de retry côté serveur s'en chargera
        }
    },
    
    // Envoyer une tile à l'API
    async sendTileToApi(tileData) {
        const maxRetries = 10;
        const timeoutDuration = 10000; // 10 secondes
    
        const sendRequest = async (attempt = 1) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
            try {
                const tilesWithoutName = gameState.game.tiles.filter(tile => tile.name === null);
                const isLastTile = tilesWithoutName.length === 1;
    
                const response = await fetch(
                    `${this.baseUrl}games/${tileData.game_id}/tiles/${tileData.tile_id}/place`,
                    {
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
                        }),
                        signal: controller.signal
                    }
                );
    
                clearTimeout(timeout);
                const data = await response.json();
    
                if (!data) throw new Error('Réponse API invalide');
                return data;
    
            } catch (error) {
                clearTimeout(timeout);
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                    return await sendRequest(attempt + 1);
                } else {
                    console.error('❌ Échec après 10 tentatives:', error);
                    return null;
                }
            }
        };
    
        return await sendRequest();
    },

    // Envoyer les positions des clans à l'API
    async sendClansToApi(clansData) {
        const maxRetries = 10;
        const timeoutDuration = 10000; // 10 secondes
    
        const sendRequest = async (attempt = 1) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
            try {            
                const gameId = gameState.game.id;

                const response = await fetch(`${this.baseUrl}games/${gameId}/clans`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.authToken}`
                    },
                    body: JSON.stringify({
                        clans: clansData
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const data = await response.json();
                
                if (!data) throw new Error('Réponse API invalide');
                
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
                
                return data;
    
            } catch (error) {
                clearTimeout(timeout);
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                    return await sendRequest(attempt + 1);
                } else {
                    console.error('❌ Échec après 10 tentatives:', error);
                    uiManager.updateInfoPanel('Erreur de connexion');
                    return null;
                }
            }
        };
    
        return await sendRequest();
    },

    // Envoyer la sélection de clan et l'enchère à l'API
    async sendClanBiddingToApi(clanId, chao) {
        const maxRetries = 10;
        const timeoutDuration = 10000; // 10 secondes
    
        const sendRequest = async (attempt = 1) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
            try {
                const turn = gameState.game.biddings_turn;
                const gameId = gameState.game.id;
                const myGameUser = gameState.getMyGameUser();
                // Envoyer clan_id, game_user_id et chao au bidding_controller
                const response = await fetch(`${this.baseUrl}games/${gameId}/bidding`, {
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
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const data = await response.json();
                
                if (!data) throw new Error('Réponse API invalide');
                
                if (data.success) {
                    console.log('✅ Clan et enchère envoyés avec succès:', data);

                    if (!data.turn_completed) {
                        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.bid_confirmed'));
                    }
                    
                    
                } else {
                    console.error('❌ Erreur lors de l\'envoi clan + enchère:', data);
                    uiManager.updateInfoPanel('Erreur lors de l\'envoi de la mise');
                }
                
                return data;
    
            } catch (error) {
                clearTimeout(timeout);
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                    return await sendRequest(attempt + 1);
                } else {
                    console.error('❌ Échec après 10 tentatives:', error);
                    uiManager.updateInfoPanel('Erreur de connexion');
                    return null;
                }
            }
        };
    
        return await sendRequest();
    },

    // Envoyer une action à l'API
    async sendActionToApi(actionData, saveMessage) {
        const maxRetries = 10;
        const timeoutDuration = 10000; // 10 secondes
    
        const sendRequest = async (attempt = 1) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
            try {
                console.log("test sendActionToApi");
                const gameId = gameState.game.id;
                const myGameUserId = gameState.myGameUserId;
                const turn = gameState.game.simultaneous_play_turn;

                const response = await fetch(`${this.baseUrl}games/${gameId}/actions`, {
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
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const data = await response.json();
                
                if (!data) throw new Error('Réponse API invalide');
                
                if (data.success) {
                    if (!saveMessage) {
                        uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.action_validated'));
                    }
                    
                } else {
                    console.error('❌ Erreur lors de l\'envoi de l\'action:', data);
                    uiManager.updateInfoPanel('Erreur lors de l\'envoi de l\'action');
                }
                
                return data;
    
            } catch (error) {
                clearTimeout(timeout);
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                    return await sendRequest(attempt + 1);
                } else {
                    console.error('❌ Échec après 10 tentatives:', error);
                    uiManager.updateInfoPanel('Erreur de connexion');
                    return null;
                }
            }
        };
    
        return await sendRequest();
    },

    // Envoyer la victoire à l'API
    async sendVictoryGameToApi(gameUsers) {
        const maxRetries = 10;
        const timeoutDuration = 10000; // 10 secondes
    
        const sendRequest = async (attempt = 1) => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), timeoutDuration);
    
            try {
                const gameId = gameState.game.id;
                console.log("sendVictoryGameToApi");            
                // Transformer le tableau ordonné de gameUsers en format rankings
                const rankings = gameUsers.map((gameUser, index) => ({
                    game_user_id: gameUser.id,
                    rank: index + 1  // Le rang commence à 1
                }));

                const response = await fetch(`${this.baseUrl}games/${gameId}/submit_victory`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.authToken}`
                    },
                    body: JSON.stringify({
                        rankings: rankings
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeout);
                const result = await response.json();
                
                if (!result) throw new Error('Réponse API invalide');
                
                if (result.success) {
                    console.log('✅ Résultats de victoire envoyés avec succès:', result.message);

                } else {
                    console.error('❌ Erreur lors de l\'envoi des résultats:', result.message);

                }
                
                return result;
    
            } catch (error) {
                clearTimeout(timeout);
                if (attempt < maxRetries) {
                    console.warn(`⚠️ Tentative ${attempt} échouée, nouvel essai...`);
                    return await sendRequest(attempt + 1);
                } else {
                    console.error('❌ Échec après 10 tentatives:', error);
                    // uiManager.updateInfoPanel('Erreur de connexion lors de l\'envoi des résultats');
                    return { success: false, error: error.message };
                }
            }
        };
    
        return await sendRequest();
    },
};
 