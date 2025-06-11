class Action < ApplicationRecord
  belongs_to :game_user
  belongs_to :game
  

  scope :for_game, ->(game_id) { where(game_id: game_id) }
  scope :for_turn, ->(turn) { where(turn: turn) }
  scope :ordered, -> { order(:turn, :created_at) }
  
end 