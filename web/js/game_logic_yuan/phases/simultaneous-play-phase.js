import { uiManager } from '../ui/UIManager.js';
import { gameState } from '../gameState.js';
import { biddingPhase } from './biddingPhase.js';

export const simultaneousPlayPhase = {
    simultaneousPlayPhase(gameBoard) {
        console.log('🎯 Exécution de la phase de simultaneous_play');

        // Récupérer le clan du joueur actuel
        gameState.game.setMyClanFromVictoryBidding(gameState.myGameUserId);
        
        // Afficher la barre d'information spécifique à cette phase
        uiManager.showSimultaneousPlayInfoBar();
        
        // Afficher la barre d'action à 6 cases
        uiManager.showPlayerActionBar();
        
        
        // Vérifier s'il n'y a pas d'actions
        if (!gameState.game.actions || gameState.game.actions.length === 0) {
            console.log('🎯 Aucune action trouvée, traitement des biddings victorieux');
            this.processVictoryBiddings(gameBoard);
        }
    },

    async processVictoryBiddings(gameBoard) {
        console.log('🏆 Traitement des biddings victorieux');
        
        // 1. Supprimer les cercles de bidding
        biddingPhase.removeAllCircles(gameBoard);
        
        // 2. Récupérer tous les biddings victorieux
        const victoryBiddings = gameState.game.biddings.filter(bidding => bidding.victory === true);
        console.log(`🏆 ${victoryBiddings.length} biddings victorieux trouvés`);
        
        for (const bidding of victoryBiddings) {
            console.log(`🏆 Traitement du bidding victorieux: clan_id=${bidding.clan_id}, game_user_id=${bidding.game_user_id}`);
            
            // 3. Récupérer le clan correspondant
            const clan = gameState.game.clans.find(c => c.id === bidding.clan_id);
            if (!clan) {
                console.warn(`⚠️ Clan non trouvé pour clan_id=${bidding.clan_id}`);
                continue;
            }
            
            console.log(`🎨 Clan trouvé: ${clan.name} avec couleur ${clan.color}`);
            
            // 4. Mettre à jour available_chao du clan
            clan.available_chao = 6 - bidding.chao;
            console.log(`💰 Clan ${clan.name}: available_chao mis à jour à ${clan.available_chao} (6 - ${bidding.chao})`);
            
            // 5. Récupérer le territoire correspondant à la position du clan
            const territory = gameState.game.territories.find(t => 
                t.position.q === clan.start_q && 
                t.position.r === clan.start_r
            );
            
            if (!territory) {
                console.warn(`⚠️ Territoire non trouvé pour position (${clan.start_q}, ${clan.start_r})`);
                continue;
            }
            
            console.log(`📍 Territoire trouvé à (${territory.position.q}, ${territory.position.r})`);
            
            // 6. Mettre à jour le territoire
            territory.clan_id = clan.id;
            territory.construction_type = 'ville';
            territory.user_id = bidding.game_user_id;
            
            // 7. Créer la construction si gameBoard disponible
            if (gameBoard?.meepleManager) {
                console.log(`🏗️ Création de la ville pour le clan ${clan.name}`);
                await territory.createConstruction(gameBoard, gameBoard.meepleManager);
            } else {
                console.warn(`⚠️ gameBoard ou meepleManager non disponible pour créer la ville`);
            }
        }
        
        console.log('✅ Traitement des biddings victorieux terminé');
        
        // Incrémenter le tour de jeu simultané
        gameState.game.simultaneous_play_turn = 1;
        
        // Mettre à jour toutes les cases de la barre d'information
        uiManager.updateSimultaneousPlayInfoBar();
    }
}