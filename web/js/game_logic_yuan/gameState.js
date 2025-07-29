// Classes pour les modèles backend
import { TILE_CONFIGS } from './pieces/TileTypes.js';
import { meepleManager } from './pieces/MeepleManager.js';
import { ALL_CLANS } from './pieces/clanColors.js';



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
        this.available_chao = 6;
        
        // Convertir le code hexadécimal en nom de couleur
        this.color_name = this.getColorName(this.color);
    }

    // Méthode pour convertir le code hexadécimal en nom de couleur
    getColorName(hexColor) {
        if (!hexColor) return '';
        
        // Chercher dans la liste des clans pour trouver la correspondance
        const matchingClan = ALL_CLANS.find(clan => clan.color_hex === hexColor);
        return matchingClan ? matchingClan.color_name : hexColor;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_id = data.game_id || this.game_id;
        this.color = data.color || this.color;
        this.name = data.name || this.name;
        this.start_q = data.start_q || this.start_q;
        this.start_r = data.start_r || this.start_r;
        
        // Mettre à jour color_name si la couleur a changé
        if (data.color && data.color !== this.color) {
            this.color_name = this.getColorName(data.color);
        }
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
        this.game_id = data.game_id || null;
        this.turn = data.turn || 0;
        this.position_q = data.position_q || null;
        this.position_r = data.position_r || null;
        this.developpement_level = data.developpement_level || 0;
        this.fortification_level = data.fortification_level || 0;
        this.militarisation_level = data.militarisation_level || 0;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.game_id = data.game_id || this.game_id;
        this.turn = data.turn || this.turn;
        this.position_q = data.position_q !== undefined ? data.position_q : this.position_q;
        this.position_r = data.position_r !== undefined ? data.position_r : this.position_r;
        this.developpement_level = data.developpement_level !== undefined ? data.developpement_level : this.developpement_level;
        this.fortification_level = data.fortification_level !== undefined ? data.fortification_level : this.fortification_level;
        this.militarisation_level = data.militarisation_level !== undefined ? data.militarisation_level : this.militarisation_level;
    }
}   

class Bidding {
    constructor(data = {}) {
        this.id = data.id || null;
        this.game_id = data.game_id || null;
        this.game_user_id = data.game_user_id || null;
        this.turn = data.turn || 0;
        this.chao = data.chao || 0;
        this.victory = data.victory || false;
        this.clan_id = data.clan_id || null;
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_id = data.game_id || this.game_id;
        this.game_user_id = data.game_user_id || this.game_user_id;
        this.turn = data.turn || this.turn;
        this.chao = data.chao || this.chao;
        this.victory = data.victory ?? this.victory;
        this.clan_id = data.clan_id || this.clan_id;
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
        this.clan_id = data.clan_id || null; // Référence au clan au lieu de color
        this.hasTemple = false; // Variable booléenne pour indiquer si un temple est présent
        
        // Cache pour les territoires adjacents
        this.adjacentTerritories = null;
        
        // Références aux mesh 3D
        this.construction_mesh = null; // Mesh de la construction (village, ville, 2villes)
        this.rempart_mesh = null; // Mesh du rempart (fortifiee, indestruible)
        this.temple_mesh = null; // Mesh du temple
        
        // Créer un temple directement si le territoire est de type 'plain'
        setTimeout(() => {
            if (this.type === 'plain') {
                this.createTemple(gameBoard, gameBoard.meepleManager);
            }
        }, 1000); // Délai pour s'assurer que gameBoard est disponible
        
    }

