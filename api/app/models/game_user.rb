class GameUser < ApplicationRecord
    belongs_to :user
    belongs_to :game
    belongs_to :clan, optional: true
    has_many :biddings, dependent: :destroy
  
    validates :user_name, presence: true
  
    before_validation :set_user_name, on: :create

    # a suprimer car on n'utilise plus game channel mais seulement user channel
    def unsubscribe_from_game(game_id)
      # Envoyer un message au client pour qu'il se désabonne du game channel
      GameBroadcast.user_broadcast_unsubscribe_from_game(user_id, game_id)
      puts "📡 Demande de désabonnement envoyée à l'utilisateur #{user_id} pour la game #{game_id}"
    end

    def confirmPlayerReady(game)
      # au cas ou une supression des game_user ait lieu au meme moment, car arrive exactement a la fin du timeout
      begin
        transaction do
          self.lock!
          self.player_ready = true
          self.save!
        end
      rescue ActiveRecord::RecordNotFound, ActiveRecord::StaleObjectError
        # le joueur a été supprimé ou concurrent modification
        return { message: "Player no longer exists or cannot be updated" }
      rescue => e
        # autre erreur inattendue
        return { message: "Error: #{e.message}" }
      end
    

      game_users_ready = game.game_users.where(player_ready: true)
      if game_users_ready.count == game.player_count
        game.game_status = "installation_phase"
        game.create_tiles_for_players()
        game.clan_names = game.the_clans(game.player_count)
        game.save
        return {message: "Game ready installation_phase"}
      else
        return {message: "Game not ready installation_phase"}
      end
    end
  
    private
  
    def set_user_name
      self.user_name = user.name if user
    end
  
  end 