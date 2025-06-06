class Game < ApplicationRecord
    enum :game_status, {
      waiting_for_players: 0,
      simultaneous_play: 1,
      completed: 2,
      abandoned: 3
    }, default: :waiting_for_players
  
    enum :game_type, {
      quick_game: 0,
      custom_game: 1
    }, default: :quick_game
  
    has_many :game_users, dependent: :destroy
    has_many :users, through: :game_users
    has_many :tiles, dependent: :destroy
  
    validates :game_status, presence: true
    validates :game_type, presence: true
    validates :player_count, presence: true, numericality: { only_integer: true}
  
    def self.find_or_create_waiting_game(user)
      existing_game_for_user = Game.joins(:game_users)
                                    .where(game_users: { user_id: user.id })
                                    .where.not(game_status: [:completed, :abandoned])
                                    .first
      if existing_game_for_user
        game_user = existing_game_for_user.game_users.find_by(user_id: user.id)
        return {game: existing_game_for_user, game_user: game_user, message: "ongoing game"}
      end
      
      waiting_game = where(game_status: :waiting_for_players, game_type: :quick_game).first
  
      if waiting_game
        # Si on ne peut pas rejoindre la partie, on cherche une autre partie
        game_user = waiting_game.add_player(user)
        if game_user
          if waiting_game.simultaneous_play?
            return { game: waiting_game, game_user: game_user, message: "game ready simultaneous_play" }
          else
            return { game: waiting_game, game_user: game_user, message: "waiting for players" }
          end
        else
          # si on n'est pas arriver a s'ajouter a la partie car on etait plusieur en meme temps, on cherche une autre partie
          find_or_create_waiting_game(user)
        end
      else
        game = create(
          player_count: 3,
          game_status: :waiting_for_players,
          game_type: :quick_game
        )
        game_user = game.add_player(user)
        return {game: game, game_user: game_user, message: "new game"}
      end
    end
  
    def add_player(user)
      transaction do
        reload.lock!
        return false unless can_add_player?
        game_user = game_users.create(user: user)
        return false unless game_user.persisted?
        initialize_game if game_users.count == player_count
        game_user
      end
    end
  
    private
  
    def can_add_player?
      waiting_for_players? && game_users.count < player_count
    end
  
  
    def initialize_game
      Rails.logger.info "Initialisation de la partie #{id}"
      create_tiles
      update(game_status: :simultaneous_play)
    rescue => e
      Rails.logger.error "ERROR during game initialization for game #{id}: #{e.message}"
      raise
    end
  
    def create_tiles
      tile_count = calculate_tile_count
      return unless tile_count
  
      Rails.logger.info "Création de #{tile_count} tuiles pour la partie #{id}"
      success = create_tiles_for_players(tile_count)
      Rails.logger.info "Création des tuiles #{success ? 'réussie' : 'échouée'}"
      Rails.logger.info "Nombre de tuiles créées : #{tiles.count}"
    end
  
    def calculate_tile_count
      case player_count
      when 2 then 8
      when 3 then 12
      when 4 then 15
      end
    end
  
    def create_tiles_for_players(tile_count)
      game_users_list = game_users.to_a
      Rails.logger.info "Liste des game_users : #{game_users_list.map(&:id)}"
      
      tile_count.times do |i|
        game_user = game_users_list[i % player_count]
        Rails.logger.info "Création de la tuile #{i} pour le game_user #{game_user.id}"
        
        tile = tiles.create(
          game_user_id: game_user.id,
          turn: i
        )
        
        unless tile.persisted?
          Rails.logger.error "Échec de la création de la tuile #{i} : #{tile.errors.full_messages}"
          return false
        end
      end
      true
    end
  end 