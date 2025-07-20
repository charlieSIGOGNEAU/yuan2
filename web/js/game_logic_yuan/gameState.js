// Classes pour les modèles backend
import { TILE_CONFIGS } from './pieces/TileTypes.js';
import { meepleManager } from './pieces/MeepleManager.js';


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

class Clan {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_id = data.game_id || null;
        this.color = data.color || '';
        this.name = data.name || '';
        this.start_q = data.start_q || 0;
        this.start_r = data.start_r || 0;
        this.received_turn = data.received_turn ?? null;
        this.received_chao = data.received_chao ?? null;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_id = data.game_id || this.game_id;
        this.color = data.color || this.color;
        this.name = data.name || this.name;
        this.start_q = data.start_q || this.start_q;
        this.start_r = data.start_r || this.start_r;
        this.received_turn = data.received_turn ?? this.received_turn;
        this.received_chao = data.received_chao ?? this.received_chao;
    }
}

class GameUser {
    constructor(data = {}) {
        this.id = data.id || null;
        this.user_id = data.user_id || null;
        this.clan_id = data.clan_id || null;
        this.user_name = data.user_name || ''; 
    }

    update(data) {
        this.id = data.id || this.id;
        this.user_id = data.user_id || this.user_id;
        this.clan_id = data.clan_id || this.clan_id;
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
        this.terrainsCreated = false; // Flag pour savoir si les terrains ont été créés
        if (this.position && this.position.q !== null && this.name) {
            this.addTerrain();
        }
    }

    update(data) {
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
        if (this.position && this.position.q !== null && this.name && !this.terrainsCreated) {
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

        // Créer un terrain pour chaque élément du tableau
        const newTerrains = rotatedTerrains.map((zone, index) => {
            // Calculer la position modifiée
            const modifiedPosition = {
                q: this.position.q + positionModifiers[index].q,
                r: this.position.r + positionModifiers[index].r
            };
            // Créer le terrain
            return new Territory({
                type: zone,
                position_q: modifiedPosition.q,
                position_r: modifiedPosition.r
            });
        });

        // Ajouter les nouveaux terrains à game.territories
        if (!gameState.game.territories) {
            gameState.game.territories = [];
        }
        gameState.game.territories.push(...newTerrains);
        // Traiter chaque terrain water individuellement
        const newWaterTerrains = newTerrains.filter(t => t.type === 'water');
        for (const waterTerrain of newWaterTerrains) {
            Lake.createOrUpdateLake(waterTerrain);
            Lake.updateConnectedTerritories();

        }
        
        // Marquer que les terrains ont été créés pour cette tile
        this.terrainsCreated = true;
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

class Territory {
    constructor(data = {}) {
        this.type = data.type || 'plain';
        this.position = {
            q: data.position_q ?? 0,
            r: data.position_r ?? 0
        };
        this.user_id = data.user_id || null;
        this.construction_type = data.construction_type || null; // village, ville, 2villes
        this.rempart = data.protection_type || null; // fortifiee, indestruible
        this.warriors = []; // Tableau des mesh de guerriers (remplace armee)
        this.color = data.color || null; // Couleur du clan pour ce territoire
        
        // Références aux mesh 3D
        this.construction_mesh = null; // Mesh de la construction (village, ville, 2villes)
        this.rempart_mesh = null; // Mesh du rempart (fortifiee, indestruible)
    }

    update(data) {
        this.type = data.type || this.type;
        this.position_q = data.position_q || this.position_q;
        this.position_r = data.position_r || this.position_r;
        this.user_id = data.user_id || this.user_id;
        this.construction_type = data.construction_type || this.construction_type;
        this.rempart = data.protection_type || this.protection_type;
        this.color = data.color || this.color;
        // Note: warriors n'est pas mis à jour via data, il est géré par les méthodes
    }

    // Obtenir la position cartésienne de ce territoire
    getCartesianPosition(gameBoard) {
        return gameBoard.hexToCartesian(this.position);
    }

    // Positions décalées pour les guerriers (selon les spécifications)
    getWarriorPositions(count) {
        const basePos = this.position;
        const positions = [
            { q: basePos.q + 0.25, r: basePos.r - 0.35 }, // 1er warrior
            { q: basePos.q + 0.25, r: basePos.r + 0 },    // 2ème warrior  
            { q: basePos.q + 0,    r: basePos.r - 0.35 }, // 3ème warrior
            { q: basePos.q + 0,    r: basePos.r + 0.35 }, // 4ème warrior
            { q: basePos.q - 0.25, r: basePos.r + 0 }     // 5ème warrior
        ];
        return positions.slice(0, count);
    }

    // Créer la mesh de construction
    createConstruction(gameBoard, meepleManager) {
        if (!this.construction_type || !this.color || this.construction_mesh) {
            return; // Pas de construction à créer ou déjà créée
        }

        console.log(`🏗️ Création de ${this.construction_type} (${this.color}) sur territoire (${this.position.q}, ${this.position.r})`);
        
        // Créer l'instance du meeple
        const mesh = meepleManager.createMeepleInstance(this.construction_type, this.color, {
            territory: this,
            type: 'construction'
        });

        if (mesh) {
            // Positionner à la position exacte du territoire
            const pos = this.getCartesianPosition(gameBoard);
            mesh.position.set(pos.x, pos.y, pos.z);
            
            // Désactiver les collisions
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {};
                }
            });

            // Ajouter au workplane
            gameBoard.workplane.add(mesh);
            this.construction_mesh = mesh;
            
            console.log(`✅ Construction ${this.construction_type} créée à`, pos);
        }
    }

