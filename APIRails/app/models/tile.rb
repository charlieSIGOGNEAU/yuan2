class Tile < ApplicationRecord
    belongs_to :game_user
    belongs_to :game
  end 
  