    update(data) {
        this.type = data.type || this.type;
        this.position_q = data.position_q || this.position_q;
        this.position_r = data.position_r || this.position_r;
        this.user_id = data.user_id || this.user_id;
        this.construction_type = data.construction_type || this.construction_type;
        this.rempart = data.protection_type || this.protection_type;
        this.clan_id = data.clan_id || this.clan_id;
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
    async createConstruction(gameBoard, meepleManager) {
        if (!this.construction_type || this.construction_mesh) {
            return; // Pas de construction à créer ou déjà créé
        }

        // Récupérer la couleur via la référence au clan
        let colorHex = null;
        if (this.clan_id) {
            const clan = gameState.game.clans.find(c => c.id === this.clan_id);
            if (clan) {
                colorHex = clan.color;
                console.log(`🏗️ Création de ${this.construction_type} (${clan.name} - ${colorHex}) sur territoire (${this.position.q}, ${this.position.r})`);
            } else {
                console.warn(`⚠️ Clan non trouvé pour clan_id=${this.clan_id}`);
            }
        } else {
            console.log(`🏗️ Création de ${this.construction_type} (sans couleur) sur territoire (${this.position.q}, ${this.position.r})`);
        }
        
        // Créer l'instance du meeple (version asynchrone)
        const mesh = await meepleManager.createMeepleInstance(this.construction_type, colorHex, {
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
    async createRempart(gameBoard, meepleManager) {
        if (!this.rempart || this.rempart_mesh) {
            return; // Pas de rempart à créer ou déjà créé
        }

        console.log(`🛡️ Création de ${this.rempart} sur territoire (${this.position.q}, ${this.position.r})`);
        
        // Utiliser le type 'fortification' du MeepleManager (non colorable)
        const mesh = await meepleManager.createMeepleInstance('fortification', null, {
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

    // Créer la mesh de temple
    async createTemple(gameBoard, meepleManager) {
        if (this.hasTemple && this.temple_mesh) {
            return; // Temple déjà créé
        }        
        // Utiliser le type 'temple' du MeepleManager (non colorable)
        const mesh = await meepleManager.createMeepleInstance('temple', null, {
            territory: this,
            type: 'temple'
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
            this.temple_mesh = mesh;
            this.hasTemple = true;
            
        }
    }

    // Créer les mesh de guerriers
    async createWarriors(gameBoard, meepleManager, count) {
        if (!this.clan_id || count <= 0) {
            return; // Pas de guerriers à créer
        }

        // Récupérer la couleur via la référence au clan
        const clan = gameState.game.clans.find(c => c.id === this.clan_id);
        if (!clan) {
            console.warn(`⚠️ Clan non trouvé pour clan_id=${this.clan_id}`);
            return;
        }

        console.log(`⚔️ Création de ${count} guerriers (${clan.name} - ${clan.color}) sur territoire (${this.position.q}, ${this.position.r})`);
        
        // Supprimer les anciens guerriers d'abord
        this.removeWarriors(gameBoard);
        
        // Obtenir les positions pour les guerriers
        const positions = this.getWarriorPositions(count);
        
        for (let i = 0; i < count; i++) {
            const mesh = await meepleManager.createMeepleInstance('guerrier', clan.color, {
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

    async updateMeshes(gameBoard, meepleManager) {
        console.log(`🔄 Mise à jour des mesh pour territoire (${this.position.q}, ${this.position.r})`);
        
        // Créer/mettre à jour la construction
        if (this.construction_type && !this.construction_mesh) {
            await this.createConstruction(gameBoard, meepleManager);
        } else if (!this.construction_type && this.construction_mesh) {
            this.removeConstruction(gameBoard);
        }
        
        // Créer/mettre à jour le rempart
        if (this.rempart && !this.rempart_mesh) {
            await this.createRempart(gameBoard, meepleManager);
        } else if (!this.rempart && this.rempart_mesh) {
            this.removeRempart(gameBoard);
        }
        
        // Note: Pour les guerriers, utiliser createWarriors() avec le count désiré
        // car elle gère automatiquement la suppression/recréation
    }

    getAdjacentTerritories() {
        if (this.adjacentTerritories !== null) {
            return this.adjacentTerritories;
        }

        const adjacentPositions = [
            { q: +1, r: +0 },  // Droite
            { q: +0, r: +1 },  // Haut droite
            { q: -1, r: +1 },  // Haut gauche
            { q: -1, r: +0 },  // Gauche
            { q: +0, r: -1 },  // Bas gauche
            { q: +1, r: -1 }   // Bas droite
        ];

        const adjacentTerritories = adjacentPositions.map(pos => {
            const q = this.position.q + pos.q;
            const r = this.position.r + pos.r;
            return gameState.game.territories.find(t => 
                t.position.q === q && t.position.r === r
            );
        }).filter(t => t !== undefined);

        // Stocker le cache seulement si simultaneous_play_turn > 0
        if (gameState.game.simultaneous_play_turn > 0) {
            this.adjacentTerritories = adjacentTerritories;
        }

        return adjacentTerritories;
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
        this.biddings_turn = data.biddings_turn || 0;
        this.simultaneous_play_turn = data.simultaneous_play_turn || 0;
        this.processedTurns = 0;
        
        // Relations
        this.game_users = data.game_users ? data.game_users.map(gu => new GameUser(gu)) : [];
        this.tiles = data.tiles ? data.tiles.map(tile => new Tile(tile)) : [];
        this.actions = data.actions ? data.actions.map(action => new Action(action)) : [];
        this.biddings = data.biddings ? data.biddings.map(bidding => new Bidding(bidding)) : [];
        this.clans = data.clans ? data.clans.map(clan => new Clan(clan)) : [];
        this.territories = [];  // Initialiser comme un tableau vide
        this.lakes = new Map(); // Map des lacs par ID
        
        // Clan du joueur actuel
        this.myClan = null;
        
        // Variable temporaire pour le chao du joueur
        this.myChaoTemp = 0;
    }

    // Fonction pour récupérer le clan du joueur actuel
    setMyClanFromVictoryBidding(myGameUserId) {
        // Chercher le bidding victorieux du joueur actuel
        const victoryBidding = this.biddings.find(bidding => 
            bidding.game_user_id === myGameUserId && bidding.victory === true
        );
        
        if (!victoryBidding) {
            console.warn(`⚠️ Aucun bidding victorieux trouvé pour game_user_id=${myGameUserId}`);
            return;
        }
        
        // Récupérer le clan correspondant
        const clan = this.clans.find(clan => clan.id === victoryBidding.clan_id);
        
        if (!clan) {
            console.warn(`⚠️ Clan non trouvé pour clan_id=${victoryBidding.clan_id}`);
            return;
        }
        
        // Stocker le clan du joueur actuel
        this.myClan = clan;
        console.log(`🎯 Clan du joueur actuel défini: ${clan.name} (${clan.color}) - available_chao: ${clan.available_chao}`);
    }

    update(data) {
        this.id = data.id || this.id;
        this.game_status = data.game_status || this.game_status;
        this.game_type = data.game_type || this.game_type;
        this.player_count = data.player_count || this.player_count;
        this.clan_names = data.clan_names || this.clan_names;
        this.biddings_turn = data.biddings_turn || this.biddings_turn;
        this.simultaneous_play_turn = data.simultaneous_play_turn || this.simultaneous_play_turn;

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

        // Mise à jour des biddings
        if (data.biddings) {
            const existingBiddings = new Map(this.biddings.map(bidding => [bidding.id, bidding]));
            
            this.biddings = data.biddings.map(biddingData => {
                const existing = existingBiddings.get(biddingData.id);
                if (existing) {
                    existing.update(biddingData);
                    return existing;
                } else {
                    return new Bidding(biddingData);
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
        
        // Si un gameBoard est fourni, le stocker globalement
        if (data.gameBoard) {
            window.gameBoard = data.gameBoard;
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


