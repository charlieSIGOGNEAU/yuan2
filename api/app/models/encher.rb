class Encher < ApplicationRecord
  belongs_to :game
  belongs_to :game_user

  validates :turn, presence: true, numericality: { only_integer: true }
  validates :chao, presence: true, numericality: { only_integer: true }

end 