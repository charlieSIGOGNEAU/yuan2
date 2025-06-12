class GameBroadcast
    def self.game_broadcast_new_player(game_id, game_user_id)
        ActionCable.server.broadcast "game_#{game_id}", {
            type: 'new_player',
            game_user: GameUser.find(game_user_id).as_json
        }
    end

    def self.game_broadcast_game_details(game_id)
        ActionCable.server.broadcast "game_#{game_id}", {
            type: 'game_details',
            game: Game.find(game_id).as_json(include: { game_users: { except: [:game_id]} , tiles: { except: [:game_id]}, actions: { except: [:game_id]}}),
        }
    end
    def self.user_broadcast_game_details(user_id, game_id, game_user_id)
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'game_details',
            game: Game.find(game_id).as_json(include: { game_users: { except: [:game_id]} , tiles: { except: [:game_id]}, actions: { except: [:game_id]}}),
            my_game_user_id: game_user_id
        }
    end
    
end
