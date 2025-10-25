class Action < ApplicationRecord
  belongs_to :game_user
  belongs_to :game


  
  # validates :action, uniqueness: { scope: [:game_user_id, :turn] }
  # on ne peux pas le faire car j'ai utilise le mot action pour une table, je n'aurai pas du, mais trop long a changer
  # add_index :actions, [:game_user_id, :turn, :action], unique: true ,suffit

  

  scope :for_game, ->(game_id) { where(game_id: game_id) }
  scope :for_turn, ->(turn) { where(turn: turn) }
  scope :ordered, -> { order(:turn, :created_at) }
  

  def self.force_end_turn (game,simultaneous_play_turn)
    actions = Action.where(game_id: game.id, turn: simultaneous_play_turn)
    if actions.count < game.player_count
      user_played_games = actions.map(&:game_user_id)
      all_game_users = game.game_users.pluck(:id)
      not_played_game_users = all_game_users - user_played_games
      not_played_game_users.each do |game_user_id|
        Action.create(game_id: game.id, game_user_id: game_user_id, turn: simultaneous_play_turn, development_level: 0, fortification_level: 0, militarisation_level: 0)
      end
      Game.transaction do
        game.lock!
        if game.simultaneous_play_turn == simultaneous_play_turn
          game.update!(simultaneous_play_turn: simultaneous_play_turn + 1)
        end
      end
      return "some players did not play this turn"
    else
      return "all players played this turn"
    end
  end
end 