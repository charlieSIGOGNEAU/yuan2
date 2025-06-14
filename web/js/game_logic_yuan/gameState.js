// Classes pour les modèles backend
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
            q: data.position_q ?? 0,
            r: data.position_r ?? 0
        };
        this.rotation = data.rotation || 0;
        this.game_user_id = data.game_user_id || null;
        this.turn = data.turn || 0;
        this.sprite = null;
        this.terrain = null;
        this.addTerrain();
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
        this.addTerrain();
    }

    addTerrain() {
        if (!this.name) {
            // Logique pour ajouter le terrain
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
        this.position_q = data.position_q || 0;
        this.position_r = data.position_r || 0;
        this.user_id = data.user_id || null;
        this.construction_type = data.construction_type || null;
        this.armee = data.armee || 0;  
    }

    update(data) {
        this.type = data.type || this.type;
        this.position_q = data.position_q || this.position_q;
        this.position_r = data.position_r || this.position_r;
        this.user_id = data.user_id || this.user_id;
        this.construction_type = data.construction_type || this.construction_type;
        this.armee = data.armee || this.armee;
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


