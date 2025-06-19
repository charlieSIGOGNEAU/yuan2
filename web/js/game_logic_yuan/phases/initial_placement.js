import { gameState } from '../gameState.js';
import { startingPositions } from '../StartingPositions.js';
import { BASIC_CLANS } from '../pieces/clanColors.js';
import { gameApi } from '../gameApi.js';

export const initialPlacement = {
    placedClans: [], // Stockage des clans placés avec leurs infos

    // Fonction principale pour gérer le placement initial
    execute() {
        console.log('🎯 Démarrage de la phase initial_placement');
        
        // 1. Calculer les distances et trouver les médoïdes
        startingPositions.calculateAllDistances();
        const medoids = startingPositions.findInitialMedoids(gameState.game.player_count);
        console.log('📍 Médoïdes trouvés:', medoids.map(m => `(${m.position.q}, ${m.position.r})`));
        
        // 2. Assigner des clans aléatoires aux médoïdes
        const clanAssignments = this.assignRandomClans(medoids);
        console.log('🏯 Assignations clan/médoïde:', clanAssignments);
        
        // 3. Placer les tuiles sur le plateau
        this.placeClanTiles(clanAssignments);
        
        return clanAssignments;
    },

    // Assigner des clans aléatoires aux médoïdes
    assignRandomClans(medoids) {
        const assignments = [];
        const availableClans = [...BASIC_CLANS]; // Copie pour éviter de modifier l'original
        
        for (let i = 0; i < medoids.length; i++) {
            const medoid = medoids[i];
            
            // Choisir un clan aléatoire parmi ceux disponibles
            const randomIndex = Math.floor(Math.random() * availableClans.length);
            const selectedClan = availableClans[randomIndex];
            
            // Retirer le clan de la liste pour éviter les doublons
            availableClans.splice(randomIndex, 1);
            
            const assignment = {
                position: medoid.position,
                clan: selectedClan,
                medoidIndex: i
            };
            
            assignments.push(assignment);
            console.log(`🏯 Médoïde ${i + 1} à (${medoid.position.q}, ${medoid.position.r}) assigné au clan ${selectedClan.name} (${selectedClan.color_hex}, ${selectedClan.color_name})`);
        }
        
        return assignments;
    },

    // Placer les tuiles des clans sur le plateau 3D
    placeClanTiles(clanAssignments) {
        if (!gameApi.gameBoard) {
            console.error('❌ GameBoard3D non disponible pour placer les tuiles');
            return;
        }

        this.placedClans = []; // Réinitialiser le stockage
        
        for (const assignment of clanAssignments) {
            const imageUrl = this.getClanImageUrl(assignment.clan);
            const position = assignment.position;
            
            console.log(`🎨 Placement tuile clan ${assignment.clan.name} à (${position.q}, ${position.r}) avec image: ${imageUrl}`);
            
            // Placer la tuile sur le plateau 3D avec taille 0.5 et hauteur 0.02
            const positionWithHeight = { ...position, z: 0.1 };
            const tile3D = gameApi.gameBoard.addTile(imageUrl, positionWithHeight, 0, 0.5);
            
            // Stocker les informations de la tuile placée
            const placedClan = {
                tile3D: tile3D,
                position: position,
                clan: assignment.clan,
                medoidIndex: assignment.medoidIndex,
                imageUrl: imageUrl
            };
            
            this.placedClans.push(placedClan);
            
            console.log(`✅ Tuile clan ${assignment.clan.name} placée avec succès`);
        }
        
        console.log(`🏁 ${this.placedClans.length} tuiles de clans placées sur le plateau`);
    },

    // Construire l'URL de l'image du clan basée sur color_name
    getClanImageUrl(clan) {
        return `./images/pieces/${clan.color_name}City.png`;
    }
};
