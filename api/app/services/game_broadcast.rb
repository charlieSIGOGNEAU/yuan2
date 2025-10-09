class GameBroadcast
    def self.game_broadcast_new_player(game_user_id, game_id)
        game = Game.find(game_id)
        gameUsers = game.game_users.where.not(id: game_user_id)
        gameUsers.each do |gameUser|
            ActionCable.server.broadcast "user_#{gameUser.user_id}", {
                type: 'new_player',
                game_user: gameUser.as_json
            }
        end
    end





    def self.game_broadcast_game_details(game_id)
        game = Game.find(game_id)
        gameUsers = game.game_users
        gameUsers.each do |gameUser|
            ActionCable.server.broadcast "user_#{gameUser.user_id}", {
                type: 'game_details',
                game: game.as_json(include: { game_users: { except: [:game_id]} , tiles: { except: [:game_id]}, actions: { except: [:game_id]}, clans: { except: [:game_id]}, biddings: { except: [:game_id]}}),
                my_game_user_id: gameUser.id
            }
        end
    end


    # comme game_broadcast_game_details mais pour un seul joueur
    def self.user_broadcast_game_details(user_id, game_id, game_user_id)
        # Charger proprement le game avec toutes ses associations
        game = Game.includes(:game_users, :tiles, :actions, :clans, :biddings).find(game_id)
        
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'game_details',
            game: game.as_json(include: { game_users: { except: [:game_id]} , tiles: { except: [:game_id]}, actions: { except: [:game_id]}, clans: { except: [:game_id]}, biddings: { except: [:game_id]}}),
            my_game_user_id: game_user_id
        }
    end
    
    def self.user_broadcast_waiting_for_others(user_id, game_id)
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'waiting_for_other_players',
            game_id: game_id,
            message: 'En attente des autres joueurs...'
        }
    end

    def self.user_broadcast_player_abandoned(game_id, game_user_id)
        game = Game.find(game_id)
        gameUsers = game.game_users.where.not(id: game_user_id)
        gameUsers.each do |gameUser|
            ActionCable.server.broadcast "user_#{gameUser.user_id}", {
                type: 'player_abandoned',
                game_user_id: game_user_id
            }
        end
    end




    def self.user_broadcast_unsubscribe_from_game(user_id, game_id)
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'unsubscribe_from_game',
            game_id: game_id,
            message: 'Vous avez quitté cette partie'
        }
    end

    def self.user_broadcast_game_won(user_id, game_id, game_user_id)
        ActionCable.server.broadcast "user_#{user_id}", {
            type: 'game_won',
            game_id: game_id,
            game_user_id: game_user_id,
            message: 'Félicitations ! Vous avez gagné la partie par abandon des autres joueurs'
        }
    end
end
