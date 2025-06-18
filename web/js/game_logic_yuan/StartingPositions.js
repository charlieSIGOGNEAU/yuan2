// Gestion des distances entre territoires et calcul des positions de départ
import { gameState } from './gameState.js';

class StartingPositions {
    constructor() {
        this.distances = new Map(); // Map<string, number> avec clé "territory1Id-territory2Id"
    }

    // Obtenir les territoires valides (ni water ni mountain)
    getValidTerritories() {
        const validTypes = ['mine', 'forest', 'plain', 'rice'];
        return gameState.game.territories.filter(territory => 
            validTypes.includes(territory.type)
        );
    }

    // Vérifier si deux territoires sont adjacents
    areTerritoriesAdjacent(territory1, territory2) {
        return territory1.areTerritoryAdjacent(territory2);
    }

    // Vérifier si deux territoires sont connectés par un lac
    areTerritoriesConnectedByLake(territory1, territory2) {
        for (const lake of gameState.game.lakes.values()) {
            if (lake.connectedTerritories.has(territory1) && 
                lake.connectedTerritories.has(territory2)) {
                return true;
            }
        }
        return false;
    }

    // Calculer la distance directe entre deux territoires
    getDirectDistance(territory1, territory2) {
        if (territory1 === territory2) {
            return 0;
        }
        
        // Adjacents directs
        if (this.areTerritoriesAdjacent(territory1, territory2)) {
            return 1;
        }
        
        // Connectés par lac
        if (this.areTerritoriesConnectedByLake(territory1, territory2)) {
            return 1.5;
        }
        
        return Infinity; // Pas de connexion directe
    }

