// Classes pour les modèles backend
import { TILE_CONFIGS } from './pieces/TileTypes.js';


class User {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || '';
    }

    update(data) {
        this.id = data.id || this.id;
        this.name = data.name || this.name;
    }
}

class GameUser {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.faction = data.faction || '';
        this.user_name = data.user_name || ''; 
    }

    update(data) {
        this.id = data.id || this.id;
        this.user_id = data.user_id || this.user_id;
        this.faction = data.faction || this.faction;
        this.user_name = data.user_name || this.user_name;
    }
}

class Tile {
    constructor(data = {}) {
        this.id = data.id || null;
        this.name = data.name || null;
        this.position = {
            q: data.position_q ?? null,
            r: data.position_r ?? null
        };
        this.rotation = data.rotation || 0;
        this.game_user_id = data.game_user_id || null;
        this.turn = data.turn || 0;
        this.sprite = null;
        this.terrain = null;
        if (this.position && this.position.q !== null) {
            this.addTerrain();
        }
        console.log('tile new', this);
    }

    update(data) {
        console.log('update tile', this);
        this.id = data.id || this.id;
        this.name = data.name || this.name;
        if (data.position_q !== undefined || data.position_r !== undefined) {
            this.position = {
                q: data.position_q ?? this.position.q,
                r: data.position_r ?? this.position.r
            };
        }
        this.rotation = data.rotation || this.rotation;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.turn = data.turn || this.turn;
        if (this.position && this.position.q !== null) {
            this.addTerrain();
        }
    }

    addTerrain() {
        // Récupérer la configuration de la tile
        const tileConfig = TILE_CONFIGS[this.name];
        if (!tileConfig) {
            console.error('Configuration non trouvée pour la tile:', this.name);
            return;
        }
        console.log('addTerrain 1', this);

        // Tableau des modifications de position pour chaque terrain
        const positionModifiers = [
            { q: +0, r: +0 },  // Centre
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        // Faire pivoter le tableau des terrains en fonction de la rotation
        const rotatedTerrains = [...tileConfig.terrains];
        // On garde le centre (index 0) et on fait pivoter le reste
        const center = rotatedTerrains[0];
        const rest = rotatedTerrains.slice(1);
        for (let i = 0; i < this.rotation; i++) {
            // Déplacer le dernier élément au début
            rest.unshift(rest.pop());
        }
        // Reconstruire le tableau avec le centre suivi des éléments pivotés
        rotatedTerrains[0] = center;
        for (let i = 0; i < rest.length; i++) {
            rotatedTerrains[i + 1] = rest[i];
        }

        console.log('addTerrain 2', this);
        // Créer un terrain pour chaque élément du tableau
        const newTerrains = rotatedTerrains.map((zone, index) => {
            // Calculer la position modifiée
            const modifiedPosition = {
                q: this.position.q + positionModifiers[index].q,
                r: this.position.r + positionModifiers[index].r
            };
            console.log('addTerrain 3', this);
            // Créer le terrain
            return new Terrain({
                type: zone,
                position_q: modifiedPosition.q,
                position_r: modifiedPosition.r
            });
        });

        console.log('addTerrain 4', this);
        // Ajouter les nouveaux terrains à game.terrains
        if (!gameState.game.terrains) {
            gameState.game.terrains = [];
        }
        gameState.game.terrains.push(...newTerrains);
        console.log('addTerrain 5', this);

        // Vérifier si toutes les tiles ont maintenant des terrains
        const tilesWithNameAndPosition = gameState.game.tiles.filter(tile => 
            tile.name && tile.position && tile.position.q !== null
        );
        
        // Si toutes les tiles ont un nom et une position, créer les lacs
        if (tilesWithNameAndPosition.length === gameState.game.tiles.length) {
            console.log('Toutes les tiles ont des terrains, création des lacs...');
            gameState.game.createLakes();
        }
    }
}

class Action {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_user_id = data.game_user_id || null;
        this.action = data.action || '';
        this.turn = data.turn || 0;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.action = data.action || this.action;
        this.turn = data.turn || this.turn;
    }
}   

class Terrain {
    constructor(data = {}) {
        this.type = data.type || 'plain';
        this.position = {
            q: data.position_q ?? 0,
            r: data.position_r ?? 0
        };
        this.user_id = data.user_id || null;
        this.construction_type = data.construction_type || null;
        this.armee = data.armee || 0;  
    }
    // {q: +0, r: +0}, { q: +1, r: +0}, { q: +0, r: +1}, { q: -1, r: +1}, { q: -1, r: +0}, { q: +0, r: -1}, { q: +1, r: -1},

    update(data) {
        this.type = data.type || this.type;
        this.position_q = data.position_q || this.position_q;
        this.position_r = data.position_r || this.position_r;
        this.user_id = data.user_id || this.user_id;
        this.construction_type = data.construction_type || this.construction_type;
        this.armee = data.armee || this.armee;
    }
}

class Lake {
    constructor() {
        this.waterTiles = new Set();
        this.connectedTerritories = new Set();
        this.id = Math.random().toString(36).substr(2, 9);
    }
}

class Game {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_status = data.game_status || '';
        this.game_type = data.game_type || '';
        this.player_count = data.player_count || 0;
        
