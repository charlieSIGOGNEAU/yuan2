class GameUser < ApplicationRecord
    belongs_to :user
    belongs_to :game
    belongs_to :clan, optional: true
    has_many :biddings, dependent: :destroy
  
    validates :user_name, presence: true
  
    before_validation :set_user_name, on: :create

    def unsubscribe_from_game(game_id)
      # Envoyer un message au client pour qu'il se désabonne du game channel
      GameBroadcast.user_broadcast_unsubscribe_from_game(user_id, game_id)
      puts "📡 Demande de désabonnement envoyée à l'utilisateur #{user_id} pour la game #{game_id}"
    end
  
    private
  
    def set_user_name
      self.user_name = user.name if user
    end
  
  end 