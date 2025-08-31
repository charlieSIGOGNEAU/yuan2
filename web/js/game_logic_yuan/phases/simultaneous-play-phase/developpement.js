import { gameState } from '../../gameState.js';

export const developpementAndMore = {
    // === FONCTIONS PRINCIPALES ===
    annimation: true,
    gameBoard: null,
    
    developpement(gameBoard, processedTurns) {
        this.gameBoard = gameBoard;
        this.assigneDevelopmentPhase(processedTurns);
    },

    // Fonction pour traiter une action de développement
    processDevelopmentAction(action) {
        // Récupérer le territoire des coordonnées de l'action
        const territory = gameState.getTerritoryByPosition(action.position_q, action.position_r);
        if (!territory) {
            console.log(`❌ Territoire non trouvé aux coordonnées (${action.position_q}, ${action.position_r})`);
            return;
        }

        // Récupérer le clan_id du game_user_id
        const userClanId = gameState.getClanIdByGameUserId(action.game_user_id);
        if (!userClanId) {
            console.log(`❌ Clan non trouvé pour game_user_id=${action.game_user_id}`);
            return;
        }

        // Si developpement_level = 0, ne rien faire
        if (action.developpement_level === 0) {
            return;
        }

        // Gestion des différents cas
        if (action.developpement_level !== 0) {
            // Cas 1: Le territoire a le même clan_id
            if (territory.clan_id === userClanId) {
                action.development_type = "expention";
                console.log(`✅ Action d'extension définie pour territoire (${action.position_q}, ${action.position_r})`);
                return;
            }

            // Cas 2 et 3: Le territoire n'a pas de clan_id renseigné
            if (!territory.clan_id && ['forest', 'rice', 'mine', 'plain'].includes(territory.type)) {
                // Cas 2: developpement_level = 3
                if (action.developpement_level === 3) {
                    action.development_type = "colonisation";
                    console.log(`✅ Action de colonisation (niveau 3) définie pour territoire (${action.position_q}, ${action.position_r})`);
                    return;
                }

                // Cas 3: developpement_level = 1 ou 2 avec territoire connecté
                if (action.developpement_level === 1 || action.developpement_level === 2) {
                    // Vérifier si territory.connectedProvinces possède au moins un territoire avec le bon clan_id
                    const hasConnectedClanTerritory = territory.connectedProvinces.some(connectedTerritory => 
                        connectedTerritory.clan_id === userClanId
                    );

                    if (hasConnectedClanTerritory) {
                        action.development_type = "colonisation";
                        console.log(`✅ Action de colonisation (niveau ${action.developpement_level}) définie pour territoire (${action.position_q}, ${action.position_r})`);
                        return;
                    }
                }
            }
        }

        // Cas par défaut: action non conforme
        console.log(`❌ Action non conforme: game_user_id=${action.game_user_id}, territoire=(${action.position_q}, ${action.position_r}), level=${action.developpement_level}, territoire.clan_id=${territory.clan_id}, territoire.type=${territory.type}`);
    },

    assigneDevelopmentPhase(processedTurns) {
        console.log(`🔄 Traitement des actions de développement pour le tour ${processedTurns}`);
        
        // Récupérer toutes les actions du tour spécifié
        const actionsOfTurn = gameState.game.actions.filter(action => action.turn === processedTurns);
        
        console.log(`📋 ${actionsOfTurn.length} actions trouvées pour le tour ${processedTurns}`);
        
        // Exécuter la fonction pour toutes les actions du tour
        for (const action of actionsOfTurn) {
            this.processDevelopmentAction(action);
        }
        
        console.log(`✅ Traitement des actions de développement terminé pour le tour ${processedTurns}`);
    },
}
// pour le debug
window.developpementAndMore = developpementAndMore;