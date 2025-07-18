import { gameState } from '../gameState.js';
import { uiManager } from '../ui/UIManager.js';
import { i18n } from '../../core/i18n.js';
import { ALL_CLANS } from '../pieces/clanColors.js';

export const biddingPhase = {
    
    // Fonction utilitaire pour obtenir la couleur hex d'un clan
    getClanColorHex(clan) {
        // Si le clan a déjà une couleur hex, l'utiliser
        if (clan.color_hex) {
            return clan.color_hex;
        }
        
        // Sinon, chercher dans ALL_CLANS par nom
        const foundClan = ALL_CLANS.find(c => 
            c.name === clan.name || c.name === clan.color
        );
        
        if (foundClan) {
            return foundClan.color_hex;
        }
        
        // Fallback : couleurs par défaut selon le nom/couleur
        const colorMapping = {
            'red': '#FF0000',
            'blue': '#0000FF', 
            'green': '#008000',
            'yellow': '#FFFF00',
            'white': '#FFFFFF',
            'black': '#000000',
            'purple': '#800080',
            'orange': '#FFA500'
        };
        
        return colorMapping[clan.color] || colorMapping[clan.name] || '#808080'; // Gris par défaut
    },
    
    // Fonction principale pour gérer la phase de bidding
    async execute(gameBoard) {
        console.log('🎯 Démarrage de la phase bidding_phase');
        
        // Initialiser les meeples avec les couleurs des clans disponibles
        await this.initializeMeeples(gameBoard);
        
        // Afficher un message d'information
        uiManager.updateInfoPanel(i18n.t('game.phases.bidding.instructions') );
        
        // Afficher la barre d'actions de bidding
        uiManager.showBiddingBar();
        
        // Attendre que la barre soit bien affichée avant d'initialiser le texte
        setTimeout(() => {
            uiManager.updateBiddingText(0, 6);
        }, 200);
        
        console.log('✅ Phase de bidding initialisée');
    },

    // Initialiser les meeples avec les couleurs des clans
    async initializeMeeples(gameBoard) {
        console.log('🎭 Initialisation des meeples pour la phase de bidding...');
        
        try {
            // Récupérer les données des clans depuis gameState
            const clansData = gameState.game?.clans || [];
            
            if (clansData.length === 0) {
                console.warn('⚠️ Aucun clan trouvé dans gameState');
                return;
            }
            
            console.log(`🏰 ${clansData.length} clans trouvés:`, clansData.map(clan => `${clan.name} (${this.getClanColorHex(clan)})`));
            
            // Préparer les données des clans avec les couleurs hex
            const clansWithHexColors = clansData.map(clan => ({
                ...clan,
                color_hex: this.getClanColorHex(clan)
            }));
            
            // Initialiser les meeples dans GameBoard3D
            if (gameBoard && gameBoard.initializeMeeplesWithClans) {
                await gameBoard.initializeMeeplesWithClans(clansWithHexColors);
                console.log('✅ Meeples initialisés avec succès pour la phase de bidding');
            } else {
                console.error('❌ GameBoard3D non disponible ou méthode manquante');
            }
            
            // Placer les villes des clans sur leurs territoires de départ
            await this.placeClanCitiesOnTerritories(gameBoard, clansData);
            
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation des meeples:', error);
            // Ne pas bloquer la phase de bidding si l'initialisation échoue
        }
    },

    // Placer les villes des clans sur leurs territoires de départ
    async placeClanCitiesOnTerritories(gameBoard, clansData) {
        console.log('🏘️ Placement des villes des clans sur leurs territoires de départ...');
        
        try {
            // Récupérer les territoires depuis gameState
            const territories = gameState.game?.territories || [];
            
            if (territories.length === 0) {
                console.warn('⚠️ Aucun territoire trouvé dans gameState');
                return;
            }
            
            console.log(`🗺️ ${territories.length} territoires disponibles`);
            
            // Pour chaque clan
            for (const clan of clansData) {
                console.log(`🔍 Recherche du territoire pour le clan ${clan.name} à la position (${clan.start_q}, ${clan.start_r})`);
                
                // Chercher le territoire qui correspond aux coordonnées de départ du clan
                const matchingTerritory = territories.find(territory => 
                    territory.position.q === clan.start_q && 
                    territory.position.r === clan.start_r
                );
                
                if (matchingTerritory) {
                    console.log(`📍 Territoire trouvé pour ${clan.name}:`, matchingTerritory);
                    
                    // Vérifier si le territoire n'a pas déjà une ville
                    if (matchingTerritory.construction_type !== 'ville') {
                        console.log(`🏗️ Mise à jour du territoire: construction_type = "ville" pour ${clan.name}`);
                        
                        // Mettre à jour le construction_type du territoire
                        matchingTerritory.construction_type = 'ville';
                        
                        // Créer la ville 3D à cette position avec la couleur du clan
                        const clanColorHex = this.getClanColorHex(clan);
                        console.log(`🏘️ Création de la ville 3D pour ${clan.name} avec couleur ${clanColorHex}`);
                        
                        if (gameBoard && gameBoard.addMeeple) {
                            const cityPosition = { q: clan.start_q, r: clan.start_r };
                            const cityMesh = gameBoard.addMeeple('ville', cityPosition, clanColorHex, {
                                clanName: clan.name,
                                clanId: clan.id,
                                isStartingCity: true,
                                fromBiddingPhase: true
                            });
                            
                            if (cityMesh) {
                                console.log(`✅ Ville créée avec succès pour ${clan.name} à la position (${clan.start_q}, ${clan.start_r})`);
                            } else {
                                console.error(`❌ Échec de création de la ville pour ${clan.name}`);
                            }
                        } else {
                            console.error('❌ GameBoard3D non disponible pour créer la ville');
                        }
                    } else {
                        console.log(`ℹ️ Le territoire du clan ${clan.name} a déjà une ville`);
                    }
                } else {
                    console.warn(`⚠️ Aucun territoire trouvé pour le clan ${clan.name} à la position (${clan.start_q}, ${clan.start_r})`);
                }
            }
            
            console.log('✅ Placement des villes des clans terminé');
            
            // Afficher un résumé des villes placées
            this.displayCitiesPlacementSummary(clansData, territories);
            
        } catch (error) {
            console.error('❌ Erreur lors du placement des villes des clans:', error);
        }
    },

    // Afficher un résumé du placement des villes
    displayCitiesPlacementSummary(clansData, territories) {
        console.log('\n📊 === RÉSUMÉ DU PLACEMENT DES VILLES ===');
        
        const citiesPlaced = [];
        const citiesMissing = [];
        
        clansData.forEach(clan => {
            const territory = territories.find(t => 
                t.position.q === clan.start_q && 
                t.position.r === clan.start_r
            );
            
            if (territory && territory.construction_type === 'ville') {
                citiesPlaced.push({
                    clan: clan.name,
                    position: `(${clan.start_q}, ${clan.start_r})`,
                    color: this.getClanColorHex(clan)
                });
            } else {
                citiesMissing.push({
                    clan: clan.name,
                    position: `(${clan.start_q}, ${clan.start_r})`,
                    reason: territory ? 'Territoire sans ville' : 'Territoire introuvable'
                });
            }
        });
        
        console.log(`🏘️ Villes placées avec succès: ${citiesPlaced.length}`);
        citiesPlaced.forEach(city => {
            console.log(`   ✅ ${city.clan} à ${city.position} - ${city.color}`);
        });
        
        if (citiesMissing.length > 0) {
            console.log(`⚠️ Villes non placées: ${citiesMissing.length}`);
            citiesMissing.forEach(city => {
                console.log(`   ❌ ${city.clan} à ${city.position} - ${city.reason}`);
            });
        }
        
        console.log('📊 === FIN DU RÉSUMÉ ===\n');
    },

    // Fonction de debug pour vérifier l'état des territoires
    debugTerritories() {
        const territories = gameState.game?.territories || [];
        console.log('\n🔍 === DEBUG TERRITOIRES ===');
        console.log(`Total territoires: ${territories.length}`);
        
        const territoryTypes = {};
        const constructionTypes = {};
        
        territories.forEach(territory => {
            // Compter les types de terrain
            territoryTypes[territory.type] = (territoryTypes[territory.type] || 0) + 1;
            
            // Compter les types de construction
            if (territory.construction_type) {
                constructionTypes[territory.construction_type] = (constructionTypes[territory.construction_type] || 0) + 1;
            }
        });
        
        console.log('🗺️ Types de terrain:', territoryTypes);
        console.log('🏗️ Types de construction:', constructionTypes);
        
        // Afficher les territoires avec des villes
        const citiesInTerritories = territories.filter(t => t.construction_type === 'ville');
        console.log(`🏘️ Territoires avec des villes: ${citiesInTerritories.length}`);
        citiesInTerritories.forEach(city => {
            console.log(`   🏘️ Ville à (${city.position.q}, ${city.position.r}) sur ${city.type}`);
        });
        
        console.log('🔍 === FIN DEBUG ===\n');
    }
};

// Rendre les fonctions de debug accessibles globalement pour les tests
window.debugBiddingPhase = () => {
    console.log('🛠️ Fonctions de debug disponibles:');
    console.log('- debugBiddingPhase() : Affiche cette aide');
    console.log('- debugTerritories() : Affiche l\'état des territoires');
    console.log('- debugClans() : Affiche les clans et leurs couleurs');
};

window.debugTerritories = () => biddingPhase.debugTerritories();

window.debugClans = () => {
    const clans = gameState.game?.clans || [];
    console.log('\n🏰 === DEBUG CLANS ===');
    console.log(`Total clans: ${clans.length}`);
    
    clans.forEach(clan => {
        const colorHex = biddingPhase.getClanColorHex(clan);
        console.log(`🏛️ ${clan.name}:`);
        console.log(`   Couleur: ${clan.color} → ${colorHex}`);
        console.log(`   Position de départ: (${clan.start_q}, ${clan.start_r})`);
        console.log(`   ID: ${clan.id}`);
    });
    
    console.log('🏰 === FIN DEBUG CLANS ===\n');
}; 