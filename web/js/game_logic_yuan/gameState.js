// Classes pour les modèles backend
class User {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

class GameUser {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.faction = data.faction;
        this.user_name = data.user_name;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Si l'objet user est inclus
        this.user = data.user ? new User(data.user) : null;
    }
}

class Tile {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.position = data.position;
        this.rotation = data.rotation;
        this.game_user_id = data.game_user_id;
        this.turn = data.turn;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
}

class Action {
    constructor(data) {
        this.id = data.id;
        this.game_user_id = data.game_user_id;
        this.action = data.action;
        this.turn = data.turn;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }
    
    // Méthodes utilitaires pour parser l'action
    getActionType() {
        return this.action ? this.action.slice(0, 3) : null;
    }
    
    getParams() {
        if (!this.action) return [];
        return [
            parseInt(this.action[3]),
            parseInt(this.action[4]),
            parseInt(this.action[5])
        ];
    }
}

class Game {
    constructor(data) {
        this.id = data.id;
        this.game_status = data.game_status;
        this.game_type = data.game_type;
        this.player_count = data.player_count;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Relations
        this.game_users = data.game_users ? data.game_users.map(gu => new GameUser(gu)) : [];
        this.tiles = data.tiles ? data.tiles.map(tile => new Tile(tile)) : [];
        this.actions = data.actions ? data.actions.map(action => new Action(action)) : [];
    }
    
    // Méthodes utilitaires
    isWaitingForPlayers() {
        return this.game_status === 0;
    }
    
    isPlaying() {
        return this.game_status === 1;
    }
    
    isCompleted() {
        return this.game_status === 2;
    }
    
    getCurrentPlayerCount() {
        return this.game_users.length;
    }
    
    getGameUserById(gameUserId) {
        return this.game_users.find(gu => gu.id === gameUserId);
    }
    
    getTilesForGameUser(gameUserId) {
        return this.tiles.filter(tile => tile.game_user_id === gameUserId);
    }
    
    getActionsForTurn(turn) {
        return this.actions.filter(action => action.turn === turn);
    }
    
    getLastAction() {
        return this.actions.length > 0 ? this.actions[this.actions.length - 1] : null;
    }
}

// État global du jeu
const gameState = {
    // Données de la partie actuelle
    currentGame: null,
    myGameUserId: null,
    
    // État local du frontend
    turn: 0,
    localData: {
        tilesToPlay: null,
        playedTiles: [],
        playedTilesPosition: [],
        playedTilesRotation: []
    },
    
    // Méthodes pour gérer l'état
    setGameData(gameData, myGameUserId = null) {
        this.currentGame = new Game(gameData);
        this.myGameUserId = myGameUserId;
        this.turn = this.currentGame.getLastAction()?.turn || 0;
    },
    
    getMyGameUser() {
        return this.myGameUserId ? this.currentGame?.getGameUserById(this.myGameUserId) : null;
    },
    
    getMyTiles() {
        return this.myGameUserId ? this.currentGame?.getTilesForGameUser(this.myGameUserId) : [];
    },
    
    addAction(actionData) {
        if (this.currentGame) {
            this.currentGame.actions.push(new Action(actionData));
        }
    },
    
    updateGameFromBroadcast(gameData) {
        // Mise à jour depuis WebSocket
        this.setGameData(gameData, this.myGameUserId);
    },
    
    clear() {
        this.currentGame = null;
        this.myGameUserId = null;
        this.turn = 0;
        this.localData = {
            tilesToPlay: null,
            playedTiles: [],
            playedTilesPosition: [],
            playedTilesRotation: []
        };
    }
};

// Export pour utilisation dans d'autres fichiers
window.gameState = gameState;
window.Game = Game;
window.GameUser = GameUser;
window.Tile = Tile;
window.Action = Action;