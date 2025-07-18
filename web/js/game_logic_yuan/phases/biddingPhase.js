import { gameState } from '../gameState.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';

export const biddingPhase = {
    
    // Fonction principale pour gérer la phase de bidding
    async execute(gameBoard) {
        console.log('🎯 Démarrage de la phase bidding_phase');
        
        // Afficher un message d'information
        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions') || 'Phase de mises en cours...');
        
        // Afficher la barre d'actions de bidding
        uiManager.showBiddingBar();
        
        // Initialiser le texte de bidding avec des valeurs par défaut
        uiManager.updateBiddingText(0, 10);
        
        console.log('✅ Phase de bidding initialisée');
    }
}; 