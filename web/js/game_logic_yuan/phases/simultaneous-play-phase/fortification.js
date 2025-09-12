import { gameState } from '../../gameState.js';
import { uiManager } from '../../ui/UIManager.js';
import { i18n } from '../../../core/i18n.js';


export const fortification = {
    animation: true,
    gameBoard: null,
    actionsOfTurn: [],

    async setupFortification(gameBoard, processedTurns, preMilitarization) {
        this.gameBoard = gameBoard;
        if (preMilitarization) {
            this.actionsOfTurn = gameState.game.actions.filter(action => action.turn === processedTurns);
        }
        else {
            this.actionsOfTurn = gameState.game.actions.filter(action => action.turn === processedTurns && action.militarisation_type === "attaque");
        }
        this.assigneFortification(this.actionsOfTurn);
        // realisation des urbanisations
        this.realiseUrbanisations(this.actionsOfTurn.filter(action => action.fortification_type === "urbanisation"));
        this.realiseRenforcements(this.actionsOfTurn.filter(action => action.fortification_type === "renforcement"));
        if (this.animation) {
            uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.fortification_complete_pre_militarization'));
            await this.waitForNext();
        }
    },

    assigneFortification(actionsOfTurn) {
        for (const action of actionsOfTurn) {
            const territory = action.getTerritory();
            const clan = action.getClan();

            if (action.fortification_level > 0) {
                if (this.isUrbanisation(territory, clan)) action.fortification_type = "urbanisation";
                else if (this.isRenforcement(territory, clan)) action.fortification_type = "renforcement";
                else action.fortification_type = ""; 
            }
        }
    },
    isUrbanisation(territoryCible, clan) {
        return (territoryCible.clan_id === clan.id) && (territoryCible.construction_type === 'village');
    },
    isRenforcement(territoryCible, clan) {
        return (territoryCible.clan_id === clan.id) && ((territoryCible.construction_type === 'ville') || (territoryCible.construction_type === '2villes'));
    },

    async waitForNext() {
        uiManager.showNextBar();
    
        await new Promise((resolve) => {
            const handleNext = () => {
                document.removeEventListener('nextButtonClicked', handleNext);
                resolve();
            };
            document.addEventListener('nextButtonClicked', handleNext);
        });
        uiManager.showMenuOnlyBar();
        uiManager.updateInfoPanel('');
    },

    async realiseUrbanisations(actions) {
        for (const action of actions) {
            const territory = action.getTerritory();
            if (action.fortification_level===1 && action.isMyAction()) {
                // afficher message qui dis "votre fortification niv1 sur un village est une urbanisation. Attention une urabnisation niv1 n'a aucun effet"
                uiManager.updateInfoPanel(i18n.t('game.phases.simultaneous_play.urbanization_level1'));
                await this.waitForNext();
            }
            if ((action.fortification_level===2) || (action.fortification_level===3)) {
                territory.construction_type = "ville";
                await territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);
            }
            if (action.fortification_level===3) {
                territory.rempart = "fortifiee";
                await territory.createRempart(this.gameBoard, this.gameBoard.meepleManager);
                // rajouter une arrmee
            }            
        }
    },
    async realiseRenforcements(actions) {
        for (const action of actions) {
            const territory = action.getTerritory();
            if ((action.fortification_level===1) || (action.fortification_level===2)) {
                territory.construction_type = "2villes";
                await territory.createConstruction(this.gameBoard, this.gameBoard.meepleManager);
            }
            if (action.fortification_level===2) {
                territory.rempart = "fortifiee";
                await territory.createRempart(this.gameBoard, this.gameBoard.meepleManager);
                
            }
            if (action.fortification_level===3) {
                territory.rempart = "indestruible";
                await territory.createRempart(this.gameBoard, this.gameBoard.meepleManager);
                // rajouter une arrmee
            }
        }
    },
}
