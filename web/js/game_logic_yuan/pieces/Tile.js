export class Tile {
    // tiles du jeux qui comorte 7 zones
    //dans l'ordre (0,0) (1,0) (0,1) (-1,1) (-1,0) (0,-1) (1,-1)
    // de type (sans accent) eau, montagne, foret, mine, riziere, plaine
    constructor(tileConfig) {
        this.textureUrl = tileConfig.image;
        this.width = 3;
        this.height = 3;
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        
        // Stockage des types de zones
        this.zones = tileConfig.zones;
    }

    getZoneType(zoneIndex) {
        return this.zones[zoneIndex] ;
    }

    // addTerrain() {
    //     // Récupérer la configuration de la tile
    //     const tileConfig = TILE_CONFIGS[this.name];
    //     if (!tileConfig) {
    //         console.error('Configuration non trouvée pour la tile:', this.name);
    //         return;
    //     }

    //     // Tableau des modifications de position pour chaque terrain
    //     const positionModifiers = [
    //         { q: +0, r: +0 },  // Centre
    //         { q: +1, r: +0 },  // Droite
    //         { q: +0, r: +1 },  // Haut droite
    //         { q: -1, r: +1 },  // Haut gauche
    //         { q: -1, r: +0 },  // Gauche
    //         { q: +0, r: -1 },  // Bas gauche
    //         { q: +1, r: -1 }   // Bas droite
    //     ];

    //     // Créer un terrain pour chaque élément du tableau
    //     tileConfig.terrain.forEach((zone, index) => {
    //         // Calculer la position modifiée
    //         const modifiedPosition = {
    //             q: this.position.q + positionModifiers[index].q,
    //             r: this.position.r + positionModifiers[index].r
    //         };

    //         // Créer le terrain
    //         const terrain = new Terrain(zone, modifiedPosition);
    //         this.terrains.push(terrain);
    //     });
    // }
}
