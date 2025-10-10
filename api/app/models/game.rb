class Game < ApplicationRecord
    enum :game_status, {
      waiting_for_players: 0,
      waiting_for_confirmation_players: 1,
      installation_phase: 2,
      initial_placement: 3,
      bidding_phase: 4,
      starting_spot_selection: 5,
      simultaneous_play: 6,
      completed: 7,
      abandoned: 8,
      end_dispute: 9
    }, default: :waiting_for_players
  
    enum :game_type, {
      quick_game: 0,
      custom_game: 1
    }, default: :quick_game

  belongs_to :creator, class_name: 'User', optional: true
  
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

  def start_game_after_timeout
    # on peux probablement optimiser cette transaction et lock, mais elle ne devrais pas arriver souvent
    transaction do
      self.lock!
      if (self.game_status == "waiting_for_confirmation_players") && (self.updated_at < 20.seconds.ago)
        game_users = self.game_users
        game_users.each do |game_user|
          unless game_user.player_ready
            game_user.destroy
          end
        end
        self.waiting_players_count = self.game_users.count
        if self.waiting_players_count >= 2
          self.game_status = "installation_phase"
          self.player_count = self.waiting_players_count
          self.save!
          self.clan_names = self.the_clans()
          self.create_tiles_for_players()
          self.save
          return {message: "game ready installation_phase"}
        else
          self.game_status = "waiting_for_confirmation_players"
          self.save
          return {message: "missing player, waiting for player"}
        end
      end
    end
  end




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
    return nil
  end

  def the_clans()
    clans = ["black_clan","red_clan","green_clan","orange_clan","white_clan","blue_clan","purple_clan","yellow_clan"]
    clans.take(self.player_count).join(" ")
  end

  def self.find_or_create_waiting_game(user)
    # verrifie si l'utilisateur a une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      return ongoing_game
    end

    # Si on ne peut pas rejoindre la partie, on cherche une autre partie
    waiting_game = where(game_status: :waiting_for_players, game_type: :quick_game).first

    if waiting_game
      result = waiting_game.add_player(user)
      game_user = result[:game_user]
      message = result[:message]
      case message
      when "yes waiting for other players"
        return { game: waiting_game, game_user: game_user, message: "waiting for players" }
      when "too many players"
        # self.find_or_create_waiting_game(user)
      when "game ready installation_phase"
        # waiting_game.create_tiles_for_players()
        # waiting_game.clan_names=waiting_game.the_clans()
        # begin
        #   waiting_game.save!
        # rescue ActiveRecord::RecordInvalid => e
        #   Rails.logger.error "❌ Échec de la sauvegarde : #{e.record.errors.full_messages.join(', ')}"
        # end
        return { game: waiting_game, game_user: game_user, message: "game ready installation_phase" }
      end
    else
      game = create(
        player_count: 3,
        game_status: :waiting_for_players,
        game_type: :quick_game,
        waiting_players_count: 1
      )
      game_user = game.game_users.create(user: user)
      return {game: game, game_user: game_user, message: "new game"}
    end
  end

  def add_player(user)
    transaction do
      reload.lock!
      if (self.waiting_players_count < (player_count - 1)) && (self.game_status == "waiting_for_players")
        self.waiting_players_count += 1
        self.save
        game_user = self.game_users.create(user: user)
        return {message: "yes waiting for other players", game_user: game_user}

      elsif (self.waiting_players_count == (player_count - 1)) && (self.game_status == "waiting_for_players")
        self.waiting_players_count += 1
        self.game_status = :waiting_for_confirmation_players
        self.save
        game_user = self.game_users.create(user: user)
        return {message: "game ready installation_phase", game_user: game_user}

      else
        return {message: "too many players"}
      end

    end
  end

  def calculate_tile_count
    case player_count
    when 2 then 8
    when 3 then 12
    when 4 then 15
    when 5 then 19
    when 6 then 22
    when 7 then 27
    when 8 then 30
    end
  end

  def create_tiles_for_players()
    tile_count = self.calculate_tile_count
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


  def self.creat_custom_game(user)
    # on rejoind une partie si une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      game_user = ongoing_game[:game].game_users.find_by(user_id: user.id)
      return {game: ongoing_game[:game], game_user: game_user, message: "ongoing game"}
    # sinon on cree une nouvelle partie
    else
      game = nil
      custom_code = nil
      loop do
        custom_code = SecureRandom.alphanumeric(6).upcase
        game = self.create(game_type: :custom_game, game_status: :waiting_for_players, creator: user, custom_code: custom_code, player_count: 8, waiting_players_count: 1)
        unless game.persisted?
          puts "❌ Erreurs : #{game.errors.full_messages.join(', ')}"
        end
        break if game.persisted?
      end
      game_user = game.game_users.create(user: user)
      return {game: game, game_user: game_user, custom_code: custom_code, message: "new game"}
    end
  end


  def self.ongoing_game_custom(user,custom_code)
    # on rejoind une partie si une partie en cours
    ongoing_game = self.ongoing_game(user)
    if ongoing_game
      game_user = ongoing_game.game_users.find_by(user_id: user.id)
      return {game: ongoing_game, game_user: game_user, message: "ongoing game"}
    # sinon on cree une nouvelle partie
    else
      game = self.where(custom_code: custom_code)
           .where("waiting_players_count <= ?", 8)
           .first
      unless game
        return {message: "game not found"}
      else
        success = false
        Game.transaction do
          game.lock!
          var_waiting_players_count = 0
          if game.waiting_players_count < 8
            game.waiting_players_count += 1
            var_waiting_players_count = game.waiting_players_count
            game.save!
            success = true
          else
            raise ActiveRecord::Rollback
          end
        end
        unless success
          return {message: "game full"}
        else
          game_user = game.game_users.create(user: user)
          if game.waiting_players_count < 8
            return {game: game, game_user: game_user, message: "joined game and waiting for other players"}
          else
            return {game: game, game_user: game_user, message: "joined game and game ready installation_phase"}
          end
        end
      end
      
    end
  end

  def self.launch_custom_game(user,custom_code)
    game = self.where(custom_code: custom_code).first
    place_available = 0
    success = false
    Game.transaction do
      game.lock!
      if game.game_status == "waiting_for_players"
        game.game_status = "installation_phase"
        game.save!
        place_available = 8 - game.waiting_players_count
        success = true
      else
        raise ActiveRecord::Rollback
      end
    end
    unless success
      return {message: "game already in installation phase"}
    end
    if place_available > 0
      game.reassign_players(place_available)
    end
    game.game_status = "installation_phase"
    con_players_count = GameUser.where(game_id: game.id).count
    game.player_count = con_players_count
    game.save!
    game.clan_names = game.the_clans()

    # au cas ou une erreur dans mon code
    begin
      game.save!
    rescue ActiveRecord::RecordInvalid => e
      puts "Erreur lors de la sauvegarde : #{e.message}"
    end

    game.create_tiles_for_players()
    return {game: game, message: "game ready installation_phase"}

  end


  def reassign_players(place_available)
    other_game = self.where(game_status: "waiting_for_players", game_type: "quick_game").first
    if other_game
      num_players_to_move = 0
      Game.transaction do
        other_game.lock!
        if other_game.game_status == "waiting_for_players"
          num_players_to_move = [place_available, other_game.waiting_players_count].min
          other_game.waiting_players_count -= num_players_to_move
          other_game.save!

          num_players_to_move.times do |i|
            game_user = other_game.game_users.first
            game_user.game_id = self.id
            game_user.save!

            # demander desabonnement du joueur de la partie
            user = game_user.user
            user.unsubscribe_from_game(other_game.id)
          end
          self.waiting_players_count += num_players_to_move
          self.save!
        else
          raise ActiveRecord::Rollback
        end
      end
    end
  end



      


  # je n'ai pas check ce qu'a fais cursor, il y a probablement beaucoup de choses non necessaire et à optimiser
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
        GameBroadcast.game_broadcast_game_details(self.id)
        
        result = {
          success: true,
          message: "Action #{action.created_at == action.updated_at ? 'créée' : 'mise à jour'} avec succès - Tour terminé",
          action: format_action_response(action),
          turn_completed: true
        }
      else
        puts "📡 Tour déjà finalisé par un autre joueur, broadcast des détails actuels..."
        GameBroadcast.game_broadcast_game_details(self.id)
        
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

  # je n'ai pas check ce qu'a fais cursor, il y a probablement beaucoup de choses non necessaire et à optimiser
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
        GameBroadcast.game_broadcast_game_details(self.id)
      else
        puts "❌ Aucun joueur actif, partie terminée sans gagnant"
        # Notifier tous les joueurs de la fin de partie
        GameBroadcast.game_broadcast_game_details(self.id)
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

  def initialize_game
    Rails.logger.info "Initialisation de la partie #{id}"
    create_tiles
    update(game_status: :installation_phase, biddings_turn: 1)
  rescue => e
    Rails.logger.error "ERROR during game initialization for game #{id}: #{e.message}"
    raise
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