    // Créer la mesh de rempart
    createRempart(gameBoard, meepleManager) {
        if (!this.rempart || this.rempart_mesh) {
            return; // Pas de rempart à créer ou déjà créé
        }

        console.log(`🛡️ Création de ${this.rempart} sur territoire (${this.position.q}, ${this.position.r})`);
        
        // Utiliser le type 'fortification' du MeepleManager (non colorable)
        const mesh = meepleManager.createMeepleInstance('fortification', null, {
            territory: this,
            type: 'rempart',
            rempartType: this.rempart
        });

        if (mesh) {
            // Positionner à la position exacte du territoire
            const pos = this.getCartesianPosition(gameBoard);
            
            // Gérer les différences selon le type de rempart
            if (this.rempart === 'indestruible') {
                // Indestructible : rotation 180° et surélevé
                mesh.position.set(pos.x, pos.y + 0.02, pos.z);
                mesh.rotation.y = Math.PI; // 180 degrés
                console.log(`🔄 Rempart indestructible : rotation 180° et +0.02 en hauteur`);
            } else {
                // Fortifiée : position normale
                mesh.position.set(pos.x, pos.y, pos.z);
            }
            
            // Désactiver les collisions
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.raycast = function() {};
                }
            });

            // Ajouter au workplane
            gameBoard.workplane.add(mesh);
            this.rempart_mesh = mesh;
            
            console.log(`✅ Rempart ${this.rempart} créé à`, pos);
        }
    }

    // Créer les mesh de guerriers
    createWarriors(gameBoard, meepleManager, count) {
        if (!this.color || count <= 0) {
            return; // Pas de guerriers à créer
        }

        console.log(`⚔️ Création de ${count} guerriers (${this.color}) sur territoire (${this.position.q}, ${this.position.r})`);
        
        // Supprimer les anciens guerriers d'abord
        this.removeWarriors(gameBoard);
        
        // Obtenir les positions pour les guerriers
        const positions = this.getWarriorPositions(count);
        
        for (let i = 0; i < count; i++) {
            const mesh = meepleManager.createMeepleInstance('guerrier', this.color, {
                territory: this,
                type: 'warrior',
                index: i
            });

            if (mesh) {
                // Positionner selon le décalage défini
                const pos = gameBoard.hexToCartesian(positions[i]);
                mesh.position.set(pos.x, pos.y, pos.z);
                
                // Désactiver les collisions
                mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.raycast = function() {};
                    }
                });

                // Ajouter au workplane et stocker
                gameBoard.workplane.add(mesh);
                this.warriors.push(mesh);
                
                console.log(`✅ Guerrier ${i+1} créé à`, pos);
            }
        }
    }

    // Supprimer la construction
    removeConstruction(gameBoard) {
        if (this.construction_mesh) {
            console.log(`🗑️ Suppression de la construction sur territoire (${this.position.q}, ${this.position.r})`);
            gameBoard.workplane.remove(this.construction_mesh);
            this.construction_mesh = null;
        }
    }

    // Supprimer le rempart
    removeRempart(gameBoard) {
        if (this.rempart_mesh) {
            console.log(`🗑️ Suppression du rempart sur territoire (${this.position.q}, ${this.position.r})`);
            gameBoard.workplane.remove(this.rempart_mesh);
            this.rempart_mesh = null;
        }
    }

    // Supprimer tous les guerriers
    removeWarriors(gameBoard) {
        if (this.warriors.length > 0) {
            console.log(`🗑️ Suppression de ${this.warriors.length} guerriers sur territoire (${this.position.q}, ${this.position.r})`);
            this.warriors.forEach(warrior => {
                gameBoard.workplane.remove(warrior);
            });
            this.warriors = [];
        }
    }

    // Supprimer toutes les mesh de ce territoire
    removeAllMeshes(gameBoard) {
        this.removeConstruction(gameBoard);
        this.removeRempart(gameBoard);
        this.removeWarriors(gameBoard);
        console.log(`🧹 Toutes les mesh supprimées du territoire (${this.position.q}, ${this.position.r})`);
    }

    // Mettre à jour les mesh selon les données actuelles
    updateMeshes(gameBoard, meepleManager) {
        console.log(`🔄 Mise à jour des mesh pour territoire (${this.position.q}, ${this.position.r})`);
        
        // Créer/mettre à jour la construction
        if (this.construction_type && !this.construction_mesh) {
            this.createConstruction(gameBoard, meepleManager);
        } else if (!this.construction_type && this.construction_mesh) {
            this.removeConstruction(gameBoard);
        }
        
        // Créer/mettre à jour le rempart
        if (this.rempart && !this.rempart_mesh) {
            this.createRempart(gameBoard, meepleManager);
        } else if (!this.rempart && this.rempart_mesh) {
            this.removeRempart(gameBoard);
        }
        
        // Note: Pour les guerriers, utiliser createWarriors() avec le count désiré
        // car elle gère automatiquement la suppression/recréation
    }

    getAdjacentTerritories() {
        const adjacentPositions = [
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        return adjacentPositions.map(pos => {
            const q = this.position.q + pos.q;
            const r = this.position.r + pos.r;
            return gameState.game.territories.find(t => 
                t.position.q === q && t.position.r === r
            );
        }).filter(t => t !== undefined);
    }

    areTerritoryAdjacent(territory2) {
        const adjacentTerritories = this.getAdjacentTerritories();
        return adjacentTerritories.some(territory => 
            territory.position.q === territory2.position.q && 
            territory.position.r === territory2.position.r
        );
    }
}

