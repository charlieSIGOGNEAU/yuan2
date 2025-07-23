class Bidding < ApplicationRecord
  # Associations
  belongs_to :game_user
  belongs_to :game
  belongs_to :clan, optional: true  # Ajouter la relation avec Clan
  
  # Validations
  validates :chao, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :turn, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true
  validates :game_user_id, presence: true
  validates :game_id, presence: true
  
  # Validation d'unicité : un seul bid par game_user par tour
  validates :game_user_id, uniqueness: { 
    scope: [:game_id, :turn], 
    message: "a déjà fait une enchère pour ce tour dans ce jeu" 
  }
  
  # Scopes utiles
  scope :for_turn, ->(turn) { where(turn: turn) }
  scope :for_game, ->(game_id) { where(game_id: game_id) }
  scope :for_game_user, ->(game_user_id) { where(game_user_id: game_user_id) }
  scope :ordered_by_chao, -> { order(chao: :desc) }
  scope :recent_first, -> { order(created_at: :desc) }
  scope :winners, -> { where(victory: true) }
  
  # Méthodes d'instance
  def user
    game_user.user
  end
  
  def user_name
    game_user.user_name
  end
  
  def is_winner?
    victory == true
  end
end 