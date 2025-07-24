import { gameState } from '../gameState.js';
import { startingPositions } from '../StartingPositions.js';
import { ALL_CLANS } from '../pieces/clanColors.js';
import { gameApi } from '../gameApi.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';

export const initialPlacement = {
    placedClans: [], // Stockage des clans placés avec leurs infos

    // Fonction principale pour gérer le placement initial
    async execute(gameBoard) {
        console.log('🎯 Démarrage de la phase initial_placement');
        
        // 1. Calculer les distances et trouver les médoïdes
        startingPositions.calculateAllDistances();
        const medoids = startingPositions.findInitialMedoids(gameState.game.player_count);
        console.log('📍 Médoïdes trouvés:', medoids.map(m => `(${m.position.q}, ${m.position.r})`));
        
        // 2. Récupérer la liste des clans depuis gameState.game.clan_names (string)
        const clanNamesString = gameState.game.clan_names || '';
        const clanNames = clanNamesString.split(' ').filter(name => name.trim() !== '');
        console.log('🏛️ Noms des clans trouvés:', clanNames);
        
        // 3. Récupérer les clans correspondants depuis clanColors.js
        const gameClans = [];
        clanNames.forEach(clanName => {
            const foundClan = ALL_CLANS.find(clan => clan.name === clanName);
            if (foundClan) {
                gameClans.push(foundClan);
            } else {
                console.warn(`⚠️ Clan non trouvé dans ALL_CLANS: ${clanName}`);
            }
        });
        console.log('🎨 Clans avec couleurs:', gameClans);
        
        // 4. Assigner et placer les villes des clans aux positions des médoïdes
        const cityPromises = [];
        for (let i = 0; i < Math.min(gameClans.length, medoids.length); i++) {
            const clan = gameClans[i];
            const medoid = medoids[i];
            const colorHex = clan.color_hex; // Utiliser la couleur du clan
            
            console.log(`🏘️ Placement du clan ${clan.name} avec couleur ${clan.color_name} (${colorHex}) à la position (${medoid.position.q}, ${medoid.position.r})`);
            
            // Créer la ville avec la couleur du clan (marquer comme initial placement)
            const cityPromise = gameBoard.addClanCity(
                { q: medoid.position.q, r: medoid.position.r },
                colorHex,
                clan.name,
                true // isInitialPlacement = true
            );
            
            cityPromises.push(cityPromise);
            
            // Stocker les informations du clan placé avec toutes les données
            this.placedClans.push({
                name: clan.name,
                color_name: clan.color_name,
                color_hex: clan.color_hex,
                position: medoid.position,
                medoid: medoid
            });
        }
        
        // 5. Attendre que toutes les villes soient chargées
        try {
            const cities = await Promise.all(cityPromises);
            console.log('🏘️ Toutes les villes ont été placées avec succès:', cities.length);
            

        } catch (error) {
            console.error('❌ Erreur lors du placement des villes:', error);
        }

        // 6. message info (avec vérification que l'UI est initialisée)
        if (uiManager.gameUI) {
            uiManager.updateInfoPanel(i18n.t('game.phases.initial_placement.instructions'));    
            uiManager.showValidationBar();
        } else {
            console.log('⏳ UI non encore initialisée, attente...');
            // Attendre que l'UI soit prête
            setTimeout(() => {
                if (uiManager.gameUI) {
                    uiManager.updateInfoPanel(i18n.t('game.phases.initial_placement.instructions'));    
                    uiManager.showValidationBar();
                } else {
                    console.warn('⚠️ UI toujours non initialisée après délai');
                }
            }, 1000);
        }
        
        // 7. Activer le drag & drop des villes pour permettre le repositionnement
        gameBoard.enableCityDrag();
    },

};