class Lake {
    constructor() {
        this.waterTiles = new Set();
        this.connectedTerritories = new Set();
        this.id = Math.random().toString(36).substr(2, 9);
    }

    static createOrUpdateLake(waterTerrain) {
        // Trouver les terrains water adjacents qui sont déjà dans des lacs
        const adjacentWaterTerrains = waterTerrain.getAdjacentTerritories().filter(t => t.type === 'water');
        const adjacentLakes = new Set();
        
        // Pour chaque terrain water adjacent, trouver son lac
        for (const adjacentWater of adjacentWaterTerrains) {
            for (const lake of gameState.game.lakes.values()) {
                if (lake.waterTiles.has(adjacentWater)) {
                    adjacentLakes.add(lake);
                    break;
                }
            }
        }

        // Cas 1: Pas de lac adjacent -> créer un nouveau lac
        if (adjacentLakes.size === 0) {
            const newLake = new Lake();
            newLake.waterTiles.add(waterTerrain);
            gameState.game.lakes.set(newLake.id, newLake);
        }
        // Cas 2: Un seul lac adjacent -> ajouter à ce lac
        else if (adjacentLakes.size === 1) {
            const lake = Array.from(adjacentLakes)[0];
            lake.waterTiles.add(waterTerrain);
        }
        // Cas 3: Plusieurs lacs adjacents -> fusionner les lacs
        else {
            const lakes = Array.from(adjacentLakes);
            const mainLake = lakes[0];
            
            
            // Ajouter le nouveau terrain au lac principal
            mainLake.waterTiles.add(waterTerrain);
            
            // Fusionner tous les autres lacs dans le premier
            for (let i = 1; i < lakes.length; i++) {
                const lakeToMerge = lakes[i];
                for (const tile of lakeToMerge.waterTiles) {
                    mainLake.waterTiles.add(tile);
                }
                gameState.game.lakes.delete(lakeToMerge.id);
            }
        }
    }

