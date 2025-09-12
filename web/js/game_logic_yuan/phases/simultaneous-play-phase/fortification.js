


export const fortification = {
    animation: true,
    gameBoard: null,

    initialize(gameBoard, processedTurns) {
        this.gameBoard = gameBoard;
        this.processedTurns = processedTurns;
        this.actionsOfTurn = gameState.game.actions.filter(action => action.turn === this.processedTurns);
        this.assigneFortification(processedTurns);
        // realisation des urbanisations
        this.realiseUrbanisations();
    },

    assigneFortification() {
        for (const action of this.actionsOfTurn) {
            territory = action.getTerritory();
            clan = action.getClan();
            if (action.fortification_level>0) {
                if (this.isUrbanisation(territory, clan)) {
                    action.fortification_type = "urbanisation";
                }
                else if (this.isRenforcement(territory, clan)) {
                    action.fortification_type = "renforcement";
                }
                else if (clan.id === gameState.game.myClan.id) {

                }
                
            }
        }
    },
    isUrbanisation(territoryCible, clan) {
        return (territoryCible.clan_id === clan.id) && (territoryCible.construction_type === 'village');
    },
    isRenforcement(territoryCible, clan) {
        return (territoryCible.clan_id === clan.id) && ((territoryCible.construction_type === 'ville') || (territoryCible.construction_type === '2villes'));
    },

    realiseUrbanisations() {
    },
   


}
