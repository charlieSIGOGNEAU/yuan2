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
}