        // Relations
        this.game_users = data.game_users ? data.game_users.map(gu => new GameUser(gu)) : [];
        this.tiles = data.tiles ? data.tiles.map(tile => new Tile(tile)) : [];
        this.actions = data.actions ? data.actions.map(action => new Action(action)) : [];
        this.terrains = [];  // Initialiser comme un tableau video
        this.lakes = new Map(); // Map des lacs par ID
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_status = data.game_status || this.game_status;
        this.game_type = data.game_type || this.game_type;
        this.player_count = data.player_count || this.player_count;

        // Mise à jour des game_users
        if (data.game_users) {
            // Créer un map des game_users existants
            const existingUsers = new Map(this.game_users.map(gu => [gu.id, gu]));
            
            this.game_users = data.game_users.map(guData => {
                const existing = existingUsers.get(guData.id);
                if (existing) {
                    existing.update(guData);
                    return existing;
                } else {
                    return new GameUser(guData);
                }
            });
        }

        // Mise à jour des tiles
        if (data.tiles) {
            const existingTiles = new Map(this.tiles.map(tile => [tile.id, tile]));
            
            this.tiles = data.tiles.map(tileData => {
                const existing = existingTiles.get(tileData.id);
                if (existing) {
                    existing.update(tileData);
                    return existing;
                } else {
                    return new Tile(tileData);
                }
            });
        }

        // Mise à jour des actions
        if (data.actions) {
            const existingActions = new Map(this.actions.map(action => [action.id, action]));
            
            this.actions = data.actions.map(actionData => {
                const existing = existingActions.get(actionData.id);
                if (existing) {
                    existing.update(actionData);
                    return existing;
                } else {
                    return new Action(actionData);
                }
            });
        }
    }

    getAdjacentTiles(tile) {
        const adjacentPositions = [
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        return adjacentPositions.map(pos => {
            const q = tile.position.q + pos.q;
            const r = tile.position.r + pos.r;
            return this.terrains.find(t => 
                t.position.q === q && t.position.r === r
            );
        }).filter(t => t !== undefined);
    }

    areTilesAdjacent(tile1, tile2) {
        const adjacentTiles = this.getAdjacentTiles(tile1);
        return adjacentTiles.some(tile => 
            tile.position.q === tile2.position.q && 
            tile.position.r === tile2.position.r
        );
    }

    createLakes() {
        // Réinitialiser les lacs
        this.lakes.clear();

        // Parcourir tous les terrains d'eau
        const waterTiles = this.terrains.filter(t => t.type === 'water');
        
        for (const waterTile of waterTiles) {
            // Trouver les lacs adjacents
            const adjacentLakes = new Set();
            const adjacentTiles = this.getAdjacentTiles(waterTile);
            
            for (const adjacentTile of adjacentTiles) {
                if (adjacentTile.type === 'water') {
                    for (const [lakeId, lake] of this.lakes) {
                        if (lake.waterTiles.has(adjacentTile)) {
                            adjacentLakes.add(lake);
                        }
                    }
                }
            }

            // Cas 1: Pas de lac adjacent -> créer un nouveau lac
            if (adjacentLakes.size === 0) {
                const newLake = new Lake();
                newLake.waterTiles.add(waterTile);
                this.lakes.set(newLake.id, newLake);
            }
            // Cas 2: Un seul lac adjacent -> ajouter à ce lac
            else if (adjacentLakes.size === 1) {
                const lake = Array.from(adjacentLakes)[0];
                lake.waterTiles.add(waterTile);
            }
            // Cas 3: Plusieurs lacs adjacents -> fusionner les lacs
            else {
                const lakes = Array.from(adjacentLakes);
                const mainLake = lakes[0];
                
                // Fusionner tous les autres lacs dans le premier
                for (let i = 1; i < lakes.length; i++) {
                    const lakeToMerge = lakes[i];
                    for (const tile of lakeToMerge.waterTiles) {
                        mainLake.waterTiles.add(tile);
                    }
                    this.lakes.delete(lakeToMerge.id);
                }
                
                mainLake.waterTiles.add(waterTile);
            }
        }

        // Trouver les territoires connectés à chaque lac
        for (const lake of this.lakes.values()) {
            for (const waterTile of lake.waterTiles) {
                const adjacentTiles = this.getAdjacentTiles(waterTile);
                for (const adjacentTile of adjacentTiles) {
                    if (adjacentTile.type !== 'water') {
                        lake.connectedTerritories.add(adjacentTile);
                    }
                }
            }
        }
    }
}

class GameState {
    constructor(data = {}) {
        this.game = data.game ? new Game(data.game) : new Game();
        this.myGameUserId = data.my_game_user_id || null;
    }

    update(data) {
        if (data.game) {
            this.game.update(data.game);
        }
        if (data.my_game_user_id !== undefined) {
            this.myGameUserId = data.my_game_user_id;
        }
    }

    // Méthode utilitaire pour obtenir mon GameUser
    getMyGameUser() {
        return this.game.game_users.find(gu => gu.id === this.myGameUserId);
    }

    // Méthode pour vérifier si on est en phase d'installation
    isInstallationPhase() {
        return this.game.game_status === 'installation_phase';
    }

    // Méthode pour vérifier si on est en jeu simultané
    isSimultaneousPlay() {
        return this.game.game_status === 'simultaneous_play';
    }
}

// Instance globale du gameState (vide au départ)
export const gameState = new GameState();


