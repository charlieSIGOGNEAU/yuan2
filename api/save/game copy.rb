class Game < ApplicationRecord
    enum :game_status, {
      waiting_for_players: 0,
      installation_phase: 1,
      initial_placement: 2,
      bidding_phase: 3,
      starting_spot_selection: 4,
      simultaneous_play: 5,
      completed: 6,
      abandoned: 7,
      end_dispute: 8
    }, default: :waiting_for_players
  
    enum :game_type, {
      quick_game: 0,
      custom_game: 1
    }, default: :quick_game
  
  has_many :game_users, dependent: :destroy
  has_many :users, through: :game_users
  has_many :tiles, dependent: :destroy
  has_many :actions, dependent: :destroy
  has_many :clans, dependent: :destroy
  has_many :biddings, dependent: :destroy
  belongs_to :submitted_by_user, class_name: 'User', optional: true
  
  validates :game_status, presence: true
  validates :game_type, presence: true
  validates :player_count, presence: true, numericality: { only_integer: true}

  before_create :set_clans_for_quick_game

  # verrifie si l'utilisateur a une partie en cours
  def self.ongoing_game(user)
    existing_game_for_user = Game.joins(:game_users)
                                  .where(game_users: { user_id: user.id, abandoned: false })
                                  .where.not(game_status: [:completed, :abandoned])
                                  .first
    if existing_game_for_user
      game_user = existing_game_for_user.game_users.find_by(user_id: user.id)
      return {game: existing_game_for_user, game_user: game_user, message: "ongoing game"}
    end
  end

  def the_clans(n)
    clans = ["black_clan","red_clan","green_clan","orange_clan","white_clan","blue_clan","purple_clan","yellow_clan"]
    clans.take(n).join(" ")
  end

  def self.find_or_create_waiting_game(user)
    # verrifie si l'utilisateur a une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      return ongoing_game
    end
    
    waiting_game = where(game_status: :waiting_for_players, game_type: :quick_game).first

    if waiting_game
      # Si on ne peut pas rejoindre la partie, on cherche une autre partie
      game_user = waiting_game.add_player(user)
      if game_user
        if waiting_game.installation_phase?
          return { game: waiting_game, game_user: game_user, message: "game ready installation_phase" }
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


  def check_turn_completion_and_broadcast(action, current_user)
    # creer des action passer le tour pour les joueurs qui ont abandonné
    game_users_abandoned = game_users.where(abandoned: true)
    if game_users_abandoned.count > 0
      game_users_abandoned.each do |game_user|
        game_user_id = game_user.id
        # regarder si il a jouer ce tour
        existing_action = actions.find_by(game_user_id: game_user_id, turn: action.turn)
        # si il n'a pas jouer ce tour, creer une action passer le tour
        if existing_action.nil?
          actions.create(game_user_id: game_user_id, turn: action.turn, position_q: nil, position_r: nil, development_level: 0, fortification_level: 0, militarisation_level: 0)
        end
      end
    end

    current_turn = action.turn
    # Compter les actions avec le même turn dans la même game
    actions_count = actions.where(turn: current_turn).count
    players_count = game_users.count
    
    puts "📊 Actions du turn #{current_turn}: #{actions_count}/#{players_count}"
    
    result = {}
    
    if actions_count == players_count
      puts "🏆 Toutes les actions sont terminées pour ce turn, tentative de finalisation..."
      
      # PROTECTION RACE CONDITION : Verrou atomique sur le statut de la game
      turn_completed = false
      
      transaction do
        reload.lock!  # Verrou pessimiste sur la game
        
        # Vérifier que la game est encore en simultaneous_play
        if simultaneous_play?
          puts "🔒 Verrou acquis, traitement de la fin du tour"

          # Incrémenter simultaneous_play_turn
          new_simultaneous_play_turn = simultaneous_play_turn + 1
          update!(simultaneous_play_turn: new_simultaneous_play_turn)
          puts "🎮 simultaneous_play_turn incrémenté: #{new_simultaneous_play_turn}"
          
          turn_completed = true
        else
          puts "⚠️ Un autre joueur a déjà finalisé ce tour (statut: #{game_status})"
        end
      end
      
      # Broadcast SEULEMENT si ce thread a gagné le verrou
      if turn_completed
        puts "📡 Broadcasting des résultats du tour..."
        GameBroadcast.game_broadcast_game_details(id)
        
        result = {
          success: true,
          message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour terminé",
          action: format_action_response(action),
          turn_completed: true
        }
      else
        puts "📡 Tour déjà finalisé par un autre joueur, broadcast des détails actuels..."
        GameBroadcast.game_broadcast_game_details(id)
        
        result = {
          success: true,
          message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour déjà terminé",
          action: format_action_response(action),
          turn_completed: true,
          already_completed: true
        }
      end
    else
      puts "⏳ En attente des autres joueurs (#{actions_count}/#{players_count})"
      
      # Notifier ce joueur qu'il attend les autres
      GameBroadcast.user_broadcast_waiting_for_others(current_user.id, id)
      
      result = {
        success: true,
        message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - En attente des autres joueurs",
        action: format_action_response(action),
        turn_completed: false,
        waiting_for_players: players_count - actions_count
      }
    end
    
    result
  end

  def check_game_completion_after_abandon
    # Compter les joueurs qui n'ont pas abandonné
    active_players = game_users.where(abandoned: false)
    active_players_count = active_players.count

    puts "🔍 Vérification de la fin de partie: #{active_players_count} joueur(s) actif(s)"
    
    if active_players_count <= 1
      puts "🏁 Fin de partie détectée (#{active_players_count} joueur(s) restant(s))"
      
      # Mettre à jour le statut de la game
      update!(game_status: :completed)
      
      # Si un seul joueur reste, il est le gagnant
      if active_players_count == 1
        winner = active_players.first
        puts "🏆 Gagnant par abandon: #{winner.user_name} (ID: #{winner.id})"
        
        # Envoyer un message au gagnant
        GameBroadcast.user_broadcast_game_won(winner.user_id, id, winner.id)
        
        # Notifier tous les joueurs de la fin de partie
        GameBroadcast.game_broadcast_game_details(id)
      else
        puts "❌ Aucun joueur actif, partie terminée sans gagnant"
        # Notifier tous les joueurs de la fin de partie
        GameBroadcast.game_broadcast_game_details(id)
      end
      
      return true
    else
      puts "✅ La partie continue (#{active_players_count} joueurs actifs)"
      return false
    end
  end

  



  

  private

  def can_add_player?
    waiting_for_players? && game_users.count < player_count
  end

  def set_clans_for_quick_game
    if quick_game?
      write_attribute(:clan_names, "red_clan yellow_clan white_clan")
    end
  end

  def initialize_game
    Rails.logger.info "Initialisation de la partie #{id}"
    create_tiles
    update(game_status: :installation_phase, biddings_turn: 1)
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

  def format_action_response(action)
    response = {
      id: action.id,
      game_user_id: action.game_user_id,
      game_id: action.game_id,
      turn: action.turn,
      position_q: action.position_q,
      position_r: action.position_r,
      development_level: action.development_level,
      fortification_level: action.fortification_level,
      militarisation_level: action.militarisation_level,
      created_at: action.created_at
    }
    
    # Ajouter updated_at seulement si différent de created_at
    response[:updated_at] = action.updated_at if action.updated_at != action.created_at
    
    response
  end

end 