    static updateConnectedTerritories() {
        // Parcourir tous les lacs
        for (const lake of gameState.game.lakes.values()) {
            // Réinitialiser les territoires connectés
            lake.connectedTerritories.clear();
            
            // Pour chaque terrain d'eau du lac
            for (const waterTerrain of lake.waterTiles) {
                // Trouver les terrains adjacents qui ne sont pas de l'eau
                const adjacentTerrains = waterTerrain.getAdjacentTerritories();
                for (const adjacentTerrain of adjacentTerrains) {
                    if (adjacentTerrain.type !== 'water') {
                        lake.connectedTerritories.add(adjacentTerrain);
                    }
                }
            }
        }
    }
}

class Game {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_status = data.game_status || '';
        this.game_type = data.game_type || '';
        this.player_count = data.player_count || 0;
        this.clan_names = data.clan_names || '';
        
        // Relations
        this.game_users = data.game_users ? data.game_users.map(gu => new GameUser(gu)) : [];
        this.tiles = data.tiles ? data.tiles.map(tile => new Tile(tile)) : [];
        this.actions = data.actions ? data.actions.map(action => new Action(action)) : [];
        this.clans = data.clans ? data.clans.map(clan => new Clan(clan)) : [];
        this.territories = [];  // Initialiser comme un tableau vide
        this.lakes = new Map(); // Map des lacs par ID
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_status = data.game_status || this.game_status;
        this.game_type = data.game_type || this.game_type;
        this.player_count = data.player_count || this.player_count;
        this.clan_names = data.clan_names || this.clan_names;

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

        // Mise à jour des clans
        if (data.clans) {
            const existingClans = new Map(this.clans.map(clan => [clan.id, clan]));
            
            this.clans = data.clans.map(clanData => {
                const existing = existingClans.get(clanData.id);
                if (existing) {
                    existing.update(clanData);
                    return existing;
                } else {
                    return new Clan(clanData);
                }
            });
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
    
    isnotwaiting_for_players() {
        return this.game.game_status !== 'waiting_for_players';
    }

    // Méthode pour vérifier si on est en jeu simultané
    isSimultaneousPlay() {
        return this.game.game_status === 'simultaneous_play';
    }

    // Méthode pour vérifier si on est le joueur avec l'ID le plus bas
    isLowestIdPlayer() {
        if (!this.myGameUserId || this.game.game_users.length === 0) {
            return false;
        }
        
        const lowestId = Math.min(...this.game.game_users.map(gu => gu.id));
        return this.myGameUserId === lowestId;
    }
}

// Instance globale du gameState (vide au départ)
export const gameState = new GameState();

// Rendre gameState accessible globalement pour les fonctions utilitaires
window.gameState = gameState;


