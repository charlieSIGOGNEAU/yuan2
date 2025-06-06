class GameBroadcast
    # def self.send_game_message(game_id, message)
    #     ActionCable.server.broadcast "game_#{game_id}", message
    # end

    # def self.send_user_message(user_id, message)
    #     ActionCable.server.broadcast "user_#{user_id}", message
    # end


    def self.game_broadcast_new_player(game_id, game_user_id)
        ActionCable.server.broadcast "game_#{game_id}", {
            type: 'new_player',
            game_user: GameUser.find(game_user_id).as_json
        }
    end

    def self.game_broadcast_game_details(game_id)
        ActionCable.server.broadcast "game_#{game_id}", {
            type: 'game_details',
            game: Game.find(game_id).as_json(include: { game_users: {} }),
        }
    end
    def self.user_broadcast_game_details(user_id, game_id, game_user_id)
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'game_details',
            game: Game.find(game_id).as_json(include: { game_users: {} }),
            me_game_user_id: game_user_id
        }
    end
    # def self.user_broadcast_me_game_user_id(user_id, game_user_id)
    #     ActionCable.server.broadcast "user_#{user_id}", {
    #         type: 'me_game_user_id',
    #         game_user_id: game_user_id
    #     }
    # end
end
