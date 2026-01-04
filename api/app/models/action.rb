class Action < ApplicationRecord
  belongs_to :game_user
  belongs_to :game


  scope :for_game, ->(game_id) { where(game_id: game_id) }
  scope :for_turn, ->(turn) { where(turn: turn) }
  scope :ordered, -> { order(:turn, :created_at) }
  
  def self.force_end_turn(game, turn_to_handle)
    result_status = nil
    Game.transaction do
      game.lock!
  
      if game.simultaneous_play_turn != turn_to_handle
        result_status = :already_ended
      else
        played_ids = game.actions.where(turn: turn_to_handle).pluck(:game_user_id)
        missing_users = game.game_users.where.not(id: played_ids).pluck(:id)
  
        missing_users.each do |user_id|
          Action.create!(
            game_id: game.id,
            game_user_id: user_id,
            turn: turn_to_handle,
            development_level: 0,
            fortification_level: 0,
            militarisation_level: 0
          )
        end
  
        game.increment!(:simultaneous_play_turn)
        result_status = :forced_success
      end
    end 
  
    result_status 
  end




  #   result = nil
  
  #   Game.transaction do
  #     game.lock!
  
  #     actions = Action.where(game_id: game.id, turn: simultaneous_play_turn)
  #     if actions.count < game.player_count
  #       user_played_games = actions.map(&:game_user_id)
  #       all_game_users = game.game_users.pluck(:id)
  #       not_played_game_users = all_game_users - user_played_games
  
  #       not_played_game_users.each do |game_user_id|
  #         Action.create!(
  #           game_id: game.id,
  #           game_user_id: game_user_id,
  #           turn: simultaneous_play_turn,
  #           development_level: 0,
  #           fortification_level: 0,
  #           militarisation_level: 0
  #         )
  #       end
  
  #       if game.simultaneous_play_turn == simultaneous_play_turn
  #         game.update!(simultaneous_play_turn: simultaneous_play_turn + 1)
  #         result = "some players did not play this turn"
  #       end
  #     else
  #       result = "all players played this turn"
  #     end
  #   end
  
  #   result
  # end

  def format_action_response()
    response = {
      id: id,
      game_user_id: game_user_id,
      game_id: game_id,
      turn: turn,
      position_q: position_q,
      position_r: position_r,
      development_level: development_level,
      fortification_level: fortification_level,
      militarisation_level: militarisation_level,
      created_at: created_at
    }
    
    # Ajouter updated_at seulement si différent de created_at
    response[:updated_at] = updated_at if updated_at != created_at
    
    response
  end



end 