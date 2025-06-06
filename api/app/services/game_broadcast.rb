class GameBroadcast
    def self.send_game_message(game_id, message)
        ActionCable.server.broadcast "game_#{game_id}", message
    end

    def self.send_user_message(user_id, message)
        ActionCable.server.broadcast "user_#{user_id}", message
    end
end
