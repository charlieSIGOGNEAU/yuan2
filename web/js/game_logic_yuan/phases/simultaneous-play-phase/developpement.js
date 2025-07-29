import { gameState } from '../gameState.js';

export const developpementAndMore = {
    // === FONCTIONS PRINCIPALES ===
    
    developpement(gameBoard) {
        console.log('🎯 Exécution de la phase de developpement');
        
        const currentTurn = gameState.game.processedTurns + 1;
        const actionsForTurn = this.getActionsForTurn(currentTurn);
        
        console.log(`📋 Actions trouvées pour le tour ${currentTurn}:`, actionsForTurn.length);
        
        actionsForTurn.forEach(action => {
            console.log(`🔄 Traitement de l'action ${action.id} (joueur ${action.game_user_id})`);
            this.processAction(action);
        });
    },

    // === VALIDATION DES ACTIONS ===
    
    validateAction(action) {
        if (!this.isValidDevelopmentLevel(action)) {
            console.log(`⚠️ Action ${action.id} a un developpement_level invalide: ${action.developpement_level}`);
            return false;
        }
        
        if (!this.hasValidPosition(action)) {
            console.log(`⚠️ Action ${action.id} n'a pas de position définie`);
            return false;
        }
        
        return true;
    },

    isValidDevelopmentLevel(action) {
        return [1, 2, 3].includes(action.developpement_level);
    },

    hasValidPosition(action) {
        return action.position_q !== null && action.position_r !== null;
    },

    // === RÉCUPÉRATION DES DONNÉES ===
    
    getActionsForTurn(turn) {
        return gameState.game.actions.filter(action => action.turn === turn);
    },

    getTerritoryAtPosition(position_q, position_r) {
        return gameState.game.territories.find(t => 
            t.position.q === position_q && 
            t.position.r === position_r
        );
    },

    getGameUser(gameUserId) {
        return gameState.game.game_users.find(gu => gu.id === gameUserId);
    },

    // === TRAITEMENT DES ACTIONS ===
    
    processAction(action) {
        console.log('🎯 Exécution de la phase de colonisation ou expansion');
        
        if (!this.validateAction(action)) return;
        
        const territory = this.getTerritoryAtPosition(action.position_q, action.position_r);
        if (!territory) {
            console.log(`⚠️ Aucun territoire trouvé à la position (${action.position_q}, ${action.position_r})`);
            return;
        }
        
        const gameUser = this.getGameUser(action.game_user_id);
        if (!gameUser) {
            console.log(`⚠️ GameUser ${action.game_user_id} non trouvé`);
            return;
        }
        
        this.handleTerritoryAction(territory, action, gameUser);
    },

    handleTerritoryAction(territory, action, gameUser) {
        if (territory.clan_id === gameUser.clan_id) {
            console.log(`✅ Territoire appartient au clan du joueur (clan_id: ${territory.clan_id})`);
            this.colonisation(territory, action.developpement_level, gameUser.clan_id);
        } else if (territory.clan_id !== null) {
            console.log(`❌ L'action ${action.id} n'est pas conforme - territoire appartient à un autre clan (clan_id: ${territory.clan_id})`);
        } else {
            this.handleNeutralTerritory(territory, action);
        }
    },

    handleNeutralTerritory(territory, action) {
        console.log(`⚠️ Territoire neutre (territory.clan_id: ${territory.clan_id}, gameUser.clan_id: ${action.game_user_id})`);
        
        if (action.developpement_level === 3) {
            this.expansion(territory, action.developpement_level, this.getClanIdFromAction(action));
        } else if (this.isTerritoryConnectedOrAdjacent(territory, action)) {
            this.expansion(territory, action.developpement_level, this.getClanIdFromAction(action));
        } else {
            console.log(`❌ L'action ${action.id} n'est pas conforme - territoire non connecté/adjacent au clan du joueur`);
        }
    },

    // === VÉRIFICATION DE CONNEXION ===
    
    isTerritoryConnectedOrAdjacent(territory, action) {
        console.log(`🔍 Vérification si territoire (${territory.position.q}, ${territory.position.r}) est connecté/adjacent au clan de l'action ${action.id}`);
        
        const clanId = this.getClanIdFromAction(action);
        if (clanId === null) return false;
        
        console.log(`🎯 Clan de l'action: ${clanId}`);
        
        return this.isAdjacentToClan(territory, clanId) || this.isConnectedToClan(territory, clanId);
    },

    getClanIdFromAction(action) {
        const gameUser = this.getGameUser(action.game_user_id);
        if (!gameUser) {
            console.log(`⚠️ GameUser ${action.game_user_id} non trouvé`);
            return null;
        }
        return gameUser.clan_id;
    },

    isAdjacentToClan(territory, clanId) {
        const adjacentTerritories = territory.getAdjacentTerritories();
        const hasAdjacentClanTerritory = adjacentTerritories.some(adjTerritory => adjTerritory.clan_id === clanId);
        
        if (hasAdjacentClanTerritory) {
            console.log(`✅ Territoire adjacent - territoire du clan trouvé dans les adjacents`);
            return true;
        }
        return false;
    },

    isConnectedToClan(territory, clanId) {
        for (const lake of gameState.game.lakes.values()) {
            if (lake.connectedTerritories.has(territory)) {
                console.log(`🌊 Territoire connecté à un lac`);
                
                const hasClanTerritoryInLake = Array.from(lake.connectedTerritories).some(connectedTerritory => 
                    connectedTerritory.clan_id === clanId
                );
                
                if (hasClanTerritoryInLake) {
                    console.log(`✅ Territoire connecté - territoire du clan trouvé dans les territoires connectés du lac`);
                    return true;
                }
            }
        }
        return false;
    },

    // === ACTIONS DE JEU ===
    
    colonisation(territory, developpement_level, clan_id) {
        console.log(`🎯 Exécution de la phase de colonisation sur territoire (${territory.position.q}, ${territory.position.r}) avec niveau ${developpement_level} pour clan ${clan_id}`);
    },

    expansion(territory, developpement_level, clan_id) {
        console.log(`🎯 Exécution de la phase d'expansion sur territoire (${territory.position.q}, ${territory.position.r}) avec niveau ${developpement_level} pour clan ${clan_id}`);
    }
}