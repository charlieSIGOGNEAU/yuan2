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

        // 1. Trouver le territoire central (celui avec la plus petite somme de distances)
        let centralTerritory = null;
        let minTotalDistance = Infinity;
        
        for (const territory of validTerritories) {
            let totalDistance = 0;
            for (const other of validTerritories) {
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
        
        console.log(`Territoire central trouvé à (${centralTerritory.position.q}, ${centralTerritory.position.r})`);

        // 2. Trouver la distance maximale depuis le centre (pour définir le rayon du cercle)
        let maxDistanceFromCenter = 0;
        for (const territory of validTerritories) {
            const distance = this.getDistance(centralTerritory, territory);
            if (distance !== Infinity && distance > maxDistanceFromCenter) {
                maxDistanceFromCenter = distance;
            }
        }
        
        console.log(`Rayon du cercle : ${maxDistanceFromCenter}`);

        // 3. Diviser les 360° en n parts égales et trouver les territoires les plus proches
        const medoids = [];
        const angleStep = (2 * Math.PI) / n; // En radians
        
        for (let i = 0; i < n; i++) {
            const angle = i * angleStep;
            
            // Calculer les coordonnées du point cible sur le cercle
            // On utilise le rayon en "distance de jeu" mais on applique sur les coordonnées
            const radiusInCoords = maxDistanceFromCenter * 0.5; // Facteur d'ajustement empirique
            const targetQ = centralTerritory.position.q + Math.cos(angle) * radiusInCoords;
            const targetR = centralTerritory.position.r + Math.sin(angle) * radiusInCoords;
            
            // Trouver le territoire le plus proche de ce point cible
            let closestTerritory = null;
            let minDistanceToTarget = Infinity;
            
            for (const territory of validTerritories) {
                // Distance euclidienne aux coordonnées cibles
                const dq = territory.position.q - targetQ;
                const dr = territory.position.r - targetR;
                const euclideanDistance = Math.sqrt(dq * dq + dr * dr);
                
                if (euclideanDistance < minDistanceToTarget) {
                    minDistanceToTarget = euclideanDistance;
                    closestTerritory = territory;
                }
            }
            
            medoids.push(closestTerritory);
            console.log(`Médoïde ${i + 1} trouvé à (${closestTerritory.position.q}, ${closestTerritory.position.r}) - angle: ${Math.round(angle * 180 / Math.PI)}°`);
        }

        // Vérifier qu'on n'a pas de doublons (peut arriver si territoires très proches)
        const uniqueMedoids = [...new Set(medoids)];
        if (uniqueMedoids.length < n) {
            console.warn(`Doublons détectés, utilisation de ${uniqueMedoids.length} médoïdes uniques`);
            
            // Compléter avec des territoires aléatoires si nécessaire
            while (uniqueMedoids.length < n) {
                const availableTerritories = validTerritories.filter(t => !uniqueMedoids.includes(t));
                if (availableTerritories.length > 0) {
                    uniqueMedoids.push(availableTerritories[0]);
                } else {
                    break;
                }
            }
        }

        return uniqueMedoids;
    }
}

// Instance globale
export const startingPositions = new StartingPositions(); 