    // Calculer toutes les distances avec l'algorithme Floyd-Warshall
    calculateAllDistances() {
        const validTerritories = this.getValidTerritories();
        const n = validTerritories.length;
        
        console.log(`Calcul des distances pour ${n} territoires avec Floyd-Warshall...`);
        
        // Créer la matrice de distances
        const distMatrix = Array(n).fill().map(() => Array(n).fill(Infinity));
        
        // Initialiser les distances directes
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    distMatrix[i][j] = 0;
                } else {
                    distMatrix[i][j] = this.getDirectDistance(validTerritories[i], validTerritories[j]);
                }
            }
        }
        
        // Algorithme Floyd-Warshall
        for (let k = 0; k < n; k++) {
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < n; j++) {
                    if (distMatrix[i][k] + distMatrix[k][j] < distMatrix[i][j]) {
                        distMatrix[i][j] = distMatrix[i][k] + distMatrix[k][j];
                    }
                }
            }
            
            // Log de progression
            if (k % 10 === 0) {
                console.log(`Progression Floyd-Warshall: ${k}/${n} étapes`);
            }
        }
        
        // Stocker les résultats dans la Map
        this.distances.clear();
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const key1 = `${this.getTerritoryKey(validTerritories[i])}-${this.getTerritoryKey(validTerritories[j])}`;
                    this.distances.set(key1, distMatrix[i][j]);
                }
            }
        }
        
        console.log(`Calcul Floyd-Warshall terminé. ${this.distances.size} distances calculées.`);
    }

    // Générer une clé unique pour un territoire
    getTerritoryKey(territory) {
        return `${territory.position.q},${territory.position.r}`;
    }

    // Obtenir la distance entre deux territoires
    getDistance(territory1, territory2) {
        if (territory1 === territory2) return 0;
        
        const key = `${this.getTerritoryKey(territory1)}-${this.getTerritoryKey(territory2)}`;
        return this.distances.get(key) || Infinity;
    }

    // Limiter les distances supérieures à un maximum (pour l'algorithme PAM)
    capDistances(maxDistance = 5) {
        for (const [key, distance] of this.distances) {
            if (distance > maxDistance) {
                this.distances.set(key, maxDistance);
            }
        }
        console.log(`Distances limitées à ${maxDistance}`);
    }

    // TODO: Implémenter l'algorithme PAM pour trouver les positions de départ optimales
    findStartingPositions(playerCount = 3) {
        // À implémenter plus tard
        console.log(`Recherche de ${playerCount} positions de départ...`);
    }

    // Trouver n médoïdes initiaux bien répartis en utilisant l'approche géométrique
    findInitialMedoids(n = 3) {
        const validTerritories = this.getValidTerritories();
        
        if (validTerritories.length < n) {
            console.error(`Pas assez de territoires valides (${validTerritories.length}) pour ${n} médoïdes`);
            return validTerritories;
        }

        console.log(`Recherche de ${n} médoïdes initiaux parmi ${validTerritories.length} territoires...`);

        // 1. Regrouper les territoires en zones connectées
        const connectedZones = this.findConnectedZones(validTerritories);
        console.log(`${connectedZones.length} zones connectées trouvées:`, connectedZones.map(zone => zone.length));

        // 2. Filtrer les zones trop petites (moins de territoires que total/nombre de joueurs)
        const minZoneSize = Math.floor(validTerritories.length / n);
        const validZones = connectedZones.filter(zone => zone.length >= minZoneSize);
        console.log(`${validZones.length} zones valides (taille min: ${minZoneSize}):`, validZones.map(zone => zone.length));

        if (validZones.length === 0) {
            console.error('Aucune zone assez grande trouvée, utilisation de la plus grande zone');
            const largestZone = connectedZones.reduce((largest, current) => 
                current.length > largest.length ? current : largest, connectedZones[0]);
            validZones.push(largestZone);
        }

        // 3. Répartir les joueurs proportionnellement dans chaque zone
        const playerDistribution = this.distributePlayersInZones(validZones, n);
        console.log('Répartition des joueurs:', playerDistribution);

        // 4. Trouver les médoïdes dans chaque zone
        const allMedoids = [];
        for (let i = 0; i < validZones.length; i++) {
            const zone = validZones[i];
            const playersInZone = playerDistribution[i];
            
            if (playersInZone > 0) {
                const zoneMedoids = this.findMedoidsInZone(zone, playersInZone);
                allMedoids.push(...zoneMedoids);
                console.log(`Zone ${i + 1}: ${playersInZone} médoïdes trouvés`);
            }
        }

        return allMedoids.slice(0, n); // S'assurer qu'on ne dépasse pas n médoïdes
    }

    // Regrouper les territoires en zones connectées
    findConnectedZones(territories) {
        const visited = new Set();
        const zones = [];

        for (const territory of territories) {
            if (!visited.has(territory)) {
                const zone = [];
                this.exploreConnectedZone(territory, territories, visited, zone);
                if (zone.length > 0) {
                    zones.push(zone);
                }
            }
        }

        return zones;
    }

    // Explorer récursivement une zone connectée (DFS)
    exploreConnectedZone(territory, allTerritories, visited, zone) {
        if (visited.has(territory)) return;
        
        visited.add(territory);
        zone.push(territory);

        // Chercher tous les territoires connectés
        for (const other of allTerritories) {
            if (!visited.has(other)) {
                const distance = this.getDirectDistance(territory, other);
                if (distance !== Infinity) {
                    this.exploreConnectedZone(other, allTerritories, visited, zone);
                }
            }
        }
    }

    // Répartir les joueurs proportionnellement dans les zones
    distributePlayersInZones(zones, totalPlayers) {
        const totalTerritories = zones.reduce((sum, zone) => sum + zone.length, 0);
        const distribution = [];
        let playersAssigned = 0;

        // Calculer la répartition proportionnelle
        for (let i = 0; i < zones.length; i++) {
            const zoneSize = zones[i].length;
            const proportion = zoneSize / totalTerritories;
            let playersForZone;
            
            if (i === zones.length - 1) {
                // Dernière zone : assigner tous les joueurs restants
                playersForZone = totalPlayers - playersAssigned;
            } else {
                playersForZone = Math.round(proportion * totalPlayers);
            }
            
            playersForZone = Math.max(0, playersForZone); // Minimum 0
            distribution.push(playersForZone);
            playersAssigned += playersForZone;
        }

        return distribution;
    }

    // Trouver les médoïdes dans une zone spécifique
    findMedoidsInZone(zoneTerritorries, playerCount) {
        if (playerCount === 0) return [];
        if (playerCount === 1) {
            // Un seul joueur : trouver le centre de la zone
            return [this.findZoneCenter(zoneTerritorries)];
        }

        console.log(`Recherche de ${playerCount} médoïdes dans une zone de ${zoneTerritorries.length} territoires`);

        // 1. Limiter les distances à 5 pour cette zone
        this.capDistancesForZone(zoneTerritorries, 5);

        // 2. Trouver les médoïdes initiaux avec l'approche géométrique
        const initialMedoids = this.findInitialMedoidsGeometric(zoneTerritorries, playerCount);
        console.log(`Médoïdes initiaux trouvés:`, initialMedoids.map(m => `(${m.position.q}, ${m.position.r})`));

        // 3. Optimiser avec l'algorithme PAM
        const optimizedMedoids = this.optimizeMedoidsWithPAM(zoneTerritorries, initialMedoids);
        console.log(`Médoïdes optimisés:`, optimizedMedoids.map(m => `(${m.position.q}, ${m.position.r})`));

        return optimizedMedoids;
    }

    // Limiter les distances pour une zone spécifique
    capDistancesForZone(zoneTerritorries, maxDistance = 5) {
        console.log(`Limitation des distances à ${maxDistance} pour la zone de ${zoneTerritorries.length} territoires`);
        
        for (let i = 0; i < zoneTerritorries.length; i++) {
            for (let j = i + 1; j < zoneTerritorries.length; j++) {
                const territory1 = zoneTerritorries[i];
                const territory2 = zoneTerritorries[j];
                const key1 = `${this.getTerritoryKey(territory1)}-${this.getTerritoryKey(territory2)}`;
                const key2 = `${this.getTerritoryKey(territory2)}-${this.getTerritoryKey(territory1)}`;
                
                const distance = this.distances.get(key1);
                if (distance && distance !== Infinity && distance > maxDistance) {
                    this.distances.set(key1, maxDistance);
                    this.distances.set(key2, maxDistance);
                }
            }
        }
    }

    // Trouver les médoïdes initiaux avec l'approche géométrique (version zone)
    findInitialMedoidsGeometric(zoneTerritorries, playerCount) {
        // 1. Trouver le territoire central de la zone
        const centralTerritory = this.findZoneCenter(zoneTerritorries);
        console.log(`Centre de zone trouvé à (${centralTerritory.position.q}, ${centralTerritory.position.r})`);

        // 2. Trouver la distance maximale depuis le centre dans cette zone
        let maxDistanceFromCenter = 0;
        for (const territory of zoneTerritorries) {
            const distance = this.getDistance(centralTerritory, territory);
            if (distance !== Infinity && distance > maxDistanceFromCenter) {
                maxDistanceFromCenter = distance;
            }
        }
        
        console.log(`Rayon de la zone : ${maxDistanceFromCenter}`);

        // 3. Diviser les 360° en playerCount parts égales et trouver les territoires les plus proches
        const medoids = [];
        const angleStep = (2 * Math.PI) / playerCount;
        
        for (let i = 0; i < playerCount; i++) {
            const angle = i * angleStep;
            
            // Calculer les coordonnées du point cible sur le cercle
            const radiusInCoords = maxDistanceFromCenter * 0.5;
            const targetQ = centralTerritory.position.q + Math.cos(angle) * radiusInCoords;
            const targetR = centralTerritory.position.r + Math.sin(angle) * radiusInCoords;
            
            // Trouver le territoire le plus proche de ce point cible DANS CETTE ZONE
            let closestTerritory = null;
            let minDistanceToTarget = Infinity;
            
            for (const territory of zoneTerritorries) {
                const dq = territory.position.q - targetQ;
                const dr = territory.position.r - targetR;
                const euclideanDistance = Math.sqrt(dq * dq + dr * dr);
                
                if (euclideanDistance < minDistanceToTarget) {
                    minDistanceToTarget = euclideanDistance;
                    closestTerritory = territory;
                }
            }
            
            medoids.push(closestTerritory);
            console.log(`Médoïde initial ${i + 1} trouvé à (${closestTerritory.position.q}, ${closestTerritory.position.r}) - angle: ${Math.round(angle * 180 / Math.PI)}°`);
        }

        // Vérifier qu'on n'a pas de doublons
        const uniqueMedoids = [...new Set(medoids)];
        if (uniqueMedoids.length < playerCount) {
            console.warn(`Doublons détectés dans la zone, utilisation de ${uniqueMedoids.length} médoïdes uniques`);
            
            // Compléter avec des territoires aléatoires de la zone si nécessaire
            while (uniqueMedoids.length < playerCount) {
                const availableTerritories = zoneTerritorries.filter(t => !uniqueMedoids.includes(t));
                if (availableTerritories.length > 0) {
                    uniqueMedoids.push(availableTerritories[0]);
                } else {
                    break;
                }
            }
        }

        return uniqueMedoids;
    }

    // Optimiser les médoïdes avec l'algorithme PAM
    optimizeMedoidsWithPAM(zoneTerritorries, initialMedoids) {
        console.log(`🔄 Démarrage de l'algorithme PAM pour ${initialMedoids.length} médoïdes`);
        
        let currentMedoids = [...initialMedoids];
        const maxIterations = 10;
        const maxTime = 2000; // 2 secondes en millisecondes
        const startTime = performance.now();
        
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            console.log(`PAM Itération ${iteration + 1}/${maxIterations}`);
            
            // Vérifier le timeout
            if (performance.now() - startTime > maxTime) {
                console.log(`⏰ Timeout PAM atteint (${maxTime}ms), arrêt à l'itération ${iteration + 1}`);
                break;
            }
            
            // 1. Assigner chaque territoire au médoïde le plus proche
            const clusters = this.assignTerritoriesToMedoids(zoneTerritorries, currentMedoids);
            
            // 2. Pour chaque cluster, trouver le meilleur représentant
            const newMedoids = [];
            let hasChanged = false;
            
            for (let i = 0; i < currentMedoids.length; i++) {
                const cluster = clusters[i];
                if (cluster.length === 0) {
                    // Cluster vide, garder l'ancien médoïde
                    newMedoids.push(currentMedoids[i]);
                    continue;
                }
                
                const bestRepresentative = this.findBestRepresentative(cluster);
                newMedoids.push(bestRepresentative);
                
                if (bestRepresentative !== currentMedoids[i]) {
                    hasChanged = true;
                    console.log(`  Médoïde ${i + 1} changé: (${currentMedoids[i].position.q}, ${currentMedoids[i].position.r}) → (${bestRepresentative.position.q}, ${bestRepresentative.position.r})`);
                }
            }
            
            // 3. Si aucun médoïde n'a changé, convergence atteinte
            if (!hasChanged) {
                console.log(`✅ Convergence PAM atteinte à l'itération ${iteration + 1}`);
                break;
            }
            
            currentMedoids = newMedoids;
        }
        
        const totalTime = performance.now() - startTime;
        console.log(`🏁 PAM terminé en ${Math.round(totalTime)}ms`);
        
        return currentMedoids;
    }

    // Assigner chaque territoire au médoïde le plus proche
    assignTerritoriesToMedoids(territories, medoids) {
        const clusters = Array(medoids.length).fill().map(() => []);
        
        for (const territory of territories) {
            let closestMedoidIndex = 0;
            let minDistance = this.getDistance(territory, medoids[0]);
            
            for (let i = 1; i < medoids.length; i++) {
                const distance = this.getDistance(territory, medoids[i]);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestMedoidIndex = i;
                }
            }
            
            clusters[closestMedoidIndex].push(territory);
        }
        
        console.log(`  Clusters formés: ${clusters.map(c => c.length).join(', ')} territoires`);
        return clusters;
    }

    // Trouver le meilleur représentant d'un cluster (somme de distances minimale)
    findBestRepresentative(cluster) {
        if (cluster.length === 1) return cluster[0];
        
        let bestRepresentative = cluster[0];
        let minTotalDistance = Infinity;
        
        for (const candidate of cluster) {
            let totalDistance = 0;
            
            for (const territory of cluster) {
                if (candidate !== territory) {
                    const distance = this.getDistance(candidate, territory);
                    totalDistance += distance;
                }
            }
            
            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                bestRepresentative = candidate;
            }
        }
        
        return bestRepresentative;
    }

    // Trouver le centre d'une zone (territoire avec la plus petite somme de distances)
    findZoneCenter(zoneTerritorries) {
        let centralTerritory = null;
        let minTotalDistance = Infinity;
        
        for (const territory of zoneTerritorries) {
            let totalDistance = 0;
            for (const other of zoneTerritorries) {
                if (territory !== other) {
                    const distance = this.getDistance(territory, other);
                    if (distance !== Infinity) {
                        totalDistance += distance;
                    }
                }
            }
            
            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                centralTerritory = territory;
            }
        }
        
        return centralTerritory;
    }
}

// Instance globale
export const startingPositions = new StartingPositions(); 