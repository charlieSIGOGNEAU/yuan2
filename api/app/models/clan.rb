class Clan < ApplicationRecord
  belongs_to :game
  has_many :game_users, dependent: :destroy
  has_many :users, through: :game_users

  validates :color, presence: true
  validates :name, presence: true
  validates :start_q, presence: true, numericality: { only_integer: true }
  validates :start_r, presence: true, numericality: { only_integer: true }
  validates :received_turn, numericality: { only_integer: true }, allow_nil: true
  validates :received_chao, numericality: { only_integer: true }, allow_nil: true
end 