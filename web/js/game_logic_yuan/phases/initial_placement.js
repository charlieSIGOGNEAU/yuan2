import { gameState } from '../gameState.js';
import { startingPositions } from '../StartingPositions.js';
import { BASIC_CLANS } from '../pieces/clanColors.js';
import { gameApi } from '../gameApi.js';
import { uiManager } from '../ui/UIManager.js';

export const initialPlacement = {
    placedClans: [], // Stockage des clans placés avec leurs infos

    // Fonction principale pour gérer le placement initial
    async execute(gameBoard) {
        console.log('🎯 Démarrage de la phase initial_placement');
        
        // 1. Calculer les distances et trouver les médoïdes
        startingPositions.calculateAllDistances();
        const medoids = startingPositions.findInitialMedoids(gameState.game.player_count);
        console.log('📍 Médoïdes trouvés:', medoids.map(m => `(${m.position.q}, ${m.position.r})`));
        
        // 2. Récupérer la liste des clans depuis gameState
        const gameClans = gameState.game.clans_data || [];
        console.log('🏛️ Clans trouvés dans gameState:', gameClans);
        
        // 3. Créer une map des couleurs depuis clanColors.js
        const colorMap = new Map();
        BASIC_CLANS.forEach(clan => {
            colorMap.set(clan.color_name, clan.color_hex);
        });
        console.log('🎨 Carte des couleurs:', colorMap);
        
        // 4. Assigner et placer les villes des clans aux positions des médoïdes
        const cityPromises = [];
        for (let i = 0; i < Math.min(gameClans.length, medoids.length); i++) {
            const clan = gameClans[i];
            const medoid = medoids[i];
            const colorHex = colorMap.get(clan.color) || '#FFFFFF'; // Couleur par défaut si non trouvée
            
            console.log(`🏘️ Placement du clan ${clan.name} (${clan.color}) à la position (${medoid.position.q}, ${medoid.position.r})`);
            
            // Créer la ville avec la couleur du clan
            const cityPromise = gameBoard.addClanCity(
                { q: medoid.position.q, r: medoid.position.r },
                colorHex,
                clan.name
            );
            
            cityPromises.push(cityPromise);
            
            // Stocker les informations du clan placé
            this.placedClans.push({
                clan: clan,
                medoid: medoid,
                color: colorHex,
                position: medoid.position
            });
        }
        
        // 5. Attendre que toutes les villes soient chargées
        try {
            const cities = await Promise.all(cityPromises);
            console.log('🏘️ Toutes les villes ont été placées avec succès:', cities.length);
            

        } catch (error) {
            console.error('❌ Erreur lors du placement des villes:', error);
        }

        // 6. message info
        uiManager.updateInfoPanel('Replace les villes si besoin, puis valide.');
    },

};
