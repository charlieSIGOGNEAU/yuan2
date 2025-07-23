import { uiManager } from '../ui/UIManager.js';

export const simultaneousPlayPhase = {
    simultaneousPlayPhase(gameBoard) {
        console.log('🎯 Exécution de la phase de simultaneous_play');
        
        // Afficher la barre d'information spécifique à cette phase
        uiManager.showSimultaneousPlayInfoBar();
        
        // Afficher la barre d'action à 6 cases
        uiManager.showPlayerActionBar();
